---
name: raw-benchmark-processing
description: How to process raw benchmark data
---

1. Searched  for summary files:
    - * STATS.csv
2. Read the summary columns directly:
    - Average FPS for normal game charts
    - 1st Percentile FPS where PresentMon used that column name
3. Selectebenchmark variants:
    - Prefer B files.
    - Ignore W files when a B file exists.
    - Use the only available result when no B variant exists.
4. Round normal chart values to one decimal place.
