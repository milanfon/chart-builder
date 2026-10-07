import colors from '../../constants/colors.json';
import dimensions from '../../constants/dimensions.json';
import { escapeXML } from '../aux';
import { parseOSRTT } from '../parsers/osrtt';
import { renderText } from '../rendering-helpers/text';
import { renderRect, renderLine } from '../rendering-helpers/lines';
import { renderHeader } from './general-components';

const {good: GREEN, moderate: YELLOW, poor: RED, missing: NA} = colors.osrtt;
const layout = dimensions.osrtt;
const padding = dimensions.specs.padding;
const panelRight = dimensions.canvas.width - padding;
const panelBottom = dimensions.canvas.height - padding;
const panelWidth = (panelRight - padding) / 3;
const panelHeight = panelBottom - layout.summaryTop;
const formatMeasurement = (value, digits = 1) => Number.isFinite(value) ? String(Number(value.toFixed(digits))) : 'N/A';
const text = (x, y, value, size = layout.fontSize.default, fill = colors.general.outline, anchor = 'start') => renderText({
    x, y, text: escapeXML(value), fontSize: size, fill, textAnchor: anchor
});
const box = (x, y, width, height, fill) => renderRect({x, y, width, height, fill: `#${fill}`, stroke: 'none'});

// Map measurements to colors by linearly interpolating RGB channels between
// threshold/color pairs. Clamp out-of-range values and use the missing color for N/A.
function createMeasurementColorScale(stops) {
    return value => {
        if (!Number.isFinite(value)) return NA;
        if (value <= stops[0][0]) return stops[0][1];
        for (let i = 1; i < stops.length; i++) {
            const [high, end] = stops[i], [low, start] = stops[i - 1];
            if (value > high) continue;
            const fraction = (value - low) / (high - low);
            return [0, 2, 4].map(offset => Math.round(parseInt(start.slice(offset, offset + 2), 16) * (1 - fraction)
                + parseInt(end.slice(offset, offset + 2), 16) * fraction).toString(16).padStart(2, '0')).join('');
        }
        return stops[stops.length - 1][1];
    };
}
const responseColor = createMeasurementColorScale([[0, GREEN], [1, GREEN], [5, YELLOW], [10, RED]]);
const overshootColor = createMeasurementColorScale([[0, GREEN], [5, GREEN], [15, YELLOW], [20, RED]]);
const ratingColor = createMeasurementColorScale([[0, RED], [50, RED], [70, YELLOW], [90, GREEN], [100, GREEN]]);

function heatmap(report, frameX, title, metric, color) {
    const {levels, transitions} = report;
    const {top, height, leftInset, titleY, targetLabelY, sourceLabelOffsetX, cellFontWidthRatio} = layout.heatmap;
    const x = frameX + leftInset, width = panelWidth - leftInset;
    const cw = width / (levels.length + 1), ch = height / (levels.length + 1);
    let body = text(frameX + panelWidth / 2, titleY, title, layout.fontSize.heatmapTitle, colors.general.outline, 'middle');
    body += text(x + (width + cw) / 2, targetLabelY, 'Cílové RGB', layout.fontSize.axisLabel, colors.general['font-secondary'], 'middle');
    body += `<g transform="translate(${frameX + sourceLabelOffsetX},${top + (height + ch) / 2}) rotate(-90)">${text(0, 0, 'Výchozí RGB', layout.fontSize.axisLabel, colors.general['font-secondary'], 'middle')}</g>`;
    // A continuous backing avoids antialiasing seams between white axis cells.
    body += box(x, top, width, height, colors.general.outline);
    body += renderRect({x: frameX, y: top, width: x - frameX, height: ch});
    for (let r = 0; r <= levels.length; r++) {
        for (let c = 0; c <= levels.length; c++) {
            const xx = x + c * cw, yy = top + r * ch;
            const header = r === 0 || c === 0, diagonal = !header && r === c;
            const value = header || diagonal ? null : transitions.get(`${levels[r - 1]}:${levels[c - 1]}`)?.[metric];
            const fill = diagonal ? colors.osrtt.diagonal : color(value);
            const label = header ? (r === c ? '' : levels[(r === 0 ? c : r) - 1]) : diagonal ? '' : formatMeasurement(value, 1);
            if (!header) body += box(xx, yy, cw, ch, fill);
            body += text(xx + cw / 2, yy + ch / 2, label, Math.min(layout.fontSize.heatmapCell, cw * cellFontWidthRatio), header ? colors.general.background : colors.general.outline, 'middle');
        }
    }
    // Draw the value-cell grid after all fills, leaving the white axes continuous.
    for (let i = 2; i <= levels.length; i++) {
        body += renderLine(x + i * cw, top + ch, x + i * cw, top + height, colors.general.outline);
        body += renderLine(x + cw, top + i * ch, x + width, top + i * ch, colors.general.outline);
    }
    const labelHeight = layout.summaryTop - top - height;
    body += renderRect({x: frameX, y: top + ch, width: x - frameX, height: height - ch});
    body += renderRect({x, y: top + height, width, height: labelHeight});
    body += renderRect({x: frameX, y: top + height, width: x - frameX, height: labelHeight});
    body += renderLine(frameX, top, x + width, top, colors.general.outline);
    return body + renderLine(x, top, x, top + height, colors.general.outline)
        + renderLine(x + width, top, x + width, top + height, colors.general.outline);
}

function table(x, y, rows, {width = panelWidth, height = panelHeight} = {}) {
    const labelWidth = width * layout.table.labelWidth / layout.table.referenceWidth, rowHeight = height / rows.length;
    return rows.map(([label, value, color = NA], i) => {
        const yy = y + i * rowHeight;
        return box(x, yy, labelWidth, rowHeight, i % 2 ? colors.osrtt['row-darker'] : colors.general.background)
            + box(x + labelWidth, yy, width - labelWidth, rowHeight, color)
            + (i > 0 ? renderLine(x + labelWidth, yy, x + width, yy, colors.general.outline) : '')
            + text(x + labelWidth - layout.table.textPadding, yy + rowHeight / 2, label, layout.fontSize.default, colors.general.outline, 'end')
            + text(x + labelWidth + layout.table.textPadding, yy + rowHeight / 2, value);
    }).join('') + renderLine(x + labelWidth, y, x + labelWidth, y + height, colors.general.outline);
}

function infoRow(x, y, cells, height) {
    let body = '';
    for (const [value, width, white = false] of cells) {
        body += box(x, y, width, height, white ? colors.general.outline : colors.general.background);
        body += text(x + width / 2, y + height / 2, value, layout.fontSize.info,
            white ? colors.general.background : colors.general.outline, 'middle');
        x += width;
    }
    return body;
}

function legend(x, y, title, direction, labels, palette, rowHeight, width = panelWidth) {
    const cellWidth = width / labels.length;
    const titleWidth = width * layout.legend.titleWidthRatio;
    const headerHeight = rowHeight, barHeight = rowHeight;
    let body = box(x, y, titleWidth, headerHeight, colors.general.outline);
    body += text(x + titleWidth / 2, y + headerHeight / 2, title, layout.fontSize.legendTitle, colors.general.background, 'middle');
    body += text(x + titleWidth + (width - titleWidth) / 2, y + headerHeight / 2, direction, layout.fontSize.legendTitle, colors.general.outline, 'middle');
    labels.forEach((label, i) => {
        body += box(x + i * cellWidth, y + headerHeight, cellWidth, barHeight, palette[i]);
        body += text(x + (i + .5) * cellWidth, y + headerHeight + barHeight / 2, label, layout.fontSize.legendValue, colors.general.outline, 'middle');
    });
    body += renderLine(x + titleWidth, y, x + titleWidth, y + headerHeight, colors.general.outline);
    for (let i = 1; i < labels.length; i++) {
        body += renderLine(x + i * cellWidth, y + headerHeight,
            x + i * cellWidth, y + headerHeight + barHeight, colors.general.outline);
    }
    return body;
}

export function renderOSRTT(props, inputName) {
    const report = parseOSRTT(props.sourceFile, inputName);
    const {metadata: m, summary: s} = report;
    const metric = (label, value, color, unit = '') => [label, formatMeasurement(value) + (Number.isFinite(value) ? unit : ''), color(value)];
    const header = {...props, name: escapeXML(props.name || `Odezva – ${m.MonitorName || 'OSRTT'}`), info: props.info ?? [
        {title: 'Rozlišení', value: m.Resolution || 'N/A'},
        {title: 'Frekvence', value: `${m.RefreshRate} Hz`},
        {title: 'Overdrive', value: m.OverdriveMode === 'Off' ? 'Vypnuto' : String(m.OverdriveMode ?? 'N/A')}
    ]};
    // Metadata originates in the export and may contain XML-special characters.
    header.info = header.info.map(item => ({...item,
        title: typeof item.title === 'object' ? {...item.title, text: escapeXML(item.title.text)} : escapeXML(item.title ?? ''),
        value: typeof item.value === 'object' ? {...item.value, text: escapeXML(item.value.text)} : escapeXML(item.value ?? '')
    }));
    const responseRows = [
        ['Obnovovací frekvence', `${m.RefreshRate} Hz`, colors.osrtt.refresh],
        ['Doba jednoho snímku', `${formatMeasurement(s.window)} ms`, colors.osrtt.refresh],
        metric('Přechody v době snímku', s.percentInWindow, ratingColor, '%'),
        metric('Průměrná počáteční odezva', s.averageInitial, responseColor, ' ms'),
        metric('Průměrná úplná odezva', s.averageComplete, responseColor, ' ms'),
        metric('Průměrná vnímaná odezva', s.averagePerceived, responseColor, ' ms'),
        metric('Průměrná odezva při zesvětlení', s.averageRise, responseColor, ' ms'),
        metric('Průměrná odezva při ztmavení', s.averageFall, responseColor, ' ms'),
        metric('0–255–0', s.cycle, responseColor, ' ms'),
        metric('Nejlepší odezva', s.bestPerceived, responseColor, ' ms'),
        metric('Nejhorší odezva', s.worstPerceived, responseColor, ' ms')
    ];
    const ratingRows = [
        metric('Průměrný překmit', s.averageOvershoot, overshootColor),
        metric('Nejvyšší překmit', s.worstOvershoot, overshootColor),
        metric('Přechody s překmitem > 10 RGB', s.percentAbove10, value => ratingColor(Number.isFinite(value) ? 100 - value : null), '%'),
        metric('Průměrné hodnocení', s.averageRating, ratingColor),
        metric('Hodnocení při zesvětlení', s.averageRiseRating, ratingColor),
        metric('Hodnocení při ztmavení', s.averageFallRating, ratingColor),
        metric('Nejlepší hodnocení', s.bestRating, ratingColor),
        metric('Nejhorší hodnocení', s.worstRating, ratingColor)
    ];
    const infoRows = [
        [
            ['Platné přechody'],
            ['RT', true], [`${s.validCounts.perceived}/${s.totalTransitions}`],
            ['OS', true], [`${s.validCounts.overshoot}/${s.totalTransitions}`],
            ['VRR', true], [`${s.validCounts.rating}/${s.totalTransitions}`]
        ].map(([value, white], i) => [value, layout.info.transitionCellWidths[i], white]),
        [
            ['Limit FPS', true], [m.FPSLimit ?? 'N/A'],
            ['V-Sync', true], [m.Vsync === true ? 'zapnuto' : m.Vsync === false ? 'vypnuto' : 'N/A']
        ].map(([value, white]) => [value, panelWidth / 4, white])
    ];
    const legends = [
        ['Odezva [ms]', 'nižší je lepší', ['1', '5', '10'], [GREEN, YELLOW, RED]],
        ['Překmit [RGB]', 'nižší je lepší', ['5', '15', '20'], [GREEN, YELLOW, RED]],
        ['Hodnocení odezvy', 'vyšší je lepší', ['50', '70', '90'], [RED, YELLOW, GREEN]]
    ];
    const summaryRowHeight = panelHeight / (ratingRows.length + infoRows.length);
    const legendRowCount = legends.length * 2 + 1;
    const legendRowHeight = panelHeight / legendRowCount;
    const summaryX = padding + panelWidth, legendX = summaryX + panelWidth;
    const top = layout.summaryTop;
    const ratingHeight = ratingRows.length * summaryRowHeight;
    const infoTop = top + ratingHeight;

    let body = renderHeader(header);
    body += renderLine(summaryX, layout.contentTop, summaryX, panelBottom, colors.general.outline)
        + renderLine(legendX, layout.contentTop, legendX, panelBottom, colors.general.outline);
    body += renderLine(padding, top, panelRight, top, colors.general.outline);
    body += heatmap(report, padding, 'Vnímaná odezva [ms]', 'perceived', responseColor);
    body += heatmap(report, summaryX, 'Překmit [RGB]', 'overshoot', overshootColor);
    body += heatmap(report, legendX, 'Vizuální hodnocení odezvy', 'rating', ratingColor);
    body += table(padding, top, responseRows);
    body += renderRect({x: padding, y: top, width: panelWidth, height: panelHeight});
    body += table(summaryX, top, ratingRows, {height: ratingHeight});
    body += renderRect({x: summaryX, y: top, width: panelWidth, height: ratingHeight});
    body += renderLine(summaryX, top + 3 * summaryRowHeight, legendX, top + 3 * summaryRowHeight, colors.general.outline);
    infoRows.forEach((cells, i) => {
        body += infoRow(summaryX, infoTop + i * summaryRowHeight, cells, summaryRowHeight);
    });
    infoRows.forEach((_, i) => {
        body += renderLine(summaryX, infoTop + i * summaryRowHeight, legendX, infoTop + i * summaryRowHeight, colors.general.outline);
    });
    body += renderLine(summaryX, infoTop, summaryX, panelBottom, colors.general.outline);
    legends.forEach(([title, direction, labels, palette], i) => {
        body += legend(legendX, top + i * 2 * legendRowHeight, title, direction, labels, palette, legendRowHeight);
    });
    const naPatchWidth = layout.legend.missingPatchWidth;
    const naRowY = top + (legendRowCount - 1) * legendRowHeight;
    body += box(legendX, naRowY, naPatchWidth, legendRowHeight, NA);
    body += text(legendX + naPatchWidth + (panelWidth - naPatchWidth) / 2, naRowY + legendRowHeight / 2, 'N/A: chybí / neplatné, nezapočítáno', layout.fontSize.default, colors.general.outline, 'middle');
    body += renderLine(legendX + naPatchWidth, naRowY, legendX + naPatchWidth, panelBottom, colors.general.outline);
    // Draw row borders after all fills so adjoining cells cannot cover them.
    for (let i = 0; i <= legendRowCount; i++) {
        const y = top + i * legendRowHeight;
        body += renderLine(legendX, y, panelRight, y, colors.general.outline);
    }
    // Keep the frame divider visible over the edge-to-edge legend fills.
    body += renderLine(legendX, top, legendX, panelBottom, colors.general.outline);
    body += renderLine(padding, panelBottom, panelRight, panelBottom, colors.general.outline);
    return body;
}
