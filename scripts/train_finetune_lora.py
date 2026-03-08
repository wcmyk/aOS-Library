from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import json
import logging

import torch
from datasets import Dataset
from peft import LoraConfig
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    Trainer,
    TrainingArguments,
)

from training.utils import load_yaml, set_seed, setup_logging


def load_text_dataset(jsonl_path: str | Path) -> Dataset:
    rows = []
    with Path(jsonl_path).open("r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            obj = json.loads(line)
            if isinstance(obj, dict) and isinstance(obj.get("text"), str):
                rows.append({"text": obj["text"]})
    return Dataset.from_list(rows)


def main() -> None:
    setup_logging()
    logger = logging.getLogger("finetune")

    cfg = load_yaml("configs/finetune.yaml")["finetune"]
    set_seed(int(cfg.get("seed", 42)))

    base_model = cfg["base_model"]
    train_file = Path(cfg["train_file"])
    val_file = Path(cfg["val_file"])

    if not train_file.exists() or not val_file.exists():
        raise FileNotFoundError("Missing processed train/val jsonl. Run scripts/preprocess_dataset.py first.")

    qlora_enabled = bool(cfg.get("qlora", {}).get("enabled", False) and cfg.get("qlora", {}).get("use_4bit", False))
    quant_cfg = None
    if qlora_enabled:
        dtype_name = str(cfg["qlora"].get("bnb_4bit_compute_dtype", "bfloat16"))
        compute_dtype = torch.bfloat16 if dtype_name == "bfloat16" else torch.float16
        quant_cfg = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type=str(cfg["qlora"].get("bnb_4bit_quant_type", "nf4")),
            bnb_4bit_compute_dtype=compute_dtype,
        )
        logger.info("QLoRA enabled with 4-bit quantization")

    tokenizer = AutoTokenizer.from_pretrained(base_model)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        base_model,
        quantization_config=quant_cfg,
        device_map="auto",
    )

    lora_cfg = LoraConfig(
        r=int(cfg["lora"].get("r", 16)),
        lora_alpha=int(cfg["lora"].get("alpha", 32)),
        lora_dropout=float(cfg["lora"].get("dropout", 0.05)),
        target_modules=list(cfg["lora"].get("target_modules", [])),
        task_type="CAUSAL_LM",
    )

    train_ds = load_text_dataset(train_file)
    val_ds = load_text_dataset(val_file)

    max_seq = int(cfg.get("max_seq_length", 512))

    def tokenize_fn(batch):
        enc = tokenizer(batch["text"], truncation=True, padding="max_length", max_length=max_seq)
        enc["labels"] = enc["input_ids"].copy()
        return enc

    train_tok = train_ds.map(tokenize_fn, batched=True, remove_columns=["text"])
    val_tok = val_ds.map(tokenize_fn, batched=True, remove_columns=["text"])

    args = TrainingArguments(
        output_dir=str(cfg["output_dir"]),
        num_train_epochs=float(cfg.get("num_train_epochs", 2)),
        learning_rate=float(cfg.get("learning_rate", 2e-4)),
        per_device_train_batch_size=int(cfg.get("per_device_train_batch_size", 1)),
        per_device_eval_batch_size=int(cfg.get("per_device_eval_batch_size", 1)),
        gradient_accumulation_steps=int(cfg.get("gradient_accumulation_steps", 8)),
        warmup_ratio=float(cfg.get("warmup_ratio", 0.03)),
        weight_decay=float(cfg.get("weight_decay", 0.01)),
        logging_steps=int(cfg.get("logging_steps", 10)),
        evaluation_strategy="steps",
        eval_steps=int(cfg.get("eval_steps", 100)),
        save_steps=int(cfg.get("save_steps", 100)),
        save_total_limit=int(cfg.get("save_total_limit", 2)),
        bf16=bool(cfg.get("bf16", False) and torch.cuda.is_available()),
        fp16=bool(cfg.get("fp16", False) and torch.cuda.is_available()),
        gradient_checkpointing=bool(cfg.get("gradient_checkpointing", True)),
        report_to=[],
    )

    try:
        from peft import get_peft_model

        model = get_peft_model(model, lora_cfg)
        model.print_trainable_parameters()
    except Exception as exc:
        raise RuntimeError("Failed to attach LoRA adapter. Check base model architecture target_modules.") from exc

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=train_tok,
        eval_dataset=val_tok,
        tokenizer=tokenizer,
    )

    trainer.train()
    metrics = trainer.evaluate()

    adapter_dir = Path(cfg["adapter_dir"])
    adapter_dir.mkdir(parents=True, exist_ok=True)
    trainer.model.save_pretrained(str(adapter_dir))
    tokenizer.save_pretrained(str(adapter_dir))

    (adapter_dir / "eval_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    logger.info("Saved LoRA adapter to %s", adapter_dir)


if __name__ == "__main__":
    main()
