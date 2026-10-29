import dimensions from "../../constants/dimensions.json";
import colors from "../../constants/colors.json";
import { escapeXML, imageToBase64 } from "../aux";
import { renderHeader } from "./general-components";
import { renderVerticalAxis, renderHorizontalAxis, renderGrid, renderLineFooter } from "./line";
import { createPlot } from "../rendering-helpers/plot";
import { estimateTextWidth, renderText } from "../rendering-helpers/text";
import { renderPolyline, renderRect } from "../rendering-helpers/lines";
import { ImageAspectRatio, renderImage } from "../rendering-helpers/image";

function axisBounds(axis, values) {
    if (axis?.bounds !== undefined) {
        const bounds = axis.bounds;
        if (!Array.isArray(bounds) || bounds.length !== 2 || !bounds.every(Number.isFinite) || bounds[0] >= bounds[1])
            throw new Error("XY axis bounds must be finite, increasing [min, max] pairs");
        return bounds;
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min || Math.max(Math.abs(min), 1)) * 0.15;
    const step = Math.pow(10, Math.floor(Math.log10(padding)));
    return [Math.floor((min - padding) / step) * step, Math.ceil((max + padding) / step) * step];
}

export function renderXY(props) {
    const series = (props.values || []).filter(series => series.show !== false).map(series => {
        if (!Array.isArray(series.val) || !series.val.length)
            throw new Error(`XY series '${series.name}' needs at least one point`);
        // Colors are inserted into SVG attributes with a leading #; accept only six hex digits.
        if (!/^[0-9a-f]{6}$/i.test(series.color))
            throw new Error(`XY series '${series.name}' needs a six-digit hex color`);
        const points = series.val.filter(point => point.show !== false).map(point => {
            if (!Number.isFinite(point.x) || !Number.isFinite(point.y))
                throw new Error(`XY series '${series.name}' needs finite numeric x and y coordinates`);
            return point;
        });
        return {...series, points};
    }).filter(series => series.points.length);
    if (!series.length)
        throw new Error("XY chart needs at least one visible point");

    const points = series.flatMap(series => series.points);
    const xBounds = axisBounds(props.xAxis, points.map(point => point.x));
    const yBounds = axisBounds(props.yAxis, points.map(point => point.y));
    // Leave space beside the familiar line-chart axis bands for explicit titles.
    const leftWidth = dimensions.xy.leftAxisWidth;
    const titleWidth = dimensions.xy.yTitleWidth;
    const plotDimensions = dimensions.xy.plot;
    const canvas = {
        x: plotDimensions.horizontalInset + leftWidth,
        y: plotDimensions.top,
        width: dimensions.canvas.width - 2 * plotDimensions.horizontalInset - leftWidth,
        height: plotDimensions.height
    };
    const plot = createPlot({...canvas, xBounds, yBounds, id: 'xy-chart-plot-clip'});
    const icons = new Map(series.filter(series => series.icon).map(series => [series.icon, '']));
    for (const icon of icons.keys())
        icons.set(icon, `data:image/png;base64,${imageToBase64(`./assets/icons/${icon}.png`)}`);
    const grid = props.grid === true ? renderGrid({bounds: yBounds}, canvas, xBounds, []) : '';
    const paths = series.map(series => {
        if (series.connect === false || series.points.length < 2)
            return '';
        const orderedPoints = [...series.points].sort((a, b) => a.x - b.x);
        return renderPolyline(orderedPoints.map(point => plot.point([point.x, point.y])), series.color);
    }).join('');
    const markers = series.map(series => series.points.map(point => {
        const x = plot.scaleX(point.x);
        const y = plot.scaleY(point.y);
        const marker = series.icon
            ? renderImage({href: icons.get(series.icon), x: x - 18, y: y - 18, width: 36, height: 36, preserveAspectRatio: ImageAspectRatio.CENTER_MEET})
            : renderRect({x: x - 7, y: y - 7, width: 14, height: 14, fill: `#${colors.general.background}`, stroke: series.color, strokeWidth: 3});
        return `<g><title>${escapeXML(`${series.name}${point.label ? ' — ' + point.label : ''}: ${point.x}, ${point.y}`)}</title>
            ${marker}
        </g>`;
    }).join('')).join('');
    const labels = series.map(series => series.points.map(point => {
        if (!point.label || props.labels === false || point.x < xBounds[0] || point.x > xBounds[1] || point.y < yBounds[0] || point.y > yBounds[1])
            return '';
        const x = plot.scaleX(point.x) + (point.labelDx ?? (series.icon ? 26 : 14));
        const y = plot.scaleY(point.y) + (point.labelDy ?? (series.icon ? -30 : -20));
        return renderText({x, y, text: escapeXML(point.label), fill: series.color, textAnchor: point.labelAnchor || 'start', fontSize: 20});
    }).join('')).join('');
    const seriesLabels = series.map(series => {
        if (!series.plotLabel)
            return '';
        const label = series.plotLabel === true ? {} : series.plotLabel;
        const index = label.point ?? 0;
        if (!Number.isInteger(index) || index < 0 || index >= series.points.length)
            throw new Error(`Invalid plotLabel point for XY series '${series.name}'`);
        const point = series.points[index];
        if (point.x < xBounds[0] || point.x > xBounds[1] || point.y < yBounds[0] || point.y > yBounds[1])
            return '';
        return renderText({x: plot.scaleX(point.x) + (label.dx ?? 26), y: plot.scaleY(point.y) + (label.dy ?? -65),
            text: escapeXML(series.name), textAnchor: label.anchor || 'start', fontSize: 24});
    }).join('');
    const xTitle = [props.xAxis?.name, props.xAxis?.unit && `[${props.xAxis.unit}]`].filter(Boolean).join(' ');
    const yTitle = [props.yAxis?.name, props.yAxis?.unit && `[${props.yAxis.unit}]`].filter(Boolean).join(' ');

    // Axis titles are XY-specific for now; shared axis renderers could support them in the future.
    return `
        ${plot.clip(grid + paths + markers)}
        ${renderHeader(props)}
        <g transform="translate(${titleWidth}, 0)">${renderVerticalAxis({bounds: yBounds, width: leftWidth - titleWidth}, 0)}</g>
        ${renderHorizontalAxis(leftWidth, 0, xBounds)}
        ${renderRect({x: plotDimensions.horizontalInset, y: canvas.y, width: titleWidth, height: canvas.height})}
        <g transform="translate(${plotDimensions.horizontalInset + titleWidth / 2}, ${canvas.y + canvas.height / 2}) rotate(-90)">${renderText({x: 0, y: 0, text: escapeXML(yTitle), fontSize: 20, dominantBaseline: 'central'})}</g>
        ${renderText({x: canvas.x + canvas.width / 2, y: 945, text: escapeXML(xTitle), fontSize: 20})}
        ${labels}
        ${seriesLabels}
        ${renderLineFooter({units: escapeXML(props.xAxis?.unit || ''), legend: props.legend}, props.legend === false ? [] : series.map(series => ({...series, name: escapeXML(series.name), unit: '', legendWidth: series.legendWidth ?? estimateTextWidth(series.name, 20) + 24})))}
    `;
}
