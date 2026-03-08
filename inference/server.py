from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any

import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tokenizers import Tokenizer

from inference.finetuned_generate import generate_finetuned_text, load_finetuned_model
from inference.generate import generate_text
from model.transformer_lm import TinyCausalTransformer, TransformerConfig
from training.utils import load_yaml

logger = logging.getLogger("lm-api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(name)s | %(message)s")


class ChatRequest(BaseModel):
    message: str
    max_new_tokens: int = 120
    temperature: float = 0.8
    top_k: int = 40
    top_p: float = 0.9


class ChatResponse(BaseModel):
    reply: str


app = FastAPI(title="Local LM Chat API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODE: str = "scratch"
SCRATCH_MODEL: TinyCausalTransformer | None = None
SCRATCH_TOKENIZER: Tokenizer | None = None
SCRATCH_DEVICE: torch.device | None = None

FT_MODEL: Any | None = None
FT_TOKENIZER: Any | None = None


@app.on_event("startup")
def startup_event() -> None:
    global MODE, SCRATCH_MODEL, SCRATCH_TOKENIZER, SCRATCH_DEVICE, FT_MODEL, FT_TOKENIZER

    cfg = load_yaml("configs/inference.yaml")["inference"]
    MODE = os.getenv("MODEL_BACKEND", str(cfg.get("mode", "scratch"))).strip().lower()

    logger.info("Starting API in mode=%s", MODE)

    if MODE == "finetuned":
        base_model = os.getenv("FINETUNED_BASE_MODEL", str(cfg.get("finetuned_base_model", "")))
        adapter_path = os.getenv("FINETUNED_ADAPTER_PATH", str(cfg.get("finetuned_adapter_path", "")))
        merged_path = os.getenv("FINETUNED_MERGED_PATH", str(cfg.get("finetuned_merged_path", "")))
        use_merged = bool(cfg.get("use_merged_if_available", True) and merged_path and Path(merged_path).exists())

        try:
            FT_MODEL, FT_TOKENIZER = load_finetuned_model(
                base_model_name=base_model,
                adapter_path=None if use_merged else adapter_path,
                merged_path=merged_path if use_merged else None,
                device_map="auto",
            )
            logger.info("Loaded finetuned model (%s)", "merged" if use_merged else "adapter")
        except Exception as exc:
            logger.warning("Fine-tuned model load failed: %s", exc)
        return

    tok_path = Path(os.getenv("SCRATCH_TOKENIZER_PATH", str(cfg.get("scratch_tokenizer", "outputs/tokenizer/tokenizer.json"))))
    ckpt_path = Path(os.getenv("SCRATCH_CHECKPOINT_PATH", str(cfg.get("scratch_checkpoint", "outputs/checkpoints/best.pt"))))

    if not tok_path.exists() or not ckpt_path.exists():
        logger.warning("Scratch tokenizer/checkpoint missing. /chat will return setup error.")
        return

    SCRATCH_DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    SCRATCH_TOKENIZER = Tokenizer.from_file(str(tok_path))

    state = torch.load(ckpt_path, map_location=SCRATCH_DEVICE)
    model = TinyCausalTransformer(TransformerConfig(**state["model_cfg"]))
    model.load_state_dict(state["model_state"])
    model.to(SCRATCH_DEVICE).eval()
    SCRATCH_MODEL = model

    logger.info("Loaded scratch model from %s on %s", ckpt_path, SCRATCH_DEVICE)


@app.get("/health")
def health() -> dict:
    loaded = (FT_MODEL is not None and FT_TOKENIZER is not None) if MODE == "finetuned" else (SCRATCH_MODEL is not None and SCRATCH_TOKENIZER is not None)
    return {"ok": True, "mode": MODE, "model_loaded": loaded}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    message = req.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="message must not be empty")

    prompt = f"### Instruction:\n{message}\n\n### Response:\n"

    if MODE == "finetuned":
        if FT_MODEL is None or FT_TOKENIZER is None:
            raise HTTPException(status_code=503, detail="Fine-tuned model not loaded. Train adapter first.")
        try:
            generated = generate_finetuned_text(
                FT_MODEL,
                FT_TOKENIZER,
                prompt=prompt,
                max_new_tokens=req.max_new_tokens,
                temperature=req.temperature,
                top_k=req.top_k,
                top_p=req.top_p,
            )
            reply = generated.split("### Response:\n", 1)[-1].strip() or generated.strip()
            return ChatResponse(reply=reply)
        except Exception as exc:
            logger.exception("/chat finetuned generation failed")
            raise HTTPException(status_code=500, detail=f"generation failed: {exc}") from exc

    if SCRATCH_MODEL is None or SCRATCH_TOKENIZER is None or SCRATCH_DEVICE is None:
        raise HTTPException(status_code=503, detail="Scratch model not loaded. Train tokenizer/model first.")

    try:
        generated = generate_text(
            SCRATCH_MODEL,
            SCRATCH_TOKENIZER,
            prompt=prompt,
            max_new_tokens=req.max_new_tokens,
            temperature=req.temperature,
            top_k=req.top_k,
            top_p=req.top_p,
            device=SCRATCH_DEVICE,
        )
        reply = generated.split("### Response:\n", 1)[-1].strip() or generated.strip()
        return ChatResponse(reply=reply)
    except Exception as exc:
        logger.exception("/chat scratch generation failed")
        raise HTTPException(status_code=500, detail=f"generation failed: {exc}") from exc
