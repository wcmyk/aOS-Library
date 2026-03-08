from __future__ import annotations

from typing import Optional

import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer


def load_finetuned_model(
    base_model_name: str,
    adapter_path: Optional[str] = None,
    merged_path: Optional[str] = None,
    device_map: str = "auto",
):
    tokenizer_source = merged_path if merged_path else base_model_name
    tokenizer = AutoTokenizer.from_pretrained(tokenizer_source)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    if merged_path:
        model = AutoModelForCausalLM.from_pretrained(merged_path, device_map=device_map)
        return model, tokenizer

    base = AutoModelForCausalLM.from_pretrained(base_model_name, device_map=device_map)
    if adapter_path:
        model = PeftModel.from_pretrained(base, adapter_path)
        return model, tokenizer

    return base, tokenizer


def generate_finetuned_text(
    model,
    tokenizer,
    prompt: str,
    max_new_tokens: int = 120,
    temperature: float = 0.8,
    top_k: int = 40,
    top_p: float = 0.9,
) -> str:
    device = next(model.parameters()).device
    encoded = tokenizer(prompt, return_tensors="pt").to(device)

    with torch.no_grad():
        out = model.generate(
            **encoded,
            do_sample=True,
            temperature=temperature,
            top_k=top_k,
            top_p=top_p,
            max_new_tokens=max_new_tokens,
            pad_token_id=tokenizer.pad_token_id,
            eos_token_id=tokenizer.eos_token_id,
        )

    return tokenizer.decode(out[0], skip_special_tokens=True)
