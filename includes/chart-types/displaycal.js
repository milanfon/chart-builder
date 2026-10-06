import colors from "../../constants/colors.json";
import dimensions from "../../constants/dimensions.json";
import { renderHeader } from "./general-components";
import { adaptXYZD50ToD65, labToSRGB, labToXYZ, parseMeasurementReport, xyzToUV } from "../parsers/displaycal-measurement";
import { renderText } from "../rendering-helpers/text";
import { renderLine as line, renderPolyline as polyline, renderRect } from "../rendering-helpers/lines";
import { escapeXML, formatMeasurement } from "../aux";
import { createPlot, renderAxisTicks, renderPlotBorders } from "../rendering-helpers/plot";

const layout = dimensions['display-report'];
const axis = layout.axis;

// Chart labels use start alignment and alphabetic baselines instead of the
// shared renderer's centered defaults. Escape text here before rendering it.
const text = (x, y, value, size = 20, fill = colors.general.outline, anchor = 'start') => renderText({
    x, y, text: escapeXML(value), fontSize: size, fill, textAnchor: anchor,
    alignBaseline: 'baseline', dominantBaseline: 'alphabetic'
});

function accuracy(report, props) {
    const maximum = props.deltaEMax ?? Math.max(4, Math.ceil(report.maximum * 1.15));
    if (!Number.isFinite(maximum) || maximum <= 0 || maximum < report.maximum)
        throw new Error('DisplayCAL: deltaEMax must be positive and at least the maximum measured error');
    const panel = layout.accuracy, header = panel.header;
    const {x, y, width: w, height: h} = panel.plot;
    const chart = createPlot({x, y, width: w, height: h, xBounds: [.5, report.patches.length + .5], yBounds: [0, maximum], id: 'displaycal-accuracy-plot'});
    let body = renderRect({width: header.titleWidth, height: y, fill: `#${colors.general.outline}`, stroke: 'none'});
    body += text(header.titleWidth / 2, y / 2 + layout.header.titleOffsetY, 'Přesnost barev', 30, colors.general.background, 'middle');
    body += line(header.titleWidth, 0, header.titleWidth, y, colors.general.outline) + line(header.valueX, 0, header.valueX, y, colors.general.outline);
    body += line(header.titleWidth, layout.header.rowHeight, panel.width, layout.header.rowHeight, colors.general.outline) + line(0, y, panel.width, y, colors.general.outline);
    body += text(header.labelX, layout.header.labelOffsetY, 'Průměr ΔE', 22) + text(header.readingX, layout.header.labelOffsetY, formatMeasurement(report.average), 22);
    body += text(header.labelX, layout.header.rowHeight + layout.header.labelOffsetY, 'Maximum ΔE', 22) + text(header.readingX, layout.header.rowHeight + layout.header.labelOffsetY, formatMeasurement(report.maximum), 22);
    const yTicks = Array.from({length: 5}, (_, i) => maximum * i / 4);
    body += renderAxisTicks({orientation: 'vertical', position: 0, scale: chart.scaleY, major: yTicks,
        minor: yTicks.slice(0, -1).map(value => value + maximum / 8),
        label: (value, gy, i) => text(x - axis.labelPadding, gy + (i === 4 ? axis.topLabelOffset : i === 0 ? axis.bottomLabelOffset : axis.labelOffset), formatMeasurement(value, 1), 19, colors.general.outline, 'end')});
    const step = w / report.patches.length;
    const sampleTicks = [...new Set(Array.from({length: 6}, (_, i) => 1 + Math.round((report.patches.length - 1) * i / 5)))];
    body += renderAxisTicks({orientation: 'horizontal', position: y + h, scale: chart.scaleX, major: sampleTicks, majorLength: axis.majorTickLength,
        label: (sample, gx, i) => text(gx, y + h + axis.horizontalLabelOffset, sample, 19, colors.general.outline, i === 0 ? 'start' : i === sampleTicks.length - 1 ? 'end' : 'middle')});
    let plot = chart.grid({xTicks: sampleTicks, yTicks: yTicks.slice(1, -1)});
    if (maximum >= 2) plot += line(x, chart.scaleY(2), x + w, chart.scaleY(2), 'e6bb63', '7 6');
    report.patches.forEach((patch, i) => {
        const bh = patch.deltaE / maximum * h;
        const color = `rgb(${patch.rgb.map(v => Math.round(v * 2.55)).join(',')})`;
        plot += renderRect({x: x + i * step + step * panel.bar.inset, y: y + h - bh, width: step * panel.bar.width, height: bh, fill: color, stroke: colors.general['font-secondary'], strokeWidth: panel.bar.strokeWidth, content: `<title>Patch ${patch.id} · ΔE ${formatMeasurement(patch.deltaE, 3)}</title>`});
    });
    body += chart.clip(plot);
    body += renderPlotBorders({x, y, width: w, height: h, left: 0, axisBottom: panel.height});
    body += renderRect({y: y + h, width: x, height: axis.unitHeight, fill: `#${colors.general.outline}`, stroke: 'none'});
    body += text(x / 2, y + h + axis.unitLabelOffset, 'ΔE', 24, colors.general.background, 'middle');
    // Draw the panel border last so plot strokes cannot cover its edges.
    body += renderRect({width: panel.width, height: panel.height});
    return `<g transform="translate(${panel.left},${panel.top})">${body}</g>`;
}

function previews(report, props) {
    let patches;
    if (props.previewPatches !== undefined) {
        if (!Array.isArray(props.previewPatches) || !props.previewPatches.length || props.previewPatches.length > 12)
            throw new Error('DisplayCAL: previewPatches must contain 1–12 sample IDs');
        patches = props.previewPatches.map(id => {
            const patch = report.patches.find(p => p.id === String(id));
            if (!patch) throw new Error(`DisplayCAL: unknown preview sample ${id}`);
            return patch;
        });
    } else {
        // RGB input percentages: primary/secondary colors, then less-saturated variants.
        const defaultPreviewRGBTargets = [[100,0,0], [0,100,0], [0,0,100], [0,100,100], [100,0,100], [100,100,0],
            [66.6667,33.3333,33.3333], [33.3333,66.6667,33.3333], [33.3333,33.3333,66.6667],
            [33.3333,66.6667,66.6667], [66.6667,33.3333,66.6667], [66.6667,66.6667,33.3333]];
        patches = defaultPreviewRGBTargets.map(rgb => report.patches.find(p => p.rgb.every((v, i) => Math.abs(v - rgb[i]) < .001))).filter(Boolean);
        for (const patch of report.patches.filter(p => !p.gray)) {
            if (patches.length >= 12) break;
            if (!patches.includes(patch)) patches.push(patch);
        }
    }
    const panel = layout.previews;
    const {width, rowsTop: top, rowsBottom: bottom} = panel;
    const rowHeight = (bottom - top) / (patches.length || 1);
    let body = renderRect({width, height: panel.headerHeight, fill: `#${colors.general.outline}`, stroke: 'none'});
    body += text(width / 2, panel.titleY, 'Reference vs. měření', 22, colors.general.background, 'middle');
    body += text(width / 4, panel.legendY, 'REF', 21, colors.general.outline, 'middle') + text(width * .75, panel.legendY, 'MEAS', 21, colors.general.outline, 'middle');
    body += line(width / 2, panel.headerHeight, width / 2, top, colors.general.outline);
    body += line(0, panel.headerHeight, width, panel.headerHeight, colors.general.outline);
    patches.forEach((patch, i) => {
        const y = top + i * rowHeight;
        const ref = labToSRGB(patch.referenceLab), measured = labToSRGB(patch.lab);
        // Cover the entire pair before overlaying the measured half to avoid antialiased gaps.
        body += renderRect({y, width, height: rowHeight, fill: ref.color, stroke: 'none'});
        body += renderRect({x: width / 2, y, width: width / 2, height: rowHeight, fill: measured.color, stroke: 'none'});
    });
    // Draw row borders after all fills so fractional pixel positions cannot cover them.
    for (let i = 0; i <= patches.length; i++)
        body += line(0, top + i * rowHeight, width, top + i * rowHeight, colors.general.outline);
    if (!patches.length) {
        body += text(width / 2, panel.emptyLabelY, 'Bez barevných vzorků', 19, colors.general['font-secondary'], 'middle');
        body += line(0, bottom, width, bottom, colors.general.outline);
    }
    body += renderRect({width, height: panel.height});
    return `<g transform="translate(${panel.left},${panel.top})">${body}</g>`;
}

function chromaticity(report) {
    // Equal physical scaling on both axes so triangle shapes are not distorted.
    const panel = layout.chromaticity, header = panel.header;
    const {width, legend, marker} = panel;
    const {x, y} = panel.plot;
    const limit = .65;
    const size = width - x;
    const bottom = y + size;
    const chart = createPlot({x, y, width: size, height: size, xBounds: [0, limit], yBounds: [0, limit], id: 'displaycal-chromaticity-plot'});
    const point = chart.point;
    const sum = report.white.reduce((a, b) => a + b, 0);
    let body = renderRect({width: header.titleWidth, height: y, fill: `#${colors.general.outline}`, stroke: 'none'});
    body += text(header.titleWidth / 2, y / 2 + layout.header.titleOffsetY, 'Chromatičnost', 30, colors.general.background, 'middle');
    body += line(header.titleWidth, 0, header.titleWidth, y, colors.general.outline) + line(header.valueX, 0, header.valueX, y, colors.general.outline);
    body += line(header.titleWidth, layout.header.rowHeight, width, layout.header.rowHeight, colors.general.outline) + line(0, y, width, y, colors.general.outline);
    body += text(header.labelX, layout.header.labelOffsetY, 'Bílá x', 22) + text(header.readingX, layout.header.labelOffsetY, formatMeasurement(report.white[0] / sum, 4), 22);
    body += text(header.labelX, layout.header.rowHeight + layout.header.labelOffsetY, 'Bílá y', 22) + text(header.readingX, layout.header.rowHeight + layout.header.labelOffsetY, formatMeasurement(report.white[1] / sum, 4), 22);
    const ticks = Array.from({length: 7}, (_, i) => i / 10);
    let plot = chart.grid({xTicks: ticks.slice(1), yTicks: ticks.slice(1)});
    body += renderAxisTicks({orientation: 'horizontal', position: bottom, scale: chart.scaleX, major: ticks, majorLength: axis.majorTickLength,
        label: (v, gx, i) => text(gx + (i === 0 ? axis.edgeLabelPadding : 0), bottom + axis.horizontalLabelOffset, v.toFixed(1), 19, colors.general.outline, i === 0 ? 'start' : 'middle')});
    body += renderAxisTicks({orientation: 'vertical', position: 0, scale: chart.scaleY, major: ticks, minor: ticks.map(v => v + .05),
        label: (v, gy, i) => text(x - axis.labelPadding, gy + (i === 0 ? axis.bottomLabelOffset : axis.labelOffset), v.toFixed(2), 19, colors.general.outline, 'end')});
    body += text(x - axis.labelPadding, y + axis.topLabelOffset, limit.toFixed(2), 19, colors.general.outline, 'end');
    body += renderRect({y: bottom, width: x, height: axis.unitHeight, fill: `#${colors.general.outline}`, stroke: 'none'});
    body += line(0, bottom + axis.unitHeight, x, bottom, colors.general.background);
    body += text(x / 4, bottom + panel.unit.verticalLabelOffset, 'v′', 17, colors.general.background, 'middle');
    body += text(x * .75, bottom + panel.unit.horizontalLabelOffset, 'u′', 17, colors.general.background, 'middle');
    body += line(0, bottom + axis.unitHeight, width, bottom + axis.unitHeight, colors.general.outline);
    const primaries = [[100,0,0], [0,100,0], [0,0,100]].map(rgb => report.patches.find(p => p.rgb.every((v, i) => Math.abs(v - rgb[i]) < .001)));
    const measured = primaries.map(p => p ? xyzToUV(p.xyz) : null);
    // Bradford-adapt reference Lab back to D65 for comparison with raw measured XYZ.
    const referenceUV = lab => xyzToUV(adaptXYZD50ToD65(labToXYZ(lab)));
    if (primaries.every(Boolean) && measured.every(Boolean)) {
        const reference = primaries.map(p => referenceUV(p.referenceLab)).map(point);
        const output = measured.map(point);
        plot += polyline([...reference, reference[0]], colors.general.outline, '9 7') + polyline([...output, output[0]], colors['display-report'].measured);
        output.forEach(([cx, cy], i) => { plot += `<circle cx="${cx}" cy="${cy}" r="${marker.radius}" fill="${['#ff575f','#7bdd6f','#638dff'][i]}"/>`; });
    } else body += text(panel.missingLabel.x, panel.missingLabel.y, 'Chybí plné RGB primární vzorky.', 20, colors.general['font-secondary']);
    const whiteUV = xyzToUV(report.white);
    if (whiteUV) {
        const [wx, wy] = point(whiteUV);
        plot += `<circle cx="${wx}" cy="${wy}" r="${marker.radius}" fill="#${colors['display-report'].measured}"/>`;
    }
    const [dx, dy] = point(xyzToUV([.95047, 1, 1.08883]));
    plot += line(dx - marker.crossHalfSize, dy, dx + marker.crossHalfSize, dy, colors.general.outline) + line(dx, dy - marker.crossHalfSize, dx, dy + marker.crossHalfSize, colors.general.outline);
    body += chart.clip(plot);
    body += renderPlotBorders({x, y, width: size, height: size, left: 0, axisBottom: bottom + axis.unitHeight});
    body += line(legend.leftLineStart, legend.lineY, legend.leftLineEnd, legend.lineY, colors.general.outline, '9 7') + text(legend.leftLabelX, legend.lineLabelY, 'Reference (D65)', 19);
    body += line(legend.rightLineStart, legend.lineY, legend.rightLineEnd, legend.lineY, colors['display-report'].measured) + text(legend.rightLabelX, legend.lineLabelY, 'Měřené primární barvy', 19);
    body += line(legend.crossX - marker.crossHalfSize, legend.markerY, legend.crossX + marker.crossHalfSize, legend.markerY, colors.general.outline) + line(legend.crossX, legend.markerY - marker.crossHalfSize, legend.crossX, legend.markerY + marker.crossHalfSize, colors.general.outline);
    body += text(legend.leftLabelX, legend.markerLabelY, 'D65', 19);
    body += `<circle cx="${legend.dotX}" cy="${legend.markerY}" r="${marker.radius}" fill="#${colors['display-report'].measured}"/>`;
    body += text(legend.rightLabelX, legend.markerLabelY, 'Měřená bílá', 19);
    body += renderRect({width, height: panel.height});
    return `<g transform="translate(${panel.left},${panel.top})">${body}</g>`;
}

function grayscale(report) {
    const grays = report.patches.filter(p => p.gray).sort((a, b) => a.rgb[0] - b.rgb[0]);
    const white = grays.find(p => Math.abs(p.rgb[0] - 100) < .001);
    const panel = layout.grayscale, header = panel.header;
    const {x, y, width: w, height: h} = panel.plot;
    let body = renderRect({width: header.titleWidth, height: y, fill: `#${colors.general.outline}`, stroke: 'none'});
    body += text(header.titleWidth / 2, y / 2 + layout.header.titleOffsetY, 'Odezva šedé škály', 30, colors.general.background, 'middle');
    body += line(header.titleWidth, 0, header.titleWidth, y, colors.general.outline) + line(header.valueX, 0, header.valueX, y, colors.general.outline);
    body += line(header.titleWidth, layout.header.rowHeight, panel.width, layout.header.rowHeight, colors.general.outline) + line(header.titleWidth, layout.header.rowHeight * 2, panel.width, layout.header.rowHeight * 2, colors.general.outline);
    body += line(0, y, panel.width, y, colors.general.outline);
    const blackDigits = report.black[1] > 0 && Number(report.black[1].toFixed(1)) === 0
        ? Math.max(1, Math.ceil(-Math.log10(report.black[1]))) : 1;
    const readings = [
        ['Bílá', `${formatMeasurement(report.white[1], 0)} nit`],
        ['Černá', `${formatMeasurement(report.black[1], blackDigits)} nit`],
        ['Kontrast', report.contrast === null ? 'N/A' : `${formatMeasurement(report.contrast, 0)}:1`]
    ];
    readings.forEach(([label, value], i) => {
        body += text(header.labelX, layout.header.labelOffsetY + i * layout.header.rowHeight, label, 22) + text(header.readingX, layout.header.labelOffsetY + i * layout.header.rowHeight, value, 22);
    });
    if (white && white.xyz[1] > 0) {
        const max = Math.max(100, ...grays.map(p => p.xyz[1] / white.xyz[1] * 100));
        const chart = createPlot({x, y, width: w, height: h, xBounds: [0, 100], yBounds: [0, max], id: 'displaycal-grayscale-plot'});
        const project = (input, luminance) => chart.point([input, luminance]);
        const xTicks = [0, 25, 50, 75, 100], yTicks = xTicks.map(v => max * v / 100);
        body += renderAxisTicks({orientation: 'vertical', position: 0, scale: chart.scaleY, major: yTicks,
            minor: yTicks.slice(0, -1).map(v => v + max / 8),
            label: (v, gy, i) => text(x - axis.labelPadding, gy + (i === 4 ? axis.topLabelOffset : i === 0 ? axis.bottomLabelOffset : axis.labelOffset), formatMeasurement(v, 0), 19, colors.general.outline, 'end')});
        body += renderAxisTicks({orientation: 'horizontal', position: y + h, scale: chart.scaleX, major: xTicks, majorLength: axis.majorTickLength,
            label: (v, gx, i) => text(gx + (i === 0 ? axis.edgeLabelPadding : i === 4 ? -axis.edgeLabelPadding : 0), y + h + axis.horizontalLabelOffset, v, 19, colors.general.outline, i === 0 ? 'start' : i === 4 ? 'end' : 'middle')});
        const refWhite = labToXYZ(white.referenceLab)[1];
        if (refWhite <= 0) throw new Error('DisplayCAL: reference white luminance must be positive');
        body += chart.clip(chart.grid({xTicks: xTicks.slice(1, -1), yTicks: yTicks.slice(1, -1)})
            + polyline(grays.map(p => project(p.rgb[0], labToXYZ(p.referenceLab)[1] / refWhite * 100)), colors.general.outline, '9 7')
            + polyline(grays.map(p => project(p.rgb[0], p.xyz[1] / white.xyz[1] * 100)), colors['display-report'].measured));
    } else body += text(panel.missingLabel.x, panel.missingLabel.y, 'Chybí bílý vzorek pro normalizaci křivky.', 22, colors.general['font-secondary']);
    body += renderPlotBorders({x, y, width: w, height: h, left: 0, axisBottom: panel.height});
    body += renderRect({y: y + h, width: x, height: axis.unitHeight, fill: `#${colors.general.outline}`, stroke: 'none'});
    body += text(x / 2, y + h + axis.unitLabelOffset, '%', 24, colors.general.background, 'middle');
    body += renderRect({width: panel.width, height: panel.height});
    return `<g transform="translate(${panel.left},${panel.top})">${body}</g>`;
}

export function renderDisplayCALReport(props, inputName) {
    const report = parseMeasurementReport(props.sourceFile, inputName);
    const info = props.info ?? [
        {title: 'Monitor', value: {text: report.display.split(' @ ')[0], size: 18}},
        {title: 'Vzorky', value: String(report.patches.length)},
        {title: 'Měření', value: {text: report.datetime, size: 17}}
    ];
    const profileLabel = report.profile.length > 95 ? report.profile.slice(0, 92) + '…' : report.profile;
    const instrumentLabel = report.instrument ? ` · přístroj: ${report.instrument}` : '';
    const methodologyLabel = `ΔE: vložená bíle relativní Lab data · profil: ${profileLabel}${instrumentLabel}`;
    return `${renderHeader({...props, name: props.name ?? report.display.split(' @ ')[0], info})}
        ${text(layout.methodology.x, layout.methodology.y, methodologyLabel, 12, colors.general.outline)}
        ${line(layout.methodology.lineLeft, layout.methodology.lineY, layout.methodology.lineRight, layout.methodology.lineY, colors.general.outline)}
        <g transform="translate(0,${layout.contentOffsetY})">
        ${accuracy(report, props)}
        ${previews(report, props)}
        ${chromaticity(report)}
        ${grayscale(report)}
        </g>`;
}
