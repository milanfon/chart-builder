import dimensions from "../../constants/dimensions.json";
import colors from "../../constants/colors.json";
import { renderHeader } from "./general-components";
import { parseHWiFile } from "../parsers/csv";

function determineTicks(size, bounds) {
    const diff = Math.abs(bounds[1] - bounds[0]);
    const scale = size / diff;
    return {
        major: diff / 10 * scale,
        minor: diff / 20 * scale,
        boundsLabel: diff / 10 
    };
}

export function renderVerticalAxis(data, order) {
    const height = 860;
    const y = 150;
    const outline = `<rect x="30" y="${y}" width="${dimensions.stats.axisWidth}" height="${height}" stroke="#${colors.general.outline}" fill="none" stroke-width="2"/>`;
    let ticks = `
        <text x="${30 + 2 + dimensions.stats.tickMajorWidth}" y="${y + height - 5}" fill="#${colors.general.outline}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="text-top">${data.bounds[0]}</text>
        <text x="${30 + 2 + dimensions.stats.tickMajorWidth}" y="${y + 5}" fill="#${colors.general.outline}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="hanging">${data.bounds[1]}</text>
    `;
    const dt = determineTicks(height, data.bounds);
    let label = data.bounds[0] + dt.boundsLabel;
    for (let t = height - dt.major; t > 0; t -= dt.major) {
        const yPos = y + t;
        ticks += `
            <line x1="30" y1="${yPos}" x2="${30 + dimensions.stats.tickMajorWidth}" y2="${yPos}" stroke="#${colors.general.outline}" stroke-width="4"/>
            <text x="${30 + 2 + dimensions.stats.tickMajorWidth}" y="${yPos}" fill="#${colors.general.outline}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">${label}</text>
        `;
        label += dt.boundsLabel;
    }
    for (let t = height - dt.minor; t > 0; t -= dt.minor) {
        const yPos = y + t;
        ticks += `<line x1="30" y1="${yPos}" x2="${30 + dimensions.stats.tickMinorWidth}" y2="${yPos}" stroke="#${colors.general.outline}" stroke-width="2"/>`;
    }
    return `
        ${outline}
        ${ticks}
    `;
}

export function renderLine(props, inputName) {
    const left = props.values.filter(i => i.position === 'left');
    const right = props.values.filter(i => i.position === 'right');
    const leftAxes = left.map((v,i) => renderVerticalAxis(v, i));
    const keys = [...left.flatMap(j => j.series.map(i => i.key)), ...right.flatMap(j => j.series.map(i => i.key))];

    parseHWiFile(props.sourceFile, inputName, {encoding: props.encoding, columns: keys});

    return `
        ${renderHeader(props)}
        ${leftAxes}
    `;
}
