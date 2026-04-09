# Chart Builder

Created by the Milanfon Media team, lead by Milan Horínek. All drived work must remain open source. 

__This whole README section is still under WIP and is beign completed gradually__

_Please acknowledge that this project might be sometimes a mess because most fixed and features are done under time pressure, so the least time consuming path for a solution is usually taken._

## Prerequisities

Required software to run this project:
- Bun JS runtime
- Inkscape

Currently this software was tested and developed under MacOS, for which compatibility is guaranteed. It should also work under Linux and WSL 2. Native Windows support might require some adjustments.

## Usage

### General

For the header, the software is by default looking for these 3 values and they are placed in the header in this particular order:

```json
{
    "driver": "512.56",
    "version": "4.04",
    "settings": "High",
    ...
}
```

_This comes from the fact that the main purpose of the software is to render gaming benchmarks._ But if some of those are not defined, then it looks next to the `info` parameter, which is an array of lenght 3, containing these pairs:

```json
{
    "name": "Frekvenční charakteristika",
    "info": [
        {"title": "Frekvence", "value": "20 .. 20 000 Hz"},
        {"title": "Měřící zařízení", "value": "MiniDSP E.A.R.S."},
        {"title": "Sluchátka", "value": "JBL Tour One M3"}
    ],
    "type": "line",
    ...
}
```

__If value of one of this header parameter is not defined, then no title is shown.__

#### Text

Text can be either a __string__

```json
"Hey, I'm a text value"
```

or object with defined text and size

```json
{
    "text": "Hey, I'm a text object!",
    "size": 18
}
```

[ ] More parameters are intended to be added to the text object

#### File paths

Spoorted are both relative and absolute paths. Root of the __relative__ paths is the current _input_ directory that is beign processed.

### Bar chart

[ ] Not yet implemented

### Line chart

Line charts support multiple parsers:
- _hwi_ - HWiNFO
- _rew_ - For plotting audio
- _mangohud_ - Results from MangoHUD (uses CSV parser with fixed `headerLine: 2`)
- _csv_ - General CSV file
- _direct_ - Inline data defined directly in JSON

If `parser` is omitted for line chart, `direct` parser is used by default.

#### Common options

Top-level line chart options:

| Option | Description |
| --- | --- |
| `type` | Must be `line`. |
| `parser` | One of `direct`, `csv`, `rew`, `hwi`, `mangohud` (optional, default is `direct`). |
| `sourceFile` | Default input file (required for file-based parsers, not used by `direct`). |
| `encoding` | Optional file encoding override (default: `utf8`). |
| `units` | Text shown in line chart footer as x-axis units. |
| `values` | Array of axis definitions. |

Axis definition (`values[]`) options:

| Option | Description |
| --- | --- |
| `position` | `left` or `right`. |
| `bounds` | `[min, max]` y-axis bounds for all series on this axis. |
| `width` | Optional custom width for this axis. |
| `series` | Array of line series on this axis. |
| `show` | Optional, if `false` the whole axis block is skipped. |

Series options (used across parsers):

| Option | Description |
| --- | --- |
| `key` | Data key/column name used by parser. |
| `name` | Legend name. |
| `unit` | Legend unit label. |
| `color` | Line color in hex (without `#`). |
| `invert` | Optional, if `true` y values are inverted. |
| `index` | Optional column occurrence selector for duplicate column names. |
| `file` | Optional per-series file override (supported by `csv`, required by `rew`). |

#### Direct

The `direct` parser defines data directly in JSON, without `sourceFile`.

Each series must define a non-empty `val` parameter. Supported formats are:

- `val: [1, 2, 3]` (implicit x-axis based on index)
- `val: [[0, 1], [2, 3], [4, 2]]` (explicit `[x, y]` pairs)

All values must be numeric.

```json
{
    "name": "Direct line",
    "type": "line",
    "units": "s",
    "values": [
        {
            "bounds": [0, 100],
            "position": "left",
            "series": [
                {
                    "key": "Series A",
                    "name": "Series A",
                    "unit": "ms",
                    "color": "28a745",
                    "val": [10, 20, 15, 25]
                },
                {
                    "key": "Series B",
                    "name": "Series B",
                    "unit": "ms",
                    "color": "dc3545",
                    "val": [[0, 12], [2, 18], [4, 14]]
                }
            ]
        }
    ]
}
```

#### CSV

The `csv` parser uses `sourceFile` as the default CSV input for all series.

You can combine multiple CSV files in one line chart by setting optional `file` on selected series. When `file` is defined, that series is loaded from that file instead of `sourceFile`.

This is useful when multiple files contain the same column name (for example `FPS`) and you want to plot them together.

```json
{
    "name": "Frame rate comparison",
    "type": "line",
    "parser": "csv",
    "sourceFile": "gpu-a.csv",
    "units": "s",
    "values": [
        {
            "bounds": [0, 200],
            "position": "left",
            "series": [
                {
                    "key": "FPS",
                    "name": "GPU A",
                    "unit": "fps",
                    "color": "28a745"
                },
                {
                    "key": "FPS",
                    "name": "GPU B",
                    "unit": "fps",
                    "color": "dc3545",
                    "file": "gpu-b.csv"
                }
            ]
        }
    ]
}
```

`file` follows the same relative/absolute path rules as `sourceFile`.

#### REW

The `rew` parser is for REW TXT exports. It does not parse `.mdat` directly.

For `rew`, each series should define `file` (for example left and right channel exports).

```json
{
    "name": "Response",
    "type": "line",
    "units": "Hz",
    "parser": "rew",
    "values": [
        {
            "bounds": [0, 100],
            "position": "left",
            "series": [
                {
                    "key": "SPL(dB)",
                    "name": "SPL - Left",
                    "unit": "dB",
                    "color": "28a745",
                    "file": "Left.txt"
                },
                {
                    "key": "SPL(dB)",
                    "name": "SPL - Right",
                    "unit": "dB",
                    "color": "dc3545",
                    "file": "Right.txt"
                }
            ]
        }
    ]
}
```

#### HWiNFO

The `hwi` parser reads HWiNFO CSV exports from `sourceFile`.

Optional `limit` is supported:

- number: end index
- array: `[startIndex, endIndex]`

```json
{
    "name": "CPU stats",
    "type": "line",
    "parser": "hwi",
    "sourceFile": "hwinfo.csv",
    "limit": [1, 200],
    "values": [
        {
            "bounds": [0, 100],
            "position": "left",
            "series": [
                {
                    "key": "CPU Package [°C]",
                    "name": "CPU Package",
                    "unit": "°C",
                    "color": "dc3545"
                }
            ]
        }
    ]
}
```

#### MangoHUD

The `mangohud` parser reads MangoHUD CSV exports from `sourceFile`.

Behavior is CSV-based with fixed `headerLine: 2`.

```json
{
    "name": "Frame time",
    "type": "line",
    "parser": "mangohud",
    "sourceFile": "mangohud.csv",
    "values": [
        {
            "bounds": [0, 30],
            "position": "left",
            "series": [
                {
                    "key": "frametime",
                    "name": "Frame time",
                    "unit": "ms",
                    "color": "28a745"
                }
            ]
        }
    ]
}
```

### Table

Right now tables are called 'SPECS'

Table cells can be both text format or object that specifies both the text and it's size.

```json
{
    "name": "SPECIFIKACE",
    "type": "specs",
    "parameters": [
        "SoC",
        "Velikost displeje",
        "Displej",
        "Rozlišení displeje",
        "Hlavní kamera",
        "Ultrawide kamera",
        "Telephoto kamera",
        "Přední kamera",
        "Velikost baterie",
        "Rychlost nabíjení",
        "Bezdrátové nabíjení",
        "Cena k 12/24"
    ],
    "values": [
        {
            "name": "Pixel 9 Pro",
            "pic": {
                "path": "pixel-9-pro.png"
            },
            "val": [
                "Tensor G4",
                "6.3\"",
                {
                    "text": "OLED, HDR 2000 (3000) nit, 120 Hz",
                    "size": 22
                },
                "1280x2856 px",
                "50 MP, f/1.7, 25mm, OIS",
                "48 MP, f/2.2, 126°",
                "48 MP, f/2.8, 113mm",
                "42 MP, f/2.2, 17mm",
                "4700 mAh",
                "27W, PD 3.0",
                "21W (12W) + Reverse",
                "22 990,-"
            ]
        },
        {
            "name": "Pixel 10 Pro",
            "pic": {
                "path": "pixel-10-pro.png"
            },
            "val": [
                "Tensor G5",
                "6.3\"",
                {
                    "text": "LTPO OLED, HDR 2200 (3300) nit, 120 Hz",
                    "size": 19
                },
                "1280x2856 px",
                "50 MP, f/1.68, OIS",
                "48 MP, f/1.7, 123°, AF",
                "48 MP, f/2.8, 5x, OIS",
                "42 MP, f/2.2, 103°",
                "4870 mAh",
                "30W, USB-C PPS",
                "15W (Qi2)",
                "27 990,-"
            ]
        }
    ]
}
```

### Brightness

Plotting of __display uniformity__ from _DisplayCAL_ is also supported.

```json
{
    "name": "Uniformita podsvícení - HDR",
    "type": "brightness",
    "sourceFile": "/Users/milan/Projekty/Videos/TCL Monitor/testy/Samsung/HDR/Uniformity Check 3.8.9.3 — Odyssey G50SF @ 0, 0, 2560x1440 — 2026-04-02 13-09.html",
    "info": [
        {
            "title": "Monitor",
            "value": {
                "text": "Samsung Odyssey OLED G5 G50SF",
                "size": 14
            }
        },
        {
            "title": "Měřící zažízení",
            "value": "ColorCheckter Plus"
        }
    ]
}
```
