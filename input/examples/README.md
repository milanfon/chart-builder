# Chart regression examples

Self-contained fixtures for every chart type supported by `Page.render()`.
Measurements come from existing projects; source paths and project `.global`
template values have been made local/explicit. Shared logos, icons, colors, and
fonts still come from the chart builder itself.

## Render

Run from the repository root:

```sh
# Render every example, including all eight stepped-bar frames.
bun app.js -m batch -i examples -e svg -f

# Alternatively render PNGs with Inkscape.
bun app.js -m batch -i examples -e png -f

# Render an individual example.
bun app.js -m single -i examples/display-report-pre.json -e svg
```

Outputs go to `output/examples/`. Switching export formats replaces the previous
format's outputs. Use `-f` for regression runs: the cache tracks input JSON, not
changes to the renderer or referenced data files.

## Coverage and provenance

| Input | Type | Original project input | Coverage |
| --- | --- | --- | --- |
| `bars-gaming.json` | `bars` | `intel-arl-refresh/c-g-cbp77-1080p.json` | Two bars per item, descending sorting, icons, dates, highlighted variants, dense layout |
| `bars-render-time.json` | `bars` | `intel-arl-refresh/c-c-blender-beran.json` | `min` time strings, ascending sorting, custom bar start |
| `bars-steps.json` | `bars` | `linux-distros/g-cs2.json` | Three brand-colored bars, persistent Windows baseline, eight progressive frames |
| `line-direct.json` | `line` | `summer-pc/perf-air-percent.json` | Explicit uneven x coordinates, signed y bounds, grid and zero line |
| `line-hwi.json` | `line` | `9070-gre/t-9070-gre-codbo6.json` | Real HWiNFO CSV, left/right axes, indexed columns, percentual series scaling |
| `line-rew.json` | `line` | `fractal-scape/response.json` | Two real REW text exports, negative y bounds; exposes the existing REW x-range issue below |
| `line-csv.json` | `line` | Derived from `amd-po-roce/d-coverage-sdr.json` | Multiple per-series CSV files, shared column names, sample-index x bounds, grid |
| `specs-monitors.json` | `specs` | `oled-2026/z-specs-asus.json` | Two image columns, merged identical cells, differing values |
| `brightness.json` | `brightness` | `oled-2026/a-brightness.json` | Real DisplayCAL brightness-uniformity HTML |
| `display-report-pre.json` | `display-report` | `display-test/displaycal-report.json` | Pre-calibration patch accuracy, grayscale, chromaticity, reference/measured swatches |
| `display-report-post.json` | `display-report` | `display-test/displaycal-report-post-cal.json` | Same monitor after calibration, lower error range |
| `osrtt.json` | `osrtt` | `display-test/003-RT-AG276QSG2-360-DP-100/003-RT-AG276QSG2-360-DP-100.csv` | RGB10 response-time, overshoot and rating heatmaps, missing transitions, statistics and color keys |

The CSV coverage example preserves the original Gigabyte MO27Q2A ICE readings;
its three data arrays were transcribed into local CSV files to exercise the CSV
parser. The x axis uses sample indices 0–9, corresponding to coverage 10–100 %
(also retained in each CSV's `coverage` column). The other examples retain their
original data files or inline readings.
Project header templates were resolved using each source project's `.global`.

There are **12 input charts and 19 rendered slides** (the stepped bar chart emits
eight slides). Only the top-level JSON files are chart inputs; `data/` holds all
copied reports, logs, measurements, and product images.

## Visual regression review

Keep an approved set of renders separately, force a fresh batch after renderer
changes, and compare corresponding slides. Check labels, tick spacing, clipping,
axis borders, curves, bar order/variants, progressive visibility, merged table
cells, embedded/referenced images, and monitor readings. The standard header
shows the current month/year, so that region naturally changes across months.

### Existing issue exposed by these inputs

The REW parser returns y samples without updating the line chart's default x
bounds of `[0, 1]`. Consequently `line-rew.json` currently shows only the first
two samples, with most of the response clipped out. This reproduces the original
project's behavior; the copied measurement exports are complete. A future REW
x-axis fix should be reviewed as an intentional baseline change, rather than
approving the current nearly flat lines as a correct frequency-response plot.
