import { readFileSync } from 'node:fs';
import { determineFilePath } from '../aux';
import { lineToArray } from './csv';

const fields = {
    start: 'Starting RGB', end: 'End RGB',
    complete: 'Complete Response Time (ms)',
    initial: 'Initial Response Time',
    perceived: 'Perceived Response Time',
    overshoot: 'Overshoot (RGB)', rating: 'Visual Response Rating'
};
const metrics = ['complete', 'initial', 'perceived', 'overshoot', 'rating'];

export function parseOSRTT(sourceFile, inputName) {
    if (typeof sourceFile !== 'string' || !sourceFile)
        throw new Error('OSRTT: sourceFile is required');
    const lines = readFileSync(determineFilePath(sourceFile, inputName), 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
    const metadataStart = lines.findIndex(line => line.trimStart().startsWith('{'));
    if (metadataStart < 0)
        throw new Error('OSRTT: missing JSON metadata after CSV measurements');
    let metadata;
    try {
        metadata = JSON.parse(lines.slice(metadataStart).join('\n'));
    } catch (error) {
        throw new Error(`OSRTT: invalid JSON metadata: ${error.message}`);
    }
    if (!metadata || !Number.isFinite(metadata.RefreshRate) || metadata.RefreshRate <= 0)
        throw new Error('OSRTT: RefreshRate must be a positive number');
    const csv = lines.slice(0, metadataStart).filter(line => line.trim());
    const header = lineToArray(csv[0] || '').map(value => value.trim());
    const indexes = Object.fromEntries(Object.entries(fields).map(([key, name]) => [key,
        key === 'initial' || key === 'perceived' ? header.findIndex(column => column.startsWith(`${name} - `) && column.endsWith('(ms)')) : header.indexOf(name)
    ]));
    if (Object.values(indexes).some(index => index < 0))
        throw new Error('OSRTT: missing required measurement columns (expected OSRTT summary export)');
    const transitions = new Map();
    for (const line of csv.slice(1)) {
        const values = lineToArray(line);
        if (values.length !== header.length)
            throw new Error('OSRTT: malformed measurement row');
        const row = Object.fromEntries(Object.entries(indexes).map(([key, index]) => [key, values[index].trim() === '' ? NaN : Number(values[index])]));
        if (![row.start, row.end].every(value => Number.isInteger(value) && value >= 0 && value <= 255) || row.start === row.end)
            throw new Error('OSRTT: transitions require distinct integer RGB levels between 0 and 255');
        const key = `${row.start}:${row.end}`;
        if (transitions.has(key))
            throw new Error(`OSRTT: duplicate transition ${key}`);
        // An all-zero export row is an unmeasured transition, not a perfect result.
        const empty = values.slice(2).every(value => value.trim() !== '' && Number(value) === 0);
        for (const metric of metrics) {
            const valid = !empty && Number.isFinite(row[metric]) && row[metric] >= 0
                && (metric !== 'overshoot' || (Number.isFinite(row.perceived) && Number.isFinite(row.rating)));
            if (!valid) row[metric] = null;
        }
        transitions.set(key, row);
    }
    if (!transitions.size)
        throw new Error('OSRTT: no measurement rows');
    const levels = [...new Set([...transitions.values()].flatMap(row => [row.start, row.end]))].sort((a, b) => a - b);
    const values = (metric, direction) => [...transitions.values()]
        .filter(row => row[metric] !== null && (!direction || (row.start < row.end) === (direction === 'rise')))
        .map(row => row[metric]);
    const mean = data => data.length ? data.reduce((sum, value) => sum + value, 0) / data.length : null;
    const extreme = (data, best) => data.length ? (best ? Math.min(...data) : Math.max(...data)) : null;
    const response = values('perceived'), errors = values('overshoot'), ratings = values('rating');
    const window = 1000 / metadata.RefreshRate;
    const within = response.filter(value => value <= window).length;
    const above = errors.filter(value => value > 10).length;
    const cycle = [transitions.get('0:255')?.perceived, transitions.get('255:0')?.perceived];
    return {
        metadata, levels, transitions,
        summary: {
            totalTransitions: levels.length * (levels.length - 1),
            validCounts: Object.fromEntries(metrics.map(metric => [metric, values(metric).length])),
            window, within, above,
            percentInWindow: response.length ? 100 * within / response.length : null,
            averageInitial: mean(values('initial')), averageComplete: mean(values('complete')),
            averagePerceived: mean(response), averageRise: mean(values('perceived', 'rise')),
            averageFall: mean(values('perceived', 'fall')),
            cycle: cycle.every(value => Number.isFinite(value)) ? cycle[0] + cycle[1] : null,
            bestPerceived: extreme(response, true), worstPerceived: extreme(response, false),
            averageOvershoot: mean(errors), worstOvershoot: extreme(errors, false),
            percentAbove10: errors.length ? 100 * above / errors.length : null,
            averageRating: mean(ratings), averageRiseRating: mean(values('rating', 'rise')),
            averageFallRating: mean(values('rating', 'fall')),
            bestRating: extreme(ratings, false), worstRating: extreme(ratings, true)
        }
    };
}
