import dimensions from "../../constants/dimensions.json";
import colors from "../../constants/colors.json";
import { renderHeader } from "./general-components";
import { normalizeCSVValues, parseCSVSeries, parseHWiFile, parseMangoHUDFile } from "../parsers/csv";
import { parseDirect } from "../parsers/direct";
import { linMap, invert } from "../aux";
import { parseREWtxt } from "../parsers/rew";
import { renderText } from "../rendering-helpers/text";

function determineTicks(size, bounds, base = 10) {
    const diff = Math.abs(bounds[1] - bounds[0]);
    const scale = size / diff;
    return {
        major: diff / base * scale,
        minor: diff / (2 * base) * scale,
        boundsLabel: diff / base
    };
}

export function renderVerticalAxis(data, order, right = false) {
    const height = 820;
    const width = data.width || dimensions.stats.axisWidth;
    const y = 150;
    const x = !right ? 30 + width * order : dimensions.canvas.width - 30 - (order + 1) * width;
    const outline = `<rect x="${x}" y="${y}" width="${width}" height="${height}" stroke="#${colors.general.outline}" fill="none" stroke-width="2"/>`;
    let ticks = `
        <text x="${x + 2 + dimensions.stats.tickMajorWidth}" y="${y + height - 5}" fill="#${colors.general.outline}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="text-top">${data.bounds[0]}</text>
        <text x="${x + 2 + dimensions.stats.tickMajorWidth}" y="${y + 5}" fill="#${colors.general.outline}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="hanging">${data.bounds[1]}</text>
    `;
    const dt = determineTicks(height, data.bounds);
    let label = data.bounds[0] + dt.boundsLabel;
    for (let t = height - dt.major; t > 0; t -= dt.major) {
        const yPos = y + t;
        ticks += `
            <line x1="${x}" y1="${yPos}" x2="${x + dimensions.stats.tickMajorWidth}" y2="${yPos}" stroke="#${colors.general.outline}" stroke-width="4"/>
            <text x="${x + 2 + dimensions.stats.tickMajorWidth}" y="${yPos}" fill="#${colors.general.outline}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">${label}</text>
        `;
        label += dt.boundsLabel;
    }
    for (let t = height - dt.minor; t > 0; t -= dt.minor) {
        const yPos = y + t;
        ticks += `<line x1="${x}" y1="${yPos}" x2="${x + dimensions.stats.tickMinorWidth}" y2="${yPos}" stroke="#${colors.general.outline}" stroke-width="2"/>`;
    }
    return `
        ${outline}
        ${ticks}
    `;
}

export function renderHorizontalAxis(leftAxisWidth, rightAxisWidth, bounds, size) {
    const y = 150 + 820;
    const x = 30 + leftAxisWidth;
    const height = 40;
    const axisWidth = dimensions.canvas.width - 30 * 2 - leftAxisWidth - rightAxisWidth;
    const textPadding = 5;
    const outline = `
        <rect x="${30}" y="${y}" width="${leftAxisWidth}" height="${height}" stroke="#${colors.general.outline}" fill="#${colors.general.outline}" stroke-width="2"/>
        <rect x="${dimensions.canvas.width - 30 - rightAxisWidth}" y="${y}" width="${rightAxisWidth}" height="${height}" stroke="#${colors.general.outline}" fill="#${colors.general.outline}" stroke-width="2"/>
        <rect x="${x}" y="${y}" width="${axisWidth}" height="${height}" stroke="#${colors.general.outline}" fill="#${colors.general.background}" stroke-width="2"/>
    `;
    let ticks = `
        ${renderText({x: x + textPadding, y: y + height - textPadding, text: bounds[0], textAnchor: "start", dominantBaseline: "text-top", fontSize: 20})}
        ${renderText({x: dimensions.canvas.width - 30 - rightAxisWidth - textPadding, y: y + height - textPadding, text: bounds[1], textAnchor: "end", dominantBaseline: "text-top", fontSize: 20})}
    `;
    const dt = determineTicks(axisWidth, bounds, size);
    let label = bounds[0] + dt.boundsLabel;
    for (let t = dt.major; t.toFixed(1) < axisWidth; t += dt.major) {
        const xPos = 30 + leftAxisWidth + t;
        ticks += `
            <line x1="${xPos}" y1="${y}" x2="${xPos}" y2="${y+20}" stroke="#${colors.general.outline}" stroke-width="2"/>
            ${renderText({x: xPos, y: y + height - textPadding, text: label, textAnchor: "middle", dominantBaseline: "text-top", fontSize: 20})}
        `;
        label += dt.boundsLabel;
    }
    return `
        ${outline}
        ${ticks}
    `;
}

export function calcFullAxisWidth(data, max = undefined) {
    let i = 0;
    let width = 0;
    while (i < data.length) {
        width += data[i].width || dimensions.stats.axisWidth;
        if (max && i >= max)
            break;
        i++;
    }
    return width;
}

function renderSeries(vals, series, canvas, xBounds, xValues = {}) {
    const ret = [];
    series.forEach(b => {
        b.series.forEach(s => {
            const xs = xValues[s.key] || vals[s.key].map((_, i) => i);
            const pos = xs.map(x => linMap(x, xBounds, [canvas.x, canvas.x + canvas.width]));
            const remaped = vals[s.key].map(i => (canvas.y + canvas.height) - linMap(invert(i, s?.invert), b.bounds, [0, canvas.height]));
            const pathString = remaped.reduce((a, v, i) => {
                if (i > 0)
                    return a + " L" + pos[i] + " " + v;
                else
                    return a + "M " + pos[i] + " " + v;
            }, "");
            ret.push(`<path d="${pathString}" stroke="#${s.color}" stroke-width="3" fill="none"/>`);
        });
    });
    return ret;
}

function renderLineFooter(props, series) {
    let letAcc = 240;
    const legend = series.reduce((a, s, i) => {
        const x = letAcc;
        const charLen = 12;
        letAcc += s.name.length * charLen + 65;
        return a + `
            <g transform="translate(${x}, 1010)">
                <rect x="5" y="5" width="50" height="30" stroke="#${s.color}" fill="none" stroke-width="4"/>
                <text x="${65}" y="20" fill="#${colors.general.outline}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">${s.name}</text>
                <text x="${30}" y="20" fill="#${colors.general.outline}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="15" dominant-baseline="central">${s.unit}</text>
            </g>
        `;
    }, "");
    return `
            ${legend}
            <line x1="30" y1="1010" x2="2130" y2="1010" stroke="#${colors.general.outline}" stroke-width="2"/>
            <line x1="240" y1="1010" x2="240" y2="1050" stroke="#${colors.general.outline}" stroke-width="2"/>
            <text x="135" y="1030" fill="#${colors.general.outline}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">Legenda</text>
            <line x1="1830" y1="1010" x2="1830" y2="1050" stroke="#${colors.general.outline}" stroke-width="2"/>
            <line x1="1980" y1="1010" x2="1980" y2="1050" stroke="#${colors.general.outline}" stroke-width="2"/>
            <line x1="2130" y1="1010" x2="2130" y2="1050" stroke="#${colors.general.outline}" stroke-width="2"/>
            <rect x="1980" y="1010" width="150" height="40" fill="#${colors.general.outline}"/>
            <text x="1905" y="1030" fill="#${colors.general.outline}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">Jednotky x</text>
            <text x="2055" y="1030" fill="#${colors.general.background}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">${props.units}</text>
    `;
}

export function renderLine(props, inputName) {
    const parser = props.parser || 'direct';
    const values = parser === 'csv' ? normalizeCSVValues(props.values) : props.values;
    const left = values.filter(i => i.position === 'left');
    const right = values.filter(i => i.position === 'right');
    const leftAxes = left.map((v,i) => renderVerticalAxis(v, i));
    const rightAxes = right.map((v,i) => renderVerticalAxis(v, i, true));
    const keys = [...left.flatMap(j => j.series.map(i => i.sourceKey || i.key)), ...right.flatMap(j => j.series.map(i => i.sourceKey || i.key))];
    const indexes = [...left.flatMap(j => j.series.map(i => ({[i.sourceKey || i.key]: i.index}))), ...right.flatMap(j => j.series.map(i => ({[i.sourceKey || i.key]: i.index})))];
    const xBounds = [0,1];
    let xValues = {};

    let vals = {};
    switch(parser) {
        case 'hwi':
            vals = parseHWiFile(props.sourceFile, inputName, {encoding: props.encoding, columns: keys, limit: props.limit, indexes: Object.assign({}, ...indexes)});
            break;
        case 'mangohud':
            vals = parseMangoHUDFile(props.sourceFile, inputName, {encoding: props.encoding, columns: keys, limit: props.limit, indexes: Object.assign({}, ...indexes)});
            break;
        case 'rew':
            vals = parseREWtxt(inputName, {encoding: props.encoding, values: props.values});
            break;
        case 'csv':
            vals = parseCSVSeries(props.sourceFile, inputName, {encoding: props.encoding, values, xBounds});
            break;
        case 'direct': {
            const parsed = parseDirect(values, {xBounds});
            vals = parsed.vals;
            xValues = parsed.xValues;
            break;
        }
        default:
            throw new Error("Invalid parser value!");
    }

    const leftAxisWidth = calcFullAxisWidth(left);
    const rightAxisWidth = calcFullAxisWidth(right);
    const size = Object.values(vals)[0].length - 1;

    const insideCanvasWidth = dimensions.canvas.width - 2 * 30 - leftAxisWidth - rightAxisWidth;
    const insideCanvasHeight = 860 - 40;
    const insideCanvasX = leftAxisWidth + 30;
    const insideCanvasY = 150;
    const series = renderSeries(vals, [...left, ...right], {x: insideCanvasX, y: insideCanvasY, width: insideCanvasWidth, height: insideCanvasHeight}, xBounds, xValues);

    return `
        ${series.join("\n")}
        ${renderHeader(props)}
        ${leftAxes}
        ${rightAxes}
        ${renderHorizontalAxis(leftAxisWidth, rightAxisWidth, xBounds, size)}
        ${renderLineFooter(props, [...left, ...right].map(i => i.series).flat())}
    `;
}
