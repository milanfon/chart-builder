# Chart Builder

Created by the Milanfon Media team, lead by Milan Horínek. All drived work must remain open source. 

__This whole README section is still under WIP and is beign completed gradually__

## Prerequisities

Required software to run this project:
- Bun JS runtime
- Inkscape

Currently this software was tested and developed under MacOS, for which compatibility is guaranteed. It should also work under Linux and WSL 2. Native Windows support might require some adjustments.

## Usage

### Bar chart

### Line chart

Line charts support multiple parsers. 

#### HW Stats

The main usage of the line plots is for HWiNFO statistics. Here the `hwi` parser is used.

#### Audio

One of the parsers is for plotting audio response. the `rew` parser is for the output of REW audio software. Here the program does not support directly the `.mdat` files for REW, but can utilize the `.txt` exports from REW. Usually the measurement is done for both audio channels (_left_ and _right_ side). These export files are CSV-like. Here the it is assumed that the space separator is beign used by default. As with other CSV files, this ones are also beign read by their column values specifies as the _key_ for the _series_. The problem here was that the keys are now not unique, because they are found in both of the files. To accomodate this, the _file_ identificator was added for the series item and needs to be filled in. As before, it is assumed to be in the same directory as the source JSON file. With this parser used, the key value is concantenated with the file name.

```json
{
    "name": "Response",
    "driver": "",
    "version": "",
    "type": "line",
    "units": "Hz",
    "xLabel": "Frequency",
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
