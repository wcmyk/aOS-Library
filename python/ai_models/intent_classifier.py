from __future__ import annotations

import json
import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple


TOKEN_RE = re.compile(r"[a-zA-Z']+")


def tokenize(text: str) -> List[str]:
    return [t.lower() for t in TOKEN_RE.findall(text)]


@dataclass
class IntentClassifier:
    labels: List[str]
    vocab: List[str]
    weights: List[List[float]]
    bias: List[float]

    @staticmethod
    def _softmax(logits: List[float]) -> List[float]:
        m = max(logits)
        exps = [math.exp(v - m) for v in logits]
        s = sum(exps)
        return [v / s for v in exps]

    def _vectorize(self, text: str) -> List[float]:
        bag = [0.0] * len(self.vocab)
        idx = {w: i for i, w in enumerate(self.vocab)}
        for token in tokenize(text):
            if token in idx:
                bag[idx[token]] += 1.0
        return bag

    def predict_proba(self, text: str) -> Dict[str, float]:
        x = self._vectorize(text)
        logits = []
        for c in range(len(self.labels)):
            logit = self.bias[c]
            for j, xj in enumerate(x):
                logit += self.weights[c][j] * xj
            logits.append(logit)
        probs = self._softmax(logits)
        return {self.labels[i]: probs[i] for i in range(len(self.labels))}

    def predict(self, text: str) -> str:
        probs = self.predict_proba(text)
        return max(probs, key=probs.get)

    def save(self, path: Path) -> None:
        payload = {
            "labels": self.labels,
            "vocab": self.vocab,
            "weights": self.weights,
            "bias": self.bias,
        }
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, indent=2))

    @classmethod
    def load(cls, path: Path) -> "IntentClassifier":
        payload = json.loads(path.read_text())
        return cls(**payload)


def train_intent_classifier(samples_path: Path, epochs: int = 500, lr: float = 0.08) -> Tuple[IntentClassifier, float]:
    samples = json.loads(samples_path.read_text())

    labels = sorted({s["label"] for s in samples})
    label_to_idx = {l: i for i, l in enumerate(labels)}

    vocab_set = set()
    for s in samples:
        vocab_set.update(tokenize(s["text"]))
    vocab = sorted(vocab_set)
    word_to_idx = {w: i for i, w in enumerate(vocab)}

    X: List[List[float]] = []
    y: List[int] = []

    for s in samples:
        vec = [0.0] * len(vocab)
        for tok in tokenize(s["text"]):
            vec[word_to_idx[tok]] += 1.0
        X.append(vec)
        y.append(label_to_idx[s["label"]])

    c = len(labels)
    d = len(vocab)

    weights = [[0.0 for _ in range(d)] for _ in range(c)]
    bias = [0.0 for _ in range(c)]

    def softmax(logits: List[float]) -> List[float]:
        m = max(logits)
        exps = [math.exp(v - m) for v in logits]
        s = sum(exps)
        return [e / s for e in exps]

    n = len(X)
    for _ in range(epochs):
        grad_w = [[0.0 for _ in range(d)] for _ in range(c)]
        grad_b = [0.0 for _ in range(c)]

        for i in range(n):
            logits = []
            for k in range(c):
                z = bias[k]
                for j in range(d):
                    z += weights[k][j] * X[i][j]
                logits.append(z)
            probs = softmax(logits)

            for k in range(c):
                yk = 1.0 if y[i] == k else 0.0
                err = probs[k] - yk
                grad_b[k] += err
                for j in range(d):
                    grad_w[k][j] += err * X[i][j]

        inv_n = 1.0 / n
        for k in range(c):
            bias[k] -= lr * grad_b[k] * inv_n
            for j in range(d):
                weights[k][j] -= lr * grad_w[k][j] * inv_n

    model = IntentClassifier(labels=labels, vocab=vocab, weights=weights, bias=bias)

    correct = 0
    for i, sample in enumerate(samples):
        pred = model.predict(sample["text"])
        if pred == labels[y[i]]:
            correct += 1
    acc = correct / len(samples)

    return model, acc
