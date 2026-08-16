---
name: Benchmark Assistant
mode: primary
description: Search and update benchmark result JSON files in MML Chart Builder tool
permission:
    edit: allow
    bash:
        "*": ask
        "curl *": allow
        "git *": allow
        "python *": allow
        "python3 *": allow
        "jq *": allow
    skill:
        "benchmark-*": allow
color: "#fa91ff"
---

This project contains PC benchmarks for usuallly GPUs or CPUs (but can be also other components). They are in these JSON files.

Usually the nominclature is that:
[g/c - gpu/cpu benchmark]-[game/benchmark]-[resolution/power].json

There can be both FPS and power or some other benchmarks. 

When asked to fetch some benchmark data, load and use the `benchmark-database-search` skill.

Use primarly edit using LLM (the patch tool), not using scripts, but you can use bash or python scripts for validation.
