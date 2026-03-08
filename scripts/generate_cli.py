from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import argparse

import torch
from tokenizers import Tokenizer

from inference.generate import generate_text
from model.transformer_lm import TinyCausalTransformer, TransformerConfig
from training.utils import load_yaml


def load_model(checkpoint_path: Path, tokenizer: Tokenizer, device: torch.device) -> TinyCausalTransformer:
    state = torch.load(checkpoint_path, map_location=device)
    raw_cfg = state.get("model_cfg")
    if raw_cfg is None:
        model_cfg = load_yaml("configs/model.yaml")["model"]
        raw_cfg = {
            **model_cfg,
            "vocab_size": tokenizer.get_vocab_size(),
        }
    cfg = TransformerConfig(**raw_cfg)
    model = TinyCausalTransformer(cfg).to(device)
    model.load_state_dict(state["model_state"])
    model.eval()
    return model


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("prompt", type=str)
    parser.add_argument("--checkpoint", default="outputs/checkpoints/best.pt")
    parser.add_argument("--temperature", type=float, default=0.8)
    parser.add_argument("--top_k", type=int, default=40)
    parser.add_argument("--top_p", type=float, default=0.9)
    parser.add_argument("--max_new_tokens", type=int, default=128)
    args = parser.parse_args()

    tok_path = Path("outputs/tokenizer/tokenizer.json")
    if not tok_path.exists():
        raise FileNotFoundError("Tokenizer missing. Run scripts/train_tokenizer.py first.")
    tokenizer = Tokenizer.from_file(str(tok_path))

    ckpt = Path(args.checkpoint)
    if not ckpt.exists():
        raise FileNotFoundError(f"Checkpoint missing: {ckpt}. Train model first.")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = load_model(ckpt, tokenizer, device)

    out = generate_text(
        model,
        tokenizer,
        prompt=args.prompt,
        max_new_tokens=args.max_new_tokens,
        temperature=args.temperature,
        top_k=args.top_k,
        top_p=args.top_p,
        device=device,
    )
    print(out)


if __name__ == "__main__":
    main()
