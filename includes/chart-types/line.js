import dimensions from "../../constants/dimensions.json";
import colors from "../../constants/colors.json";

function determineTicks(size, bounds) {
    const diff = bounds[1] - bounds[0];
    console.log(diff);
}

export function renderVerticalAxis(data, order) {
    const height = 860;
    const outline = `<rect x="30" y="150" width="${dimensions.stats.axisWidth}" height="${height}" stroke="#${colors.general.outline}" fill="none" stroke-width="2"/>`;
    determineTicks(height, data.bounds);
    const ticks = "";
    return `
        ${outline}
    `;
}
