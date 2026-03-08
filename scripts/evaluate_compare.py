from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import json

import torch
from tokenizers import Tokenizer

from inference.finetuned_generate import generate_finetuned_text, load_finetuned_model
from inference.generate import generate_text
from model.transformer_lm import TinyCausalTransformer, TransformerConfig
from training.utils import load_yaml

PROMPTS = [
    "### Instruction:\nWhat is overfitting in machine learning?\n\n### Response:\n",
    "### Instruction:\nSummarize why sleep is important.\n\n### Response:\n",
    "### Instruction:\nList three practical ways to reduce stress at work.\n\n### Response:\n",
    "### Instruction:\nWrite a short alpaca-style response to explain recursion to a beginner.\n\n### Response:\n",
]


def load_scratch():
    inf_cfg = load_yaml("configs/inference.yaml")["inference"]
    tok = Tokenizer.from_file(inf_cfg["scratch_tokenizer"])
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    state = torch.load(inf_cfg["scratch_checkpoint"], map_location=device)
    model = TinyCausalTransformer(TransformerConfig(**state["model_cfg"]))
    model.load_state_dict(state["model_state"])
    model.to(device).eval()
    return model, tok, device


def main() -> None:
    inf_cfg = load_yaml("configs/inference.yaml")["inference"]

    outputs = {"scratch": [], "finetuned": []}

    if Path(inf_cfg["scratch_checkpoint"]).exists() and Path(inf_cfg["scratch_tokenizer"]).exists():
        smodel, stok, sdev = load_scratch()
        for p in PROMPTS:
            outputs["scratch"].append({"prompt": p, "generation": generate_text(smodel, stok, p, device=sdev)})
    else:
        outputs["scratch_error"] = "scratch artifacts missing"

    merged_path = inf_cfg.get("finetuned_merged_path")
    adapter_path = inf_cfg.get("finetuned_adapter_path")
    base = inf_cfg.get("finetuned_base_model")

    try:
        use_merged = bool(inf_cfg.get("use_merged_if_available", True) and merged_path and Path(merged_path).exists())
        model, tok = load_finetuned_model(
            base_model_name=base,
            adapter_path=None if use_merged else adapter_path,
            merged_path=merged_path if use_merged else None,
            device_map="auto",
        )
        for p in PROMPTS:
            outputs["finetuned"].append({"prompt": p, "generation": generate_finetuned_text(model, tok, p)})
    except Exception as exc:
        outputs["finetuned_error"] = str(exc)

    out_dir = Path("outputs/eval")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "compare_scratch_vs_finetuned.json"
    out_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
    print(f"saved {out_path}")


if __name__ == "__main__":
    main()
