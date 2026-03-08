from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import json
import logging
from typing import Dict

import torch
from tokenizers import Tokenizer
from torch.nn import functional as F
from torch.utils.data import DataLoader

from model.transformer_lm import TinyCausalTransformer, TransformerConfig
from training.datasets import CausalTextDataset
from training.utils import load_yaml, save_json, set_seed, setup_logging


def evaluate(model: TinyCausalTransformer, loader: DataLoader, device: torch.device) -> float:
    model.eval()
    losses = []
    with torch.no_grad():
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            logits = model(x)
            loss = F.cross_entropy(logits.view(-1, logits.size(-1)), y.view(-1))
            losses.append(loss.item())
    model.train()
    return float(sum(losses) / max(1, len(losses)))


def save_checkpoint(path: Path, model: TinyCausalTransformer, optimizer: torch.optim.Optimizer, step: int, best_val: float, cfg: Dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(
        {
            "model_state": model.state_dict(),
            "optimizer_state": optimizer.state_dict(),
            "step": step,
            "best_val": best_val,
            "model_cfg": cfg["model"],
        },
        path,
    )


def main() -> None:
    setup_logging()
    logger = logging.getLogger("train")

    data_cfg = load_yaml("configs/data.yaml")
    tok_cfg = load_yaml("configs/tokenizer.yaml")
    model_cfg_raw = load_yaml("configs/model.yaml")
    train_cfg = load_yaml("configs/training.yaml")

    set_seed(int(train_cfg["training"].get("seed", 42)))

    tokenizer_path = Path(tok_cfg["tokenizer"]["output_dir"]) / "tokenizer.json"
    if not tokenizer_path.exists():
        raise FileNotFoundError("Tokenizer missing. Run scripts/train_tokenizer.py first.")

    tokenizer = Tokenizer.from_file(str(tokenizer_path))

    model_cfg = TransformerConfig(
        vocab_size=tokenizer.get_vocab_size(),
        context_length=int(model_cfg_raw["model"]["context_length"]),
        d_model=int(model_cfg_raw["model"]["d_model"]),
        n_heads=int(model_cfg_raw["model"]["n_heads"]),
        n_layers=int(model_cfg_raw["model"]["n_layers"]),
        ff_hidden_dim=int(model_cfg_raw["model"]["ff_hidden_dim"]),
        dropout=float(model_cfg_raw["model"]["dropout"]),
    )

    train_ds = CausalTextDataset(Path(data_cfg["data"]["processed_dir"]) / "train.jsonl", tokenizer, model_cfg.context_length)
    val_ds = CausalTextDataset(Path(data_cfg["data"]["processed_dir"]) / "val.jsonl", tokenizer, model_cfg.context_length)

    bs = int(train_cfg["training"]["batch_size"])
    train_loader = DataLoader(train_ds, batch_size=bs, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=bs, shuffle=False)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = TinyCausalTransformer(model_cfg).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=float(train_cfg["training"]["learning_rate"]))
    use_amp = bool(train_cfg["training"].get("mixed_precision", True) and device.type == "cuda")
    scaler = torch.cuda.amp.GradScaler(enabled=use_amp)

    ckpt_dir = Path(train_cfg["training"]["checkpoint_dir"])
    latest_path = ckpt_dir / "latest.pt"
    best_path = ckpt_dir / "best.pt"

    start_step = 0
    best_val = float("inf")

    if bool(train_cfg["training"].get("resume", False)) and latest_path.exists():
        logger.info("Resuming from %s", latest_path)
        state = torch.load(latest_path, map_location=device)
        model.load_state_dict(state["model_state"])
        optimizer.load_state_dict(state["optimizer_state"])
        start_step = int(state.get("step", 0))
        best_val = float(state.get("best_val", best_val))

    max_steps = int(train_cfg["training"]["max_steps"])
    eval_every = int(train_cfg["training"]["eval_every"])
    save_every = int(train_cfg["training"]["save_every"])
    grad_clip = float(train_cfg["training"]["grad_clip"])

    step = start_step
    train_losses = []
    val_losses = []

    while step < max_steps:
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad(set_to_none=True)

            with torch.cuda.amp.autocast(enabled=use_amp):
                logits = model(x)
                loss = F.cross_entropy(logits.view(-1, logits.size(-1)), y.view(-1))

            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), grad_clip)
            scaler.step(optimizer)
            scaler.update()

            step += 1
            train_losses.append(loss.item())

            if step % eval_every == 0:
                val_loss = evaluate(model, val_loader, device)
                val_losses.append({"step": step, "val_loss": val_loss})
                logger.info("step=%s train_loss=%.4f val_loss=%.4f", step, loss.item(), val_loss)
                if val_loss < best_val:
                    best_val = val_loss
                    save_checkpoint(best_path, model, optimizer, step, best_val, {"model": model_cfg.__dict__})

            if step % save_every == 0:
                save_checkpoint(latest_path, model, optimizer, step, best_val, {"model": model_cfg.__dict__})

            if step >= max_steps:
                break

    save_checkpoint(latest_path, model, optimizer, step, best_val, {"model": model_cfg.__dict__})

    metrics = {
        "steps": step,
        "best_val_loss": best_val,
        "last_train_loss": train_losses[-1] if train_losses else None,
        "val_losses": val_losses,
    }
    save_json(Path(train_cfg["training"]["output_dir"]) / "metrics.json", metrics)

    try:
        import matplotlib.pyplot as plt

        xs = [v["step"] for v in val_losses]
        ys = [v["val_loss"] for v in val_losses]
        if xs:
            plt.figure(figsize=(6, 4))
            plt.plot(xs, ys)
            plt.xlabel("step")
            plt.ylabel("val_loss")
            plt.title("Validation Loss")
            out = Path(train_cfg["training"]["output_dir"]) / "loss_curve.png"
            out.parent.mkdir(parents=True, exist_ok=True)
            plt.tight_layout()
            plt.savefig(out)
            logger.info("saved %s", out)
    except Exception as exc:  # best effort artifact
        logger.warning("loss curve skipped: %s", exc)

    logger.info("training complete: %s", json.dumps(metrics))


if __name__ == "__main__":
    main()
