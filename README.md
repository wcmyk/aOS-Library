# Local LM Project: Scratch Experiment + Production-Oriented Fine-Tuning

This repo now supports **two parallel model paths** using `dataset/alpaca_data.json`:

1. **Scratch path (from random init)**: tiny causal transformer built from scratch for learning.
2. **Fine-tuning path (recommended for usable quality)**: LoRA/QLoRA supervised fine-tuning on a pretrained instruct base model.

## Critical honesty statement

- The scratch model is educational and not competitive.
- Alpaca-format data alone is too small/narrow for foundation-level quality.
- Use the fine-tuned path for practical chat quality.

---

## Repository layout

- `dataset/` / `dataset/processed/` - raw + processed data
- `model/` - scratch tiny transformer architecture
- `training/` - reusable utilities, formatting, dataset loaders
- `scripts/` - preprocess, tokenizer, scratch train/eval, finetune train, compare eval, merge/export
- `inference/` - generation helpers + FastAPI server
- `configs/` - data/model/training/tokenizer + finetune/inference configs
- `outputs/` - checkpoints, tokenizer artifacts, eval outputs

---

## A) Shared dataset preprocessing (used by both paths)

Place your dataset at:

- `dataset/alpaca_data.json`

Run:

```bash
python3 scripts/preprocess_dataset.py
```

What happens:

- validates schema: `instruction`, `input`, `output`
- drops malformed/empty rows
- formats each sample as Alpaca-style instruction text
- omits input section when empty
- train/val split to `dataset/processed/*.jsonl` and `*.txt`
- prints sample and character/token stats

---

## B) Scratch path (experimental)

### 1) Train tokenizer

```bash
python3 scripts/train_tokenizer.py
python3 scripts/inspect_tokenizer.py
```

### 2) Train scratch tiny causal LM

```bash
python3 scripts/train_model.py
```

Features:

- random initialization (no pretrained weights)
- next-token loss
- eval loss, checkpoints (`latest.pt`, `best.pt`)
- gradient clipping, resume, AMP on CUDA, CPU fallback

### 3) Evaluate scratch model

```bash
python3 scripts/evaluate_model.py
```

### 4) Scratch CLI inference

```bash
python3 scripts/generate_cli.py "Explain gradient clipping in simple terms"
```

---

## C) Fine-tuning path (production-oriented, recommended)

Uses PEFT LoRA/QLoRA on a pretrained instruct model.

### Supported configurable base models

- `meta-llama/Llama-3.2-3B-Instruct`
- `google/gemma-2-2b-it` (default: smallest practical)
- `mistralai/Mistral-7B-Instruct-v0.3`

Configure in `configs/finetune.yaml`.

### 1) Train LoRA adapter

```bash
python3 scripts/train_finetune_lora.py
```

Outputs:

- adapter: `outputs/finetuned/adapter`
- trainer checkpoints/metadata: `outputs/finetuned`

### 2) (Optional) Merge adapter into base weights

```bash
python3 scripts/merge_finetuned_adapter.py
```

Output:

- merged model: `outputs/finetuned/merged`

### 3) Compare scratch vs fine-tuned generations

```bash
python3 scripts/evaluate_compare.py
```

Output:

- `outputs/eval/compare_scratch_vs_finetuned.json`

---

## D) FastAPI server (same `/chat` contract for frontend)

Start API:

```bash
python3 scripts/run_api.py
```

### Mode switching

Set backend mode via env var (or `configs/inference.yaml`):

- `MODEL_BACKEND=scratch`
- `MODEL_BACKEND=finetuned`

Optional env overrides:

- `SCRATCH_CHECKPOINT_PATH`
- `SCRATCH_TOKENIZER_PATH`
- `FINETUNED_BASE_MODEL`
- `FINETUNED_ADAPTER_PATH`
- `FINETUNED_MERGED_PATH`

Health:

```bash
curl http://localhost:8000/health
```

Chat:

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How do I debug flaky tests?"}'
```

Response:

```json
{ "reply": "..." }
```

---

## E) Ollama support for fine-tuned path

Generate Modelfile assets:

```bash
python3 scripts/export_ollama_modelfile.py
```

Artifacts:

- `outputs/ollama/Modelfile`
- `outputs/ollama/README_ollama.txt`

Notes:

- Adapter support in Ollama depends on model family/version.
- If adapter route fails, merge adapter first and convert merged model to GGUF.
- Scratch path remains separate from Ollama flow.

---

## Frontend (Vite) integration

Frontend contract is unchanged: it still calls `POST /chat` with generation controls.
Neural Studio now works with either backend mode through the same endpoint.

---

## Install

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

## Key limitations

### Scratch path

- weak quality and brittle behavior
- poor generalization
- educational only

### Fine-tuned path

- significantly better than scratch for instruction-following
- still limited by model size, compute budget, and dataset quality/coverage
- not equivalent to frontier multi-stage trained LLMs
