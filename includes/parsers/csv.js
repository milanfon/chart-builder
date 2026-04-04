import {readFileSync} from "node:fs";
import { decode } from "iconv-lite";
import { determineFilePath } from "../aux";

export function parseCSV(path, inputName, {encoding, columns, indexes, headerLine = 0, xBounds}) {
    return parseCSVFile(path, inputName, {encoding, columns, indexes, headerLine, xBounds});
}

function parseCSVFile(path, inputName, {encoding, columns, indexes, headerLine = 0, xBounds}) {
    const buffer = readFileSync(determineFilePath(path, inputName));
    const data = decode(buffer, encoding || 'utf8');
    let lines = data.split(`\n`);

    const header = lineToArray(lines[headerLine]);
    console.log("Header columns: ", header.length, "Data columns: ", lineToArray(lines[headerLine+1]).length);

    lines = lines
      .slice(headerLine+1)
      .filter(line => line.trim() !== "");

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

    if (xBounds) {
        xBounds[0] = Number(lineToArray(lines[0])[0]);
        xBounds[1] = Number(lineToArray(lines[lines.length - 1])[0]);
    }

    return lines.reduce((a, l) => {
            columnIndexes.forEach((v, i) => a[columns[i]].push(l.split(",")[v]));
            return a;
        }, 
        columns.reduce((a, c) => ({...a, [c]: []}), {}));
}

export function parseCSVSeries(defaultPath, inputName, {encoding, values, headerLine = 0, xBounds}) {
    const fileMapping = values
      .flatMap(v => v.series)
      .reduce((a, s) => {
          const file = s.file || defaultPath;
          if (!a[file])
              a[file] = [];
          a[file].push({
              sourceKey: s.sourceKey || s.key,
              outputKey: s.key,
              index: s.index
          });
          return a;
      }, {});

    let xBoundsSet = false;
    return Object.entries(fileMapping)
      .map(([file, fileSeries]) => {
          const columns = fileSeries.map(s => s.sourceKey);
          const indexes = fileSeries.reduce((a, s) => {
              if (s.index !== undefined)
                  a[s.sourceKey] = s.index;
              return a;
          }, {});
          const parsed = parseCSVFile(file, inputName, {
              encoding,
              columns,
              indexes,
              headerLine,
              xBounds: xBoundsSet ? undefined : xBounds
          });
          xBoundsSet = true;
          return fileSeries.reduce((a, s) => ({...a, [s.outputKey]: parsed[s.sourceKey]}), {});
      })
      .reduce((a, o) => ({...a, ...o}), {});
}

export function normalizeCSVValues(values) {
    return values.map(v => ({
        ...v,
        series: v.series.map(s => {
            const sourceKey = s.sourceKey || s.key;
            return {
                ...s,
                sourceKey,
                key: s.file ? `${s.file}:${sourceKey}` : sourceKey
            };
        })
    }));
}

function lineToArray(line) {
    return line
      .replace(/[\r\n]+$/g, '')
      .split(",")
      .map(i => i.replace(/"/g, ''));
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
