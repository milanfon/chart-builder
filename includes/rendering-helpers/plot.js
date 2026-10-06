import colors from "../../constants/colors.json";
import { linMap } from "../aux";
import { renderLine, renderRect } from "./lines";

// Geometry and SVG layers shared by Cartesian charts. Tick selection and label
// formatting stay with the chart, since their units and layouts differ.
export function createPlot({x, y, width, height, xBounds, yBounds, id}) {
    const scaleX = value => linMap(value, xBounds, [x, x + width]);
    const scaleY = value => linMap(value, yBounds, [y + height, y]);
    return {
        scaleX,
        scaleY,
        point: ([vx, vy]) => [scaleX(vx), scaleY(vy)],
        grid({xTicks = [], yTicks = [], stroke = colors.general['grid-line'], strokeWidth = 2} = {}) {
            const gridLine = (orientation, x1, y1, x2, y2) => `<line data-grid="${orientation}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#${stroke}" stroke-width="${strokeWidth}"/>`;
            return yTicks.map(value => gridLine('horizontal', x, scaleY(value), x + width, scaleY(value))).join('')
                + xTicks.map(value => gridLine('vertical', scaleX(value), y, scaleX(value), y + height)).join('');
        },
        clip(content) {
            return `<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse">${renderRect({x, y, width, height, fill: 'black', stroke: 'none'})}</clipPath></defs><g clip-path="url(#${id})">${content}</g>`;
        }
    };
}

export function renderAxisTicks({orientation, position, scale, major = [], minor = [], majorLength = 18, minorLength = 10, majorWidth = 2, minorWidth = 2, label = () => '', stroke = colors.general.outline}) {
    const tick = (value, length, width) => {
        const coordinate = scale(value);
        return orientation === 'vertical'
            ? renderLine(position, coordinate, position + length, coordinate, stroke, '', width)
            : renderLine(coordinate, position, coordinate, position + length, stroke, '', width);
    };
    return major.map((value, index) => tick(value, majorLength, majorWidth) + label(value, scale(value), index)).join('')
        + minor.map(value => tick(value, minorLength, minorWidth)).join('');
}

// Axis bands may extend beyond the plot to include labels and a unit box.
export function renderPlotBorders({x, y, width, height, left = x, right = x + width, axisBottom = y + height, stroke = colors.general.outline}) {
    return renderLine(left, y, right, y, stroke)
        + renderLine(x, y, x, axisBottom, stroke)
        + renderLine(left, y + height, right, y + height, stroke);
}
