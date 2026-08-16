---
name: benchmark-sanity-check
description: Use this skill when ask to sanity check benchmark scores
---
# Skill: benchmark-sanity-check

Use this skill when the user asks whether benchmark results "make sense", asks for performance sanity checks, outliers, suspicious values, anomalous GPU/CPU results, or whether tested hardware performs as expected relative to peers.

This skill is for analytical checking only. Do not edit benchmark JSON files unless the user explicitly asks for fixes.

## Goal

Find benchmark values that are likely measurement errors, data-entry errors, wrong source records, wrong test settings, or otherwise surprising results compared to nearby GPUs/CPUs in the same dataset.

Prefer reporting a concise prioritized list of suspicious values rather than every statistical blip.

## Dataset assumptions

- Benchmark files are usually JSON files named like:
  - `g-<game>-<resolution>.json` for game FPS
  - `g-<game>-power.json` for game power
  - `z-*.json` for productivity/time/score benchmarks
  - `x-*.json` for aggregate or secondary charts
- Entries usually use `val`, but some workflows/files may use `value`. Support both.
- FPS/score charts are usually higher-is-better.
- Time charts are lower-is-better and may use strings like `m:ss`.
- Power/noise/value charts should not be treated as direct performance charts, but can be used for efficiency sanity checks.
- Zero placeholders (`0`, `[0]`, `[0, 0]`, `"0:00"`) usually mean missing data, not real measured values.

## Recommended workflow

1. Parse all relevant benchmark JSON files in the active input directory.
2. Validate comparable values:
   - FPS/score: use first bar/value as primary metric.
   - FPS low percentile: inspect only when primary value is suspicious or lows are wildly disproportionate.
   - Time: convert `m:ss` to seconds, where lower is better.
   - Ignore zero placeholders for performance comparisons.
3. Run three classes of sanity checks:
   - Resolution scaling within the same GPU/game.
   - Peer/ranking checks within the same test.
   - Overall normalized outlier checks across all tests.
4. Optionally run efficiency checks using FPS divided by power for matching `g-*-power.json` files.
5. Report likely issues, grouped by severity.
6. If a result is suspicious but possibly explainable by CPU limit, VRAM limit, game engine behavior, vendor-specific optimization, or benchmark variance, say so.

## Resolution scaling checks

For game FPS files, group by game and GPU across resolutions.

Flag values where:

- `1440p / 1080p > 1.03`, unless CPU-bound behavior is likely.
- `2160p / 1440p > 1.03`.
- `1440p / 1080p < 0.45`.
- `2160p / 1440p < 0.35`.

These thresholds are intentionally broad. A small 1440p-over-1080p uplift can happen from variance or CPU bottlenecks and should be reported as mild only.

## Peer/ranking checks

Compare adjacent or expected-nearby GPUs in each test. For the `9070-gre` dataset, useful expectations are:

- `RX 9070 XT` should generally be >= `RX 9070`.
- `RX 9070` should generally be >= `RX 9070 GRE`.
- `RX 9070 GRE` should generally be above `RX 9060 XT 16GB` and `RX 9060 XT 8GB`.
- `RTX 5070 Ti` should generally be above `RTX 5070`.
- `RTX 4070 Ti SUPER` should generally be above `RTX 4070 Ti`.
- `RTX 4070 Ti` should generally be above `RTX 4070`.

Do not treat every small reversal as an error. Small differences under roughly 2-5% can be benchmark variance, CPU limits, or run-to-run noise. Prioritize reversals larger than about 5-10%, and especially large anomalies above 20%.

For other datasets, infer the peer ladder from the GPUs present and current-generation naming, but be conservative.

## Normalized outlier checks

To catch values that are not obvious from pairwise checks:

1. For each test, compute the median primary performance of all non-zero entries.
2. Normalize each GPU's result by that test median.
   - For higher-is-better metrics: `normalized = value / test_median`.
   - For time metrics: convert to speed first with `1 / seconds`, then normalize.
3. For each GPU, compute its median normalized performance across tests.
4. For each GPU/test, compare its normalized result to its own overall median.
5. Flag if the per-test result is below about `0.75x` or above about `1.30x` of that GPU's usual normalized level.

Treat normalized outliers as hints. Cross-check them against resolution scaling and peer ranking before calling them likely errors.

## Power/efficiency checks

For game power sanity:

1. Match `g-<game>-power.json` to FPS files for the same game.
2. Compute average FPS across available resolutions per GPU.
3. Compute rough efficiency: `average_fps / power`.
4. Compare to the test median efficiency.
5. Flag extreme values only, e.g. below `0.55x` or above `1.45x` median.

Be cautious: power can include whole-system power or scenario-specific power, and efficiency varies by game/resolution.

## Missing values

Missing placeholders are not necessarily performance anomalies. Report them only if the user asks for completeness, or if a missing value affects a comparison/aggregate.

## Suggested helper script

When using a quick script, support both `val` and `value` keys:

```python
def get_metric(entry):
    return entry.get('val', entry.get('value'))
```

For time conversion:

```python
def time_sec(s):
    try:
        m, sec = s.split(':')
        return int(m) * 60 + int(sec)
    except Exception:
        return None
```

Use scripts for analysis/validation only. Do not use scripts to edit benchmark files unless explicitly requested; prefer patch-based edits.

## Report format

Return a concise answer with:

1. Overall verdict: broadly sane or many issues.
2. Strongest suspicious outliers table:

| File | GPU/CPU | Why suspicious |
|---|---|---|

3. Mild/possibly explainable oddities table.
4. Suggested first values to manually verify.
5. Explicitly state whether files were changed.

## Aggregate chart rounding

When updating `x-gaming-average.json` and `x-gaming-power.json`, round all numeric values to whole numbers (no decimal points) before writing them back.

## Example interpretation language

- "Very likely worth checking: this GPU drops from 1440p to 4K much more than expected and falls below a slower card."
- "Possibly explainable: 1440p is slightly faster than 1080p, which can happen in CPU-bound tests or from run variance."
- "This stands out statistically, but may be game-specific; verify source before changing."
- "I did not change any files."
