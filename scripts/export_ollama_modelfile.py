from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from training.utils import load_yaml


def main() -> None:
    finetune_cfg = load_yaml("configs/finetune.yaml")["finetune"]
    inf_cfg = load_yaml("configs/inference.yaml")["inference"]

    out_dir = Path("outputs/ollama")
    out_dir.mkdir(parents=True, exist_ok=True)

    base_model = finetune_cfg["base_model"]
    adapter_dir = Path(finetune_cfg["adapter_dir"]).resolve()
    merged_dir = Path(finetune_cfg["merged_dir"]).resolve()

    modelfile = out_dir / "Modelfile"
    text = f"""# Fine-tuned path Modelfile (adapter-based)
# NOTE: Ollama adapter support depends on base model family and local Ollama version.
# If adapter route is unsupported, merge adapter first and convert merged model to GGUF.

FROM {base_model}
ADAPTER {adapter_dir}
PARAMETER temperature 0.8
PARAMETER top_p 0.9
PARAMETER num_ctx 4096
SYSTEM You are a helpful assistant fine-tuned on Alpaca-style instruction data.
"""
    modelfile.write_text(text, encoding="utf-8")

    readme = out_dir / "README_ollama.txt"
    readme.write_text(
        "\n".join([
            "Ollama export assets created.",
            f"Base model: {base_model}",
            f"Adapter path: {adapter_dir}",
            f"Merged path (optional): {merged_dir}",
            "",
            "Usage (adapter route):",
            "  ollama create alpaca-ft -f outputs/ollama/Modelfile",
            "",
            "If adapter route fails for your model family:",
            "  1) python3 scripts/merge_finetuned_adapter.py",
            "  2) Convert merged model to GGUF with llama.cpp converter",
            "  3) Update Modelfile FROM to local GGUF path",
            "",
            f"Current inference mode in config: {inf_cfg.get('mode', 'scratch')}",
        ]),
        encoding="utf-8",
    )

    print(f"wrote {modelfile}")
    print(f"wrote {readme}")


if __name__ == "__main__":
    main()
