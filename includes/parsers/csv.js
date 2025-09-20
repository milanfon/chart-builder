import {readFileSync} from "node:fs";
import { decode } from "iconv-lite";

export function parseCSV(path, inputName, {encoding, columns, indexes, headerLine = 0}) {
    const buffer = readFileSync("input/"+inputName+"/"+path);
    const data = decode(buffer, encoding || 'utf8');
    let lines = data.split(`\n`);

    const header = lineToArray(lines[headerLine]);
    console.log("Header columns: ", header.length, "Data columns: ", lineToArray(lines[headerLine+1]).length);

    lines = lines.slice(headerLine+1);

    const columnIndexes = columns.map(i => {
        if (indexes && indexes[i]) {
            if ((indexes[i] + "").startsWith("d"))
                return indexes[i].substring(1);
            let hit = 0;
            let res = -1;
            do {
                res = header.indexOf(i, res + 1);
                hit++;
            } while (hit != indexes[i] && res != -1);
            return res;
        } else {
            return header.indexOf(i);
        }
    });
    console.log("Column indexes:", columnIndexes);

    return lines.reduce((a, l) => {
            columnIndexes.forEach((v, i) => a[columns[i]].push(l.split(",")[v]));
            return a;
        }, 
        columns.reduce((a, c) => ({...a, [c]: []}), {}));
}

function lineToArray(line) {
    return line.split(",").map(i => i.replace(/"/g, ''));
}

export function parseHWiFile(path, inputName, {encoding, columns, limit, indexes}) {
    const vals = parseCSV(path, inputName, {encoding, columns: ["Date", "Time", ...columns], indexes});
    Object.values(vals).forEach(v => {
        console.log("Data length: " + v.length);
        let lim = [1, v.length - 4];
        if (limit) {
            if (Array.isArray(limit))
                lim = limit;
            else if (typeof limit === "number")
                lim[1] = limit;
        }
        v.splice(lim[1] + 1);
        v.splice(0, lim[0]);
    });
    return vals;
}

export function parseMangoHUDFile(path, inputName, {encoding, columns, limit, indexes}) {
    const vals = parseCSV(path, inputName, {encoding, columns, indexes, headerLine: 2});
    return vals;
}
