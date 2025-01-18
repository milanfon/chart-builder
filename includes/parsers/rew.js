import {readFileSync} from "node:fs";
import { decode } from "iconv-lite";

export function parseREWtxt(inputName, {encoding, values}) {
    const items = values.map(i => i.series);
    const fileMapping = items.flat().reduce((a, i) => {
        if (!a[i.file]) a[i.file] = [];
        a[i.file].push(i.key);
        return a;
    }, {});
    values.forEach(v => v.series.forEach(s => s.key = s.file + s.key));
    return Object.entries(fileMapping).map(([file, columns]) => {
        const buffer = readFileSync("input/"+inputName+"/"+file);
        const text = decode(buffer, encoding || 'utf-8');
        const lines = text.split('\n');
        const data = columns.reduce((a, c) => ({...a, [c]: []}), {});
        let headerFound = false;
        let lastLine = "";
        const indexes = {};

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('*')) {
                lastLine = trimmed;
                continue;
            } else if (!headerFound) {
                const header = lastLine.slice(2);
                const headerParts = header.split(' ');
                columns.forEach(c => indexes[c] = headerParts.findIndex(h => h === c));
                headerFound = true;
            }
            const parts = trimmed.split(' ');
            if (parts.length < columns.length) continue;
            columns.forEach(c => data[c].push(parseFloat(parts[indexes[c]])))
        }
        return Object.entries(data).reduce((a,[k,v]) => ({...a, [file+k]: v}), {});
    }).reduce((a, o) => ({...a, ...o}), {});
}
