from __future__ import annotations

import json
from pathlib import Path
from typing import List

import torch
from tokenizers import Tokenizer
from torch.utils.data import Dataset


class CausalTextDataset(Dataset):
    def __init__(self, jsonl_path: str | Path, tokenizer: Tokenizer, context_length: int) -> None:
        path = Path(jsonl_path)
        if not path.exists():
            raise FileNotFoundError(path)

        self.context_length = context_length
        texts: List[str] = []
        with path.open("r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                obj = json.loads(line)
                if isinstance(obj, dict) and isinstance(obj.get("text"), str):
                    texts.append(obj["text"])

        bos_id = tokenizer.token_to_id("[BOS]") or 2
        eos_id = tokenizer.token_to_id("[EOS]") or 3

        all_ids: List[int] = []
        for t in texts:
            ids = tokenizer.encode(t).ids
            all_ids.extend([bos_id, *ids, eos_id])

        if len(all_ids) < context_length + 1:
            all_ids = all_ids * ((context_length + 2) // max(len(all_ids), 1))

        self.tokens = torch.tensor(all_ids, dtype=torch.long)

    def __len__(self) -> int:
        return max(1, (len(self.tokens) - 1) // self.context_length)

    def __getitem__(self, idx: int):
        start = idx * self.context_length
        end = start + self.context_length + 1
        chunk = self.tokens[start:end]
        if chunk.size(0) < self.context_length + 1:
            pad = torch.full((self.context_length + 1 - chunk.size(0),), int(self.tokens[-1]), dtype=torch.long)
            chunk = torch.cat([chunk, pad], dim=0)
        x = chunk[:-1]
        y = chunk[1:]
        return x, y
