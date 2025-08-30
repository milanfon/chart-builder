import dimensions from "../../constants/dimensions.json" assert {type: "json"}
import colors from "../../constants/colors.json" assert {type: "json"}
import { verticalLine } from "../rendering-helpers/lines";

function parseCellProperties(cellValue){
    let [cellText, cellTextSize] = ["", dimensions.specs["font-size"].default];
    if (typeof cellValue === "object") {
        cellText = cellValue.text;
        if (typeof cellValue.size === "string")
            cellTextSize = dimensions.specs["font-size"][cellValue.size];
        else if (typeof cellValue.size === "number")
            cellTextSize = cellValue.size;
        else
            console.log("Undefined type of cell size", typeof cellValue.size);
    } else if(typeof cellValue === "string")
        cellText = cellValue;
    else
        console.log("Undefined type of cell", typeof cellValue);
    return [cellText, cellTextSize];
}

function lookupSameCells(values, row, col) {
    let isSame = 1;
    const originalValue = values[col].val[row];
    if (col > 0) {
        if (values[col - 1].val[row] === originalValue) {
            return 0;
        }
    }
    for (let i = col+1; i < values.length; i++) {
        if (values[i].val[row] === originalValue)
            isSame++;
        else
            break;
    }
    return isSame;
}

export function renderCells(paramLine, headLine, props, inputName) {
        const paramCount = props.parameters.length;
        const columnCount = props.values.length;
        const totalHeight = dimensions.canvas.height - (2*dimensions.specs.padding + dimensions.specs["head-line"]);
        const unitHeight = totalHeight / (paramCount + 1);
        const valArea = dimensions.canvas.width - dimensions.specs.padding - paramLine;
        const valUnit = valArea / columnCount;

        let params = `
            <rect x="${dimensions.specs.padding}" y="${headLine}" width="${dimensions.specs["param-line"]}" height="${totalHeight}" fill="#${colors.specs.darker}"/>
            <rect x="${dimensions.specs.padding}" y="${headLine}" width="${dimensions.canvas.width - dimensions.specs.padding * 2}" height="${unitHeight}" fill="#${colors.specs.lighter}"/>
        `;
        for (let i = 0; i < paramCount + 1; i++) {
            const yPos = headLine + i * unitHeight;
            if (i % 2 != 0) {
                params += `<rect x="${paramLine}" y="${headLine + i * unitHeight}" width="${dimensions.canvas.width - paramLine - dimensions.specs.padding}" height="${unitHeight}" fill="#${colors.specs.darker}"/>`
            }
            params += `<line x1="${dimensions.specs.padding}" y1="${yPos}" x2="${dimensions.canvas.width - dimensions.specs.padding}" y2="${yPos}" stroke="#${colors.general.outline}" stroke-width="2"/>`;
            for (let c = 0; c < columnCount + 1; c++) {
                if (i < 1 && c < 1) {
                    params += `<text x="${dimensions.specs["param-line"] / 2 + dimensions.specs.padding}" y="${headLine + (i+0.5) * unitHeight}" fill="#${colors.general.background}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="${dimensions.specs["font-size"].default}" dominant-baseline="central">Parametr</text>`
                }  else if (c < 1) {
                    params += `<text x="${dimensions.specs.padding + dimensions.specs["param-line"] / 2}" y="${headLine + (i+0.5) * unitHeight}" fill="#${colors.general.outline}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="${dimensions.specs["font-size"].default}" dominant-baseline="central">${props.parameters[i - 1]}</text>`;
                } else if (i > 0) {
                    const cellWidth = lookupSameCells(props.values, i-1, c-1);
                    if (cellWidth > 0) {
                        const [cellText, cellTextSize] = parseCellProperties(props.values[c - 1].val[i - 1]);
                        params += `<text x="${paramLine + ((c + cellWidth - 1) - 0.5*cellWidth) * valUnit}" y="${headLine + (i+0.5) * unitHeight}" fill="#${colors.general.outline}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="${cellTextSize}" dominant-baseline="central">${cellText}</text>`;
                        params += verticalLine(paramLine + (c + cellWidth - 1) * valUnit, headLine + i * unitHeight, headLine + (i+1) * unitHeight);
                    }
                    if (cellWidth === 1 || c === columnCount) {
                        params += `<line x1="${paramLine + c * valUnit}" y1="${headLine + i * unitHeight}" x2="${paramLine + c * valUnit}" y2="${headLine + (i+1) * unitHeight}" stroke="#${colors.general.outline}" stroke-width="2"/>`;
                    }
                }
            }
        }
        for (let c = 1; c < columnCount + 1; c++) {
            params += `<text x="${paramLine + (c - 0.5) * valUnit}" y="${headLine + (0.5) * unitHeight}" fill="#${colors.general.background}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="${dimensions.specs["font-size"].default}" dominant-baseline="central">${props.values[c - 1].name}</text>`;
            params += verticalLine(paramLine + c * valUnit, dimensions.specs.padding, headLine + unitHeight);
            if (props.values[c-1].pic) {
                params += `<image xlink:href="../../input/${inputName}/${props.values[c-1].pic.path}" x="${paramLine + (c - 0.9) * valUnit}" y="${dimensions.specs.padding + dimensions.specs["head-line"] * 0.1}" width="${valUnit * 0.8}" height="${dimensions.specs["head-line"] * 0.8}"/>`;
            }
        }
        return params;
}
