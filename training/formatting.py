from __future__ import annotations


def format_alpaca_sample(instruction: str, input_text: str, output_text: str) -> str:
    instruction = instruction.strip()
    input_text = input_text.strip()
    output_text = output_text.strip()

    if input_text:
        return (
            "### Instruction:\n"
            f"{instruction}\n\n"
            "### Input:\n"
            f"{input_text}\n\n"
            "### Response:\n"
            f"{output_text}"
        )

    return (
        "### Instruction:\n"
        f"{instruction}\n\n"
        "### Response:\n"
        f"{output_text}"
    )
