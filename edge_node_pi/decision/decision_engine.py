def decide(plant_percent):
    """Map plant-level infection percent to a simple irrigation decision.

    plant_percent: average infection percentage (0–100) for the plant.

    Policy (slightly tuned to be more conservative at low levels):
        < 5%   → no spray
        5–25%  → light spray (5s)
        25–50% → medium spray (10s)
        ≥ 50%  → heavy spray (20s)
    """

    plant_percent = float(plant_percent)

    if plant_percent < 5.0:
        return {"spray": False, "amount": 0}
    if plant_percent < 25.0:
        return {"spray": True, "amount": 5}
    if plant_percent < 50.0:
        return {"spray": True, "amount": 10}
    return {"spray": True, "amount": 20}
