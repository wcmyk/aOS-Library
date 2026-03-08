from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import logging

from tokenizers import Tokenizer
from tokenizers.models import BPE
from tokenizers.pre_tokenizers import Whitespace
from tokenizers.trainers import BpeTrainer

from training.utils import load_yaml, setup_logging


def main() -> None:
    setup_logging()
    logger = logging.getLogger("tokenizer")

    cfg = load_yaml("configs/tokenizer.yaml")
    data_cfg = load_yaml("configs/data.yaml")

    processed_dir = Path(data_cfg["data"]["processed_dir"])
    train_file = processed_dir / "train.txt"
    val_file = processed_dir / "val.txt"

    if not train_file.exists() or not val_file.exists():
        raise FileNotFoundError("Processed dataset not found. Run scripts/preprocess_dataset.py first.")

    out_dir = Path(cfg["tokenizer"]["output_dir"])
    out_dir.mkdir(parents=True, exist_ok=True)

    tokenizer = Tokenizer(BPE(unk_token="[UNK]"))
    tokenizer.pre_tokenizer = Whitespace()

    trainer = BpeTrainer(
        vocab_size=int(cfg["tokenizer"].get("vocab_size", 8000)),
        min_frequency=int(cfg["tokenizer"].get("min_frequency", 2)),
        special_tokens=["[PAD]", "[UNK]", "[BOS]", "[EOS]"],
    )

    tokenizer.train([str(train_file), str(val_file)], trainer)

    path = out_dir / "tokenizer.json"
    tokenizer.save(str(path))
    logger.info("saved tokenizer: %s", path)
    logger.info("vocab size: %s", tokenizer.get_vocab_size())


if __name__ == "__main__":
    main()
