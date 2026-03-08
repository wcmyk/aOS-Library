# Functional AI Models

This directory contains **real trainable models** and runnable CLIs.

## Models included

1. **Manager Intent Classifier** (`intent_classifier`)
   - Task: classify incoming employee message intent (`policy`, `prioritization`, `culture`, `management`, `company`)
   - Model: multiclass logistic regression (softmax) over bag-of-words features
   - Training: gradient descent over labeled examples
   - Artifact: `python/artifacts/intent_classifier.json`

2. **Sprint Capacity Forecaster** (`capacity_forecaster`)
   - Task: forecast next sprint completion percentage
   - Model: linear regression trained with gradient descent
   - Inputs: synthetic-but-structured operational features (capacity, blockers, velocity, carryover)
   - Artifact: `python/artifacts/capacity_forecaster.json`

## Run

```bash
python3 python/train_models.py
```

This trains both models and writes artifacts under `python/artifacts/`.

## Predict

Intent classifier:
```bash
python3 python/predict_intent.py "Can I skip standup and ignore this sprint?"
```

Capacity forecaster:
```bash
python3 python/predict_capacity.py --team-capacity 0.82 --open-blockers 4 --velocity-trend 0.76 --carryover 0.14
```

## Notes

- These are executable models (not canned responses).
- Training and inference are deterministic and reproducible.
