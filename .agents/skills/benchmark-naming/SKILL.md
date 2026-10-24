---
name: benchmark-naming
description: How are benchmark files named
---

# Raw files

If you are reading RAW benchmark files they are usually from games captured using one of those

- PresentMon
- OCAT
- MangoHud

And there are usually stored csv files with all the measurements and then summary, which I usually name `STATS`.

The files are named like this

`<GAME> <RESOLUTION> <?VARIANT> <?STATS> <?NUMBER>`

(_Order may vary_)

The `GAME` part is an acronym of game according to `game-name-mapping.csv`.

Resolution like `1080p`, `1440p`, `2160p`, ...

`VARIANT` is:
    - `B` - Best result
    - `W` - Worse result but kept for reference
    - If possible use the `B` variant. If no `B` variant is present, ask user which number of the benchmark to use

`NUMBER` - There are usually more benchmarks and they can be grouped by number, but please group them with their `STATS` by date and time of creation becuase that is how it should be done. The numbers can be meaningless.

`STATS` indicates a summary file. Usually use this to read the avg FPS, frametimes, percentiles, etc. so you don't have to calculate it.
