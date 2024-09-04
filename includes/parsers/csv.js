import {readFileSync} from "node:fs";
import { decode } from "iconv-lite";

export function parseCSV(path, inputName, {encoding, columns}) {
    const buffer = readFileSync("input/"+inputName+"/"+path);
    const data = decode(buffer, encoding || 'utf8');
    const lines = data.split(`\n`);

    const header = lineToArray(lines[0]);

    const columnIndexes = columns.map(i => header.indexOf(i));

    return lines.reduce((a, l) => {
            columnIndexes.forEach((v, i) => a[columns[i]].push(l.split(",")[v]));
            return a;
        }, 
        columns.reduce((a, c) => ({...a, [c]: []}), {}));
}

function lineToArray(line) {
    return line.split(",").map(i => i.replace(/"/g, ''));
}

export function parseHWiFile(path, inputName, {encoding, columns}) {
    const vals = parseCSV(path, inputName, {encoding, columns: ["Date", "Time", ...columns]});
    Object.values(vals).forEach(v => {
        v.splice(0, 1);
        v.splice(-3, 3);
    });
    return vals;
}
