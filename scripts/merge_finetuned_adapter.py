from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

from training.utils import load_yaml


def main() -> None:
    cfg = load_yaml("configs/finetune.yaml")["finetune"]
    base_model = cfg["base_model"]
    adapter_dir = Path(cfg["adapter_dir"])
    merged_dir = Path(cfg["merged_dir"])

    if not adapter_dir.exists():
        raise FileNotFoundError(f"Adapter not found: {adapter_dir}")

    tokenizer = AutoTokenizer.from_pretrained(adapter_dir)
    base = AutoModelForCausalLM.from_pretrained(base_model, device_map="auto")
    peft_model = PeftModel.from_pretrained(base, str(adapter_dir))

    merged = peft_model.merge_and_unload()
    merged_dir.mkdir(parents=True, exist_ok=True)
    merged.save_pretrained(str(merged_dir))
    tokenizer.save_pretrained(str(merged_dir))
    print(f"merged model saved to {merged_dir}")


if __name__ == "__main__":
    main()
