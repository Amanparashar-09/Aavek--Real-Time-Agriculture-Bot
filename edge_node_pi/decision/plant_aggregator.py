def aggregate_plant_severity(infected_percents):
    """Aggregate per-leaf infection into plant-level severity.

    infected_percents: list of infection percentages per leaf (0–100).

    Returns:
        avg_percent (float): average infection across leaves.
        level (int): discrete severity level 0–3.
            0: < 5%
            1: 5–25%
            2: 25–50%
            3: >= 50%
    """

    if not infected_percents:
        return 0.0, 0

    avg_percent = float(sum(infected_percents) / len(infected_percents))

    if avg_percent < 5.0:
        level = 0
    elif avg_percent < 25.0:
        level = 1
    elif avg_percent < 50.0:
        level = 2
    else:
        level = 3

    return avg_percent, level
