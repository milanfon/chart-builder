---
name: benchmark-database-skill
description: Use this skill when the user asks for benchmark results for a GPU or CPU in this server/database.
---
# Benchmark Database Search Skill

## Endpoint

Query the running backend through GraphQL:

```bash
curl -sS -X POST http://localhost:4000/graphql \
  -H 'Content-Type: application/json' \
  --data '{"query":"query { ... }"}'
```

If the server is not running, start or query through the app's DB layer only after checking the repo context.

## GPU Search Flow

1. Search the GPU/VGA table first.

```graphql
query {
  listVGA(searchGpu: "RTX 5070", count: 20) {
    id
    name
    gpuName
    cardName
    gpuVendor { name }
    cardVendor { name }
  }
}
```

2. For each relevant VGA `id`, query benchmark records by `vgaId`.

```graphql
query {
  listTestRecords(search: { vgaId: 33 }, count: 100) {
    id
    type { name }
    settings { name }
    build { id name }
    fields { name prop value }
  }
}
```

3. For standardized GPU benchmark answers, only include records whose build name starts with `VGA Bench 2`, unless the user explicitly asks for laptop/mobile/system-specific results.

4. Filter game benchmarks by `type.name`, for example:

- `CODBO6 - 1080p`
- `CODBO6 - 1440p`
- `CODBO6 - 2160p`

5. Power records are usually separate records where `type.name` is `Spotreba` or `Spotřeba` and `settings.name` names the game, for example `COD: BO6`.

## CPU Search Flow

1. Search CPUs through component search.

```graphql
query {
  listComponents(type: "cpu", search: "Core Ultra 7", count: 20) {
    id
    name
    vendor { name }
  }
}
```

2. Query benchmark records by `cpuId`.

```graphql
query {
  listTestRecords(search: { cpuId: 12 }, count: 100) {
    id
    type { name }
    settings { name }
    build { id name }
    fields { name prop value }
  }
}
```

3. For CPU-specific requests, filter by relevant `type.name` and `settings.name` rather than assuming all returned records are CPU-only. Builds may include both CPU and GPU benchmarks.

## Schema quirks 

- `listTestRecords` must be called with `search: {}` (empty object), otherwise it may error.
- Use `count` argument (NOT `limit`).
- Avoid querying `settings.id` (and other non-null IDs) because some records have nulls and GraphQL can fail with:
  - `Cannot return null for non-nullable field Type.id`
- Safe record selection:
```graphql
query {
  listTestRecords(search: {}, count: 5000) {
    id
    note
    type { name }
    settings { name }
    build { name }
    fields { prop name value }
  }
}
```

### Time conversion/validation
Accept DB time strings in mixed formats:
- m:ss -> keep as-is
- mm:ss -> normalize to m:ss (optional)
- numeric seconds (e.g. 55, 54.2, 22.8) -> convert to m:ss using nearest second
- 0, DNR, empty -> treat as missing (leave JSON placeholder)
Helper conversion:
- sec = round(float(value))
- output f"{sec//60}:{sec%60:02d}"

### Fill policy
- Only overwrite target JSON entry when a trusted match is found.
- Keep existing non-zero values unless user asks to re-source/replace.
- For missing values, retain placeholders:
  - time chart: "0:00"
  - power chart: 0

## Output Rules

- Report the matched component IDs and names if there are multiple plausible matches.
- Prefer concise tables for benchmark summaries.
- Use `fields.prop` to identify values:
- `avg`: average FPS
- `percentile1st`: 1% low FPS
- `time`: elapsed time
- `body`, `points`: score/points
- `totalPower`: total power value
- `avgHourlyPower`: average hourly power value
- Flag suspicious data, for example a Radeon/RX GPU with `gpuVendor` set to `NVIDIA`.
- Do not mix `VGA Bench 2` desktop GPU results with laptop/mobile/system-specific builds unless requested.
- In case of multiple valid results, use always the newest one! - it will have higher ID!
- Do not edit files using scripts! Only using the patch tools!

## Example Answer Shape

For a game benchmark request, answer with:

| GPU/CPU | Build | Resolution/Test | Settings | Avg FPS/Score | 1% Low/Extra |
|---|---|---:|---|---:|---:|

For power records, use a separate table:

| GPU/CPU | Build | Scenario | Total Power | Avg Hourly Power |
|---|---|---|---:|---:|
