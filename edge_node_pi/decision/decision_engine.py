def decide(plant_percent):
    """Binary spray decision based on plant infection percentage.

    plant_percent: average infection percentage (0–100) for the plant.

    Current simple rule:
        - If infection == 0%       → NO SPRAY
        - If infection  > 0%       → SPRAY for 5 seconds

    The original multi-level policy is kept below as comments
    for reference but is not used.
    """

    plant_percent = float(plant_percent)

    # --- New binary rule: 0 → no spray, >0 → spray 5s ---
    if plant_percent <= 0.0:
        return {"spray": False, "amount": 0}

    return {"spray": True, "amount": 5}

    # --- Original multi-level policy (commented out) ---
    # if plant_percent < 5.0:
    #     return {"spray": False, "amount": 0}
    # if plant_percent < 25.0:
    #     return {"spray": True, "amount": 5}
    # if plant_percent < 50.0:
    #     return {"spray": True, "amount": 10}
    # return {"spray": True, "amount": 20}
