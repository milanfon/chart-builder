import { parseUniformityTest } from "../parsers/displaycal";
import colors from "../../constants/colors.json";
import dimensions from "../../constants/dimensions.json";
import { renderHeader } from "./general-components";
import { percentageToString } from "../aux";
import { mapToGradient } from "../colors";

const maxDiff = 10;

function decideRectColor(diffVal) {
    if (Math.abs(diffVal) >= maxDiff) return colors.brightness.background[2];
    return mapToGradient(Math.abs(diffVal), colors.brightness.background, maxDiff);
}

function renderFooter() {
    return `
        <line x1="30" y1="1010" x2="2130" y2="1010" stroke="#${colors.general.outline}" stroke-width="2"/>
        <line x1="240" y1="1010" x2="240" y2="1050" stroke="#${colors.general.outline}" stroke-width="2"/>
        <text x="135" y="1030" fill="#${colors.general.outline}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">Legenda</text>
        <line x1="1580" y1="1010" x2="1580" y2="1050" stroke="#${colors.general.outline}" stroke-width="2"/>
        <line x1="1730" y1="1010" x2="1730" y2="1050" stroke="#${colors.general.outline}" stroke-width="2"/>
        <line x1="1880" y1="1010" x2="1880" y2="1050" stroke="#${colors.general.outline}" stroke-width="2"/>
        <rect x="1730" y="1010" width="150" height="40" fill="#${colors.general.outline}"/>
        <text x="1655" y="1030" fill="#${colors.general.outline}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">Jednotky</text>
        <text x="1805" y="1030" fill="#${colors.general.background}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">nit</text>
        <text x="2005" y="1030" fill="#${colors.general.outline}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">Tolerance max 10%</text>
    `;
}

export function renderBrightnessTable(props, inputName) {
    const parsed = parseUniformityTest(props.sourceFile, inputName);
    const avg = Math.round(parsed.values.reduce((a, i) => a + i, 0) / parsed.values.length);
    const diff = parsed.values.map(i => (((i / avg) - 1) * 100).toFixed(1));

    props.info[2] = {title: "Průměrný jas", value: avg + " nit"}

    let rectangles = "";
    const recHeightUnit = (dimensions.brightness.bottom - dimensions.brightness.top) / parsed.rows;
    const recWidthUnit = (dimensions.canvas.width - 2 * dimensions.brightness.padding) / parsed.cols;
    for (let h = 0; h < parsed.rows; h++) {
        for (let v = 0; v < parsed.cols; v++) {
            rectangles += `
                <rect x="${dimensions.brightness.padding + v * recWidthUnit}" y="${dimensions.brightness.top + h * recHeightUnit}" width="${recWidthUnit}" height="${recHeightUnit}" stroke="#${colors.general.outline}" stroke-width="2" fill="#${decideRectColor(diff[h * parsed.cols + v])}"/>
                <text x="${dimensions.brightness.padding + (v + 0.5) * recWidthUnit}" y="${dimensions.brightness.top + (h + 0.45) * recHeightUnit}" fill="#${colors.general.outline}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="${dimensions.brightness.brightnessText}" dominant-baseline="central">${parsed.values[h * parsed.cols + v]}</text>
                <text x="${dimensions.brightness.padding + (v + 0.5) * recWidthUnit}" y="${dimensions.brightness.top + (h + 0.6) * recHeightUnit}" fill="#000000" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="${dimensions.brightness.diffText}" dominant-baseline="central">${percentageToString(diff[h * parsed.cols + v])}</text>
            `;
        }
    }

    return `
        ${renderHeader(props)}
        ${rectangles}
        ${renderFooter()}
    `;
}
