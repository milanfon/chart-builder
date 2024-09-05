import dimensions from "../../constants/dimensions.json";
import colors from "../../constants/colors.json";
import { renderHeader } from "./general-components";
import { parseHWiFile } from "../parsers/csv";
import { linMap } from "../aux";

function determineTicks(size, bounds) {
    const diff = Math.abs(bounds[1] - bounds[0]);
    const scale = size / diff;
    return {
        major: diff / 10 * scale,
        minor: diff / 20 * scale,
        boundsLabel: diff / 10 
    };
}

export function renderVerticalAxis(data, order, right = false) {
    const height = 860;
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

function renderSeries(props, vals, series, canvas) {
    const ret = [];
    let pos;
    series.forEach(b => {
        b.series.forEach(s => {
            if (!pos)
                pos = vals[s.key].map((_, i) => linMap(i, [0, vals[s.key].length], [canvas.x, canvas.x + canvas.width]));
            const remaped = vals[s.key].map(i => (canvas.y + canvas.height) - linMap(i, b.bounds, [0, canvas.height]));
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

export function renderLine(props, inputName) {
    const left = props.values.filter(i => i.position === 'left');
    const right = props.values.filter(i => i.position === 'right');
    const leftAxes = left.map((v,i) => renderVerticalAxis(v, i));
    const rightAxes = right.map((v,i) => renderVerticalAxis(v, i, true));
    const keys = [...left.flatMap(j => j.series.map(i => i.key)), ...right.flatMap(j => j.series.map(i => i.key))];

    const vals = parseHWiFile(props.sourceFile, inputName, {encoding: props.encoding, columns: keys});

    const leftAxisWidth = calcFullAxisWidth(left);
    const rightAxisWidth = calcFullAxisWidth(right);

    const insideCanvasWidth = dimensions.canvas.width - 2 * 30 - leftAxisWidth - rightAxisWidth;
    const insideCanvasHeight = 860;
    const insideCanvasX = leftAxisWidth + 30;
    const insideCanvasY = 150;
    const series = renderSeries(props, vals, [...left, ...right], {x: insideCanvasX, y: insideCanvasY, width: insideCanvasWidth, height: insideCanvasHeight});

    return `
        ${series.join("\n")}
        ${renderHeader(props)}
        ${leftAxes}
        ${rightAxes}
    `;
}
