import colors from "../../constants/colors.json" assert {type: "json"}

export function verticalLine(x, y1, y2) {
    return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#${colors.general.outline}" stroke-width="2"/>`;
}

export function renderLine(x1, y1, x2, y2, stroke = colors.general["grid-line"], dash = "", strokeWidth = 2) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#${stroke}" stroke-width="${strokeWidth}" ${dash ? `stroke-dasharray="${dash}"` : ""}/>`;
}

export function renderPolyline(points, stroke, dash = "", strokeWidth = 3) {
    return `<polyline points="${points.map(point => point.join(",")).join(" ")}" fill="none" stroke="#${stroke}" stroke-width="${strokeWidth}" ${dash ? `stroke-dasharray="${dash}"` : ""}/>`;
}

export function renderRect({x = 0, y = 0, width, height, fill = 'none', stroke = colors.general.outline, strokeWidth = 2, content = ''}) {
    const strokeColor = stroke === 'none' ? 'none' : `#${stroke}`;
    const attributes = `x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="${strokeColor}" stroke-width="${strokeWidth}"`;
    return content ? `<rect ${attributes}>${content}</rect>` : `<rect ${attributes}/>`;
}
