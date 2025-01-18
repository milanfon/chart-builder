# Chart Builder

Created by the Milanfon Media team, lead by Milan Horínek. All drived work must remain open source. 

__This whole README section is still under WIP and is beign completed gradually__

## Prerequisities

Required software to run this project:
- Bun JS runtime
- Inkscape

Currently this software was tested and developed under MacOS, for which compatibility is guaranteed. It should also work under Linux and WSL 2. Native Windows support might require some adjustments.

## Usage

### Generate charts

#### Line chart

Line charts support multiple parsers. 

##### HW Stats

The main usage of the line plots is for HWiNFO statistics. Here the `hwi` parser is used.

##### Audio

One of the parsers is for plotting audio response. the `rew` parser is for the output of REW audio software. Here the program does not support directly the `.mdat` files for REW, but can utilize the `.txt` exports from REW. Usually the measurement is done for both audio channels (_left_ and _right_ side). These export files are CSV-like. Here the it is presumed that the space separator is beign used by default. As with other CSV files, this ones are also beign read by their column values specifies as the _key_ for the _series_. The problem here was that the keys are now not unique, because they are found in both of the files. To accomodate this, the _file_ identificator for added for the series item and needs to be filled in. As before, it is presumed to be in the same directory as the source JSON file. With this parser used, the key value is concantenated with the file name.

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
