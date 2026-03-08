from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import json
from math import exp

import torch
from tokenizers import Tokenizer
from torch.nn import functional as F
from torch.utils.data import DataLoader

from inference.generate import generate_text
from model.transformer_lm import TinyCausalTransformer, TransformerConfig
from training.datasets import CausalTextDataset
from training.utils import load_yaml


PROMPTS = [
    "### Instruction:\nWhat is overfitting in machine learning?\n\n### Response:\n",
    "### Instruction:\nSummarize why sleep is important.\n\n### Response:\n",
    "### Instruction:\nList three practical ways to reduce stress at work.\n\n### Response:\n",
    "### Instruction:\nWrite a short alpaca-style response to explain recursion to a beginner.\n\n### Response:\n",
]


def load_model(ckpt_path: Path, tokenizer: Tokenizer, device: torch.device) -> TinyCausalTransformer:
    state = torch.load(ckpt_path, map_location=device)
    cfg = TransformerConfig(**state["model_cfg"])
    model = TinyCausalTransformer(cfg).to(device)
    model.load_state_dict(state["model_state"])
    model.eval()
    return model


def main() -> None:
    cfg_data = load_yaml("configs/data.yaml")
    cfg_model = load_yaml("configs/model.yaml")

    tok = Tokenizer.from_file("outputs/tokenizer/tokenizer.json")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    ckpt_path = Path("outputs/checkpoints/best.pt")
    if not ckpt_path.exists():
        raise FileNotFoundError("Missing best checkpoint. Train model first.")

    model = load_model(ckpt_path, tok, device)

    val_ds = CausalTextDataset(Path(cfg_data["data"]["processed_dir"]) / "val.jsonl", tok, int(cfg_model["model"]["context_length"]))
    val_loader = DataLoader(val_ds, batch_size=8, shuffle=False)

    losses = []
    with torch.no_grad():
        for x, y in val_loader:
            x, y = x.to(device), y.to(device)
            logits = model(x)
            loss = F.cross_entropy(logits.view(-1, logits.size(-1)), y.view(-1))
            losses.append(loss.item())

    val_loss = float(sum(losses) / max(1, len(losses)))
    ppl = float(exp(min(20, val_loss)))

    gens = []
    for p in PROMPTS:
        g = generate_text(model, tok, p, max_new_tokens=120, temperature=0.8, top_k=40, top_p=0.9, device=device)
        gens.append({"prompt": p, "generation": g})

    out_dir = Path("outputs/eval")
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "generations.json").write_text(json.dumps(gens, indent=2), encoding="utf-8")
    (out_dir / "metrics.json").write_text(json.dumps({"val_loss": val_loss, "perplexity": ppl}, indent=2), encoding="utf-8")

    print(json.dumps({"val_loss": val_loss, "perplexity": ppl, "generations_file": str(out_dir / 'generations.json')}, indent=2))


if __name__ == "__main__":
    main()
