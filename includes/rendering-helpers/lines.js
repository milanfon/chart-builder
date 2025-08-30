import colors from "../../constants/colors.json" assert {type: "json"}

export function verticalLine(x, y1, y2) {
    return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#${colors.general.outline}" stroke-width="2"/>`;
}
