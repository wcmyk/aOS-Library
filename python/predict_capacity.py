import argparse
from pathlib import Path

from ai_models.capacity_forecaster import CapacityForecaster


ROOT = Path(__file__).resolve().parent
MODEL_PATH = ROOT / "artifacts" / "capacity_forecaster.json"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--team-capacity", type=float, required=True)
    parser.add_argument("--open-blockers", type=float, required=True)
    parser.add_argument("--velocity-trend", type=float, required=True)
    parser.add_argument("--carryover", type=float, required=True)
    args = parser.parse_args()

    model = CapacityForecaster.load(MODEL_PATH)
    prediction = model.predict(
        team_capacity=args.team_capacity,
        open_blockers=args.open_blockers,
        velocity_trend=args.velocity_trend,
        carryover=args.carryover,
    )

    print(f"predicted_next_sprint_completion={prediction:.4f}")


if __name__ == "__main__":
    main()
