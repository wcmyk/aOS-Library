from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import json
import logging
import random
from typing import Dict, List, Tuple

from training.utils import load_yaml, setup_logging


def format_sample(instruction: str, input_text: str, output_text: str) -> str:
    instruction = instruction.strip()
    input_text = input_text.strip()
    output_text = output_text.strip()

    if input_text:
        return (
            "### Instruction:\n"
            f"{instruction}\n\n"
            "### Input:\n"
            f"{input_text}\n\n"
            "### Response:\n"
            f"{output_text}"
        )

    return (
        "### Instruction:\n"
        f"{instruction}\n\n"
        "### Response:\n"
        f"{output_text}"
    )


def validate_row(row: Dict[str, object]) -> Tuple[bool, str]:
    for key in ("instruction", "input", "output"):
        if key not in row:
            return False, f"missing key: {key}"
        if not isinstance(row[key], str):
            return False, f"{key} must be str"

    if not row["instruction"].strip() or not row["output"].strip():
        return False, "empty instruction/output"

    return True, "ok"


def main() -> None:
    setup_logging()
    logger = logging.getLogger("preprocess")

    cfg = load_yaml("configs/data.yaml")
    source = Path(cfg["data"]["source_path"])
    out_dir = Path(cfg["data"]["processed_dir"])
    val_ratio = float(cfg["data"].get("val_ratio", 0.05))
    seed = int(cfg["data"].get("seed", 42))

    if not source.exists():
        raise FileNotFoundError(
            f"Dataset not found at {source}. Place alpaca json at this path before preprocessing."
        )

    raw = json.loads(source.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError("alpaca_data.json must contain a JSON array")

    clean: List[Dict[str, str]] = []
    dropped = 0

    for row in raw:
        if not isinstance(row, dict):
            dropped += 1
            continue
        ok, _ = validate_row(row)
        if not ok:
            dropped += 1
            continue
        clean.append({
            "instruction": row["instruction"].strip(),
            "input": row["input"].strip(),
            "output": row["output"].strip(),
        })

    random.Random(seed).shuffle(clean)
    val_size = max(1, int(len(clean) * val_ratio)) if clean else 0
    val_rows = clean[:val_size]
    train_rows = clean[val_size:]

    out_dir.mkdir(parents=True, exist_ok=True)

    def write_split(rows: List[Dict[str, str]], name: str) -> None:
        jsonl_path = out_dir / f"{name}.jsonl"
        txt_path = out_dir / f"{name}.txt"

        with jsonl_path.open("w", encoding="utf-8") as jf, txt_path.open("w", encoding="utf-8") as tf:
            for row in rows:
                sample = format_sample(row["instruction"], row["input"], row["output"])
                jf.write(json.dumps({"text": sample}, ensure_ascii=False) + "\n")
                tf.write(sample + "\n\n")

    write_split(train_rows, "train")
    write_split(val_rows, "val")

    all_text = [format_sample(r["instruction"], r["input"], r["output"]) for r in clean]
    chars = sum(len(x) for x in all_text)
    tokens_approx = sum(len(x.split()) for x in all_text)

    logger.info("raw rows: %s", len(raw))
    logger.info("clean rows: %s", len(clean))
    logger.info("dropped rows: %s", dropped)
    logger.info("train rows: %s | val rows: %s", len(train_rows), len(val_rows))
    logger.info("characters: %s | approx whitespace tokens: %s", chars, tokens_approx)


if __name__ == "__main__":
    main()
