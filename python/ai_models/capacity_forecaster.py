from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple


FEATURES = ["team_capacity", "open_blockers", "velocity_trend", "carryover"]
TARGET = "next_sprint_completion"


@dataclass
class CapacityForecaster:
    weights: List[float]
    bias: float

    def predict(self, team_capacity: float, open_blockers: float, velocity_trend: float, carryover: float) -> float:
        x = [team_capacity, open_blockers, velocity_trend, carryover]
        y = self.bias + sum(w * v for w, v in zip(self.weights, x))
        return max(0.0, min(1.0, y))

    def save(self, path: Path) -> None:
        payload = {"weights": self.weights, "bias": self.bias}
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, indent=2))

    @classmethod
    def load(cls, path: Path) -> "CapacityForecaster":
        payload = json.loads(path.read_text())
        return cls(**payload)


def _load_csv(path: Path) -> List[Dict[str, float]]:
    with path.open() as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            rows.append({k: float(v) for k, v in row.items()})
        return rows


def train_capacity_forecaster(training_csv: Path, epochs: int = 4000, lr: float = 0.02) -> Tuple[CapacityForecaster, float]:
    rows = _load_csv(training_csv)
    X = [[r[f] for f in FEATURES] for r in rows]
    y = [r[TARGET] for r in rows]

    d = len(FEATURES)
    n = len(X)

    w = [0.0] * d
    b = 0.0

    for _ in range(epochs):
        grad_w = [0.0] * d
        grad_b = 0.0

        for i in range(n):
            pred = b + sum(w[j] * X[i][j] for j in range(d))
            err = pred - y[i]
            grad_b += err
            for j in range(d):
                grad_w[j] += err * X[i][j]

        inv_n = 1.0 / n
        b -= lr * grad_b * inv_n
        for j in range(d):
            w[j] -= lr * grad_w[j] * inv_n

    model = CapacityForecaster(weights=w, bias=b)

    mse = 0.0
    for i in range(n):
        pred = b + sum(w[j] * X[i][j] for j in range(d))
        mse += (pred - y[i]) ** 2
    mse /= n

    return model, mse
