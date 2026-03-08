# Scratch Causal LM Experiment (Alpaca-format)

This repository now includes a **complete experimental causal language model training pipeline from scratch** using `dataset/alpaca_data.json`.

## Important honesty statement

This project is intentionally a **small local learning/prototyping experiment**:

- Model weights are **randomly initialized**.
- No pretrained base model is used.
- No LoRA / QLoRA / adapters are used.
- Dataset is Alpaca instruction data, which is far too small/narrow to produce a competitive general-purpose LLM.

### What this means in practice

- Expect weak generations and unstable behavior.
- Expect poor generalization and hallucinations.
- This is **not comparable** to production LLMs trained on internet-scale corpora.

Use this to understand training mechanics end-to-end, not to build a production assistant.

---

## Project layout

- `dataset/` - raw dataset location (`dataset/alpaca_data.json`)
- `dataset/processed/` - cleaned/split processed data
- `scripts/` - preprocessing, tokenizer training, model training, eval, generation CLI, API runner
- `training/` - reusable training utilities/dataset code
- `model/` - tiny decoder-only transformer implementation (PyTorch)
- `inference/` - text generation utilities + FastAPI server
- `configs/` - YAML configs for data/tokenizer/model/training
- `outputs/` - tokenizer artifacts, checkpoints, metrics, eval generations
- `requirements.txt` - Python dependencies
- `.env.example` - optional environment variables for API

---

## Hardware expectations

- CPU training is supported but slow.
- CUDA GPU is recommended for meaningful iteration speed.
- Default model is intentionally small:
  - `context_length: 256`
  - `d_model: 256`
  - `n_heads: 4`
  - `n_layers: 4`
  - `ff_hidden_dim: 1024`

---

## 1) Install

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

## 2) Prepare dataset

Place your Alpaca file at:

- `dataset/alpaca_data.json`

Expected row schema:

```json
{
  "instruction": "...",
  "input": "...",
  "output": "..."
}
```

Preprocess + split:

```bash
python3 scripts/preprocess_dataset.py
```

What it does:

- validates required fields (`instruction`, `input`, `output`)
- drops malformed/empty rows
- formats samples into consistent instruction-response text blocks
- omits `### Input:` section when empty
- writes:
  - `dataset/processed/train.jsonl`
  - `dataset/processed/val.jsonl`
  - `dataset/processed/train.txt`
  - `dataset/processed/val.txt`
- prints sample count and character/token stats

---

## 3) Train tokenizer

```bash
python3 scripts/train_tokenizer.py
```

Artifacts:

- `outputs/tokenizer/tokenizer.json`

Inspect:

```bash
python3 scripts/inspect_tokenizer.py
```

---

## 4) Train tiny causal transformer from scratch

```bash
python3 scripts/train_model.py
```

Features included:

- next-token prediction loss
- validation loss
- checkpoint saving (`latest.pt`, `best.pt`)
- gradient clipping
- resume support
- mixed precision on CUDA (with CPU fallback)
- metrics JSON + optional loss curve PNG

Outputs:

- `outputs/checkpoints/latest.pt`
- `outputs/checkpoints/best.pt`
- `outputs/metrics.json`
- `outputs/loss_curve.png` (best effort)

Resume training:

1. Set `training.resume: true` in `configs/training.yaml`
2. Re-run:

```bash
python3 scripts/train_model.py
```

---

## 5) Evaluate

```bash
python3 scripts/evaluate_model.py
```

Outputs:

- `outputs/eval/metrics.json` (val loss + perplexity)
- `outputs/eval/generations.json` (fixed prompt generations)

Prompt set includes:

- direct QA
- summarization
- instruction following
- alpaca-style instruction prompt

---

## 6) CLI inference

```bash
python3 scripts/generate_cli.py "Explain gradient clipping for beginners" \
  --temperature 0.8 --top_k 40 --top_p 0.9 --max_new_tokens 120
```

---

## 7) FastAPI server (`/chat`)

Run local server:

```bash
python3 scripts/run_api.py
```

Health check:

```bash
curl http://localhost:8000/health
```

Chat call:

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Give me three steps to debug a flaky API test."}'
```

Response format:

```json
{ "reply": "..." }
```

If tokenizer/checkpoint is missing, `/chat` returns setup errors rather than silently faking responses.

---

## 8) Vite frontend integration snippet

```ts
async function chatWithLocalModel(message: string) {
  const res = await fetch('http://localhost:8000/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.detail || 'Chat request failed');
  }

  const data: { reply: string } = await res.json();
  return data.reply;
}
```

---

## Common failure modes

- **`dataset/alpaca_data.json` missing**
  - Put dataset file in the required path before preprocessing.
- **Tokenizer not found**
  - Run preprocessing, then tokenizer training.
- **`/chat` returns 503**
  - Train model first so `outputs/checkpoints/best.pt` exists.
- **Poor output quality**
  - Expected for tiny scratch models + limited data.

---

## Limitations (explicit)

- Tiny model capacity.
- Small, narrow instruction dataset.
- Limited context window.
- No large-scale pretraining.
- Generation quality likely low and brittle.

Again: this pipeline is for **education, debugging, and local prototyping**.
