---
name: benchmark-calculate-average
description: Use this skill to calculate average gaming and power score
---
## Aggregate gaming charts (`x-gaming-average.json`, `x-gaming-power.json`)

Use this workflow when updating aggregate gaming averages from individual `g-*.json` files.

### Target files

- `x-gaming-average.json`
  - FPS averages by resolution
  - bars: `1080p`, `1440p`, `2160p`
- `x-gaming-power.json`
  - average gaming power
  - bar: `Průměrná hodinová spotřeba`

### Source files

Use only files in the same input folder.
For `x-gaming-average.json`, source from:
- `g-*-1080p.json`
- `g-*-1440p.json`
- `g-*-2160p.json`
For `x-gaming-power.json`, source from:
- `g-*-power.json`

### Value fields

For FPS charts:
- Use only `val[0]` = average FPS.
- Ignore `val[1]` = 1% low for aggregate average charts.
For power charts:
- Use `val[0]` = average hourly power / gaming power.

### Missing values

Treat these as missing and exclude from averages:
- `0`
- `"0:00"`
- empty arrays
- missing GPU entry
Do **not** count missing values as zero.

### GPU matching

Match by exact `name` field.
Examples:
- `RX 9070 GRE`
- `RX 9060 XT 16GB`
- `RTX 5060 Ti 16GB`
Do not normalize GPU names unless explicitly instructed.

### Calculation

For each GPU:

#### FPS aggregate
For each resolution separately:
```text
1080p average = mean(val[0] from all non-zero g-*-1080p.json files for that GPU)
1440p average = mean(val[0] from all non-zero g-*-1440p.json files for that GPU)
2160p average = mean(val[0] from all non-zero g-*-2160p.json files for that GPU)
```
#### Power aggregate
gaming power average = mean(val[0] from all non-zero g-*-power.json files for that GPU)
Rounding
Round final aggregate values in `x-gaming-average.json` and `x-gaming-power.json` to whole numbers only; do not write decimal points.
Examples:
- 155.555... → 156
- 359.454... → 359
- 93.5 → 94

#### Updating files
Only update aggregate entries for GPUs requested by the user, unless asked to refresh all.
Preserve existing metadata:
- date
- model
- icon
- variant
- show
Do not recalculate unrelated GPUs unless requested.

#### Validation
After updating:
1. Validate JSON syntax.
2. Report:
   - GPU name
   - source count per resolution / power
   - final aggregate values
Example report:
RX 9070 GRE:
- 1080p: 9 records → 155.6
- 1440p: 9 records → 127.2
- 2160p: 11 records → 81.4
- power: 11 records → 359.5

# Notes
Some GPUs may have fewer source records than others. This is expected when only some games have been tested. Never fill aggregate values with zeros for missing games unless explicitly instructed.
