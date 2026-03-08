from __future__ import annotations

import logging
from pathlib import Path

import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tokenizers import Tokenizer

from inference.generate import generate_text
from model.transformer_lm import TinyCausalTransformer, TransformerConfig

logger = logging.getLogger("scratch-lm-api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(name)s | %(message)s")


class ChatRequest(BaseModel):
    message: str
    max_new_tokens: int = 120
    temperature: float = 0.8
    top_k: int = 40
    top_p: float = 0.9


class ChatResponse(BaseModel):
    reply: str


app = FastAPI(title="Scratch LM Chat API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL: TinyCausalTransformer | None = None
TOKENIZER: Tokenizer | None = None
DEVICE: torch.device | None = None


@app.on_event("startup")
def startup_event() -> None:
    global MODEL, TOKENIZER, DEVICE

    tok_path = Path("outputs/tokenizer/tokenizer.json")
    ckpt_path = Path("outputs/checkpoints/best.pt")

    if not tok_path.exists() or not ckpt_path.exists():
        logger.warning("Tokenizer/checkpoint missing. API started but /chat will return setup error.")
        return

    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    TOKENIZER = Tokenizer.from_file(str(tok_path))

    state = torch.load(ckpt_path, map_location=DEVICE)
    cfg = TransformerConfig(**state["model_cfg"])
    MODEL = TinyCausalTransformer(cfg).to(DEVICE)
    MODEL.load_state_dict(state["model_state"])
    MODEL.eval()

    logger.info("Loaded model from %s on %s", ckpt_path, DEVICE)


@app.get("/health")
def health() -> dict:
    return {"ok": True, "model_loaded": MODEL is not None and TOKENIZER is not None}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    if MODEL is None or TOKENIZER is None or DEVICE is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Train tokenizer/model first.")

    message = req.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="message must not be empty")

    prompt = f"### Instruction:\n{message}\n\n### Response:\n"

    try:
        generated = generate_text(
            MODEL,
            TOKENIZER,
            prompt=prompt,
            max_new_tokens=req.max_new_tokens,
            temperature=req.temperature,
            top_k=req.top_k,
            top_p=req.top_p,
            device=DEVICE,
        )
        reply = generated.split("### Response:\n", 1)[-1].strip()
        if not reply:
            reply = generated.strip()
        return ChatResponse(reply=reply)
    except Exception as exc:
        logger.exception("/chat generation failed")
        raise HTTPException(status_code=500, detail=f"generation failed: {exc}") from exc
