from __future__ import annotations

from typing import Optional

import torch
from tokenizers import Tokenizer

from model.transformer_lm import TinyCausalTransformer


def sample_next_token(logits: torch.Tensor, temperature: float, top_k: int, top_p: float) -> int:
    logits = logits / max(temperature, 1e-5)

    if top_k > 0:
        v, idx = torch.topk(logits, min(top_k, logits.size(-1)))
        mask = torch.full_like(logits, float("-inf"))
        mask[idx] = v
        logits = mask

    probs = torch.softmax(logits, dim=-1)

    if 0 < top_p < 1.0:
        sorted_probs, sorted_idx = torch.sort(probs, descending=True)
        cumulative = torch.cumsum(sorted_probs, dim=-1)
        cutoff = cumulative > top_p
        cutoff[..., 1:] = cutoff[..., :-1].clone()
        cutoff[..., 0] = False
        sorted_probs[cutoff] = 0
        sorted_probs = sorted_probs / sorted_probs.sum()
        next_id = sorted_idx[torch.multinomial(sorted_probs, num_samples=1)]
        return int(next_id.item())

    return int(torch.multinomial(probs, num_samples=1).item())


def generate_text(
    model: TinyCausalTransformer,
    tokenizer: Tokenizer,
    prompt: str,
    max_new_tokens: int = 128,
    temperature: float = 0.8,
    top_k: int = 40,
    top_p: float = 0.9,
    device: Optional[torch.device] = None,
) -> str:
    device = device or next(model.parameters()).device
    model.eval()

    bos_id = tokenizer.token_to_id("[BOS]") or 2
    eos_id = tokenizer.token_to_id("[EOS]") or 3

    ids = [bos_id] + tokenizer.encode(prompt).ids
    x = torch.tensor(ids, dtype=torch.long, device=device).unsqueeze(0)

    for _ in range(max_new_tokens):
        x_cond = x[:, -model.cfg.context_length :]
        with torch.no_grad():
            logits = model(x_cond)
        next_logits = logits[0, -1, :]
        next_id = sample_next_token(next_logits, temperature=temperature, top_k=top_k, top_p=top_p)

        x = torch.cat([x, torch.tensor([[next_id]], device=device)], dim=1)
        if next_id == eos_id:
            break

    decoded = tokenizer.decode(x[0].tolist(), skip_special_tokens=True)
    return decoded
