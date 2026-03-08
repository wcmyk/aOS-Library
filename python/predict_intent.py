import argparse
from pathlib import Path

from ai_models.intent_classifier import IntentClassifier


ROOT = Path(__file__).resolve().parent
MODEL_PATH = ROOT / "artifacts" / "intent_classifier.json"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("text", help="employee message text")
    args = parser.parse_args()

    model = IntentClassifier.load(MODEL_PATH)
    probs = model.predict_proba(args.text)
    label = max(probs, key=probs.get)

    print(f"intent={label}")
    for k in sorted(probs):
        print(f"{k}: {probs[k]:.4f}")


if __name__ == "__main__":
    main()
