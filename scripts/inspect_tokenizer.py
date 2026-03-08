from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


from tokenizers import Tokenizer

from training.utils import load_yaml


def main() -> None:
    cfg = load_yaml("configs/tokenizer.yaml")
    tok_path = Path(cfg["tokenizer"]["output_dir"]) / "tokenizer.json"
    if not tok_path.exists():
        raise FileNotFoundError(f"Tokenizer not found at {tok_path}")

    tok = Tokenizer.from_file(str(tok_path))
    sample = "### Instruction:\nExplain overfitting in plain language.\n\n### Response:\nOverfitting means memorizing training data."

    enc = tok.encode(sample)
    dec = tok.decode(enc.ids)

    print(f"tokenizer: {tok_path}")
    print(f"vocab_size={tok.get_vocab_size()}")
    print(f"sample_token_count={len(enc.ids)}")
    print("first_30_ids=", enc.ids[:30])
    print("decoded_preview=", dec[:180])


if __name__ == "__main__":
    main()
