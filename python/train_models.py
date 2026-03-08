from pathlib import Path

from ai_models.capacity_forecaster import train_capacity_forecaster
from ai_models.intent_classifier import train_intent_classifier


ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
ARTIFACTS = ROOT / "artifacts"


def main() -> None:
    intent_model, acc = train_intent_classifier(DATA / "intent_samples.json")
    intent_path = ARTIFACTS / "intent_classifier.json"
    intent_model.save(intent_path)

    cap_model, mse = train_capacity_forecaster(DATA / "capacity_training.csv")
    cap_path = ARTIFACTS / "capacity_forecaster.json"
    cap_model.save(cap_path)

    print(f"intent_classifier saved: {intent_path}")
    print(f"intent_classifier training_accuracy: {acc:.3f}")
    print(f"capacity_forecaster saved: {cap_path}")
    print(f"capacity_forecaster training_mse: {mse:.6f}")


if __name__ == "__main__":
    main()
