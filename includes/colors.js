export function hexToRgb(hex) {
    const bigint = parseInt(hex, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

export function rgbToHex(rgb) {
    return rgb.map(value => {
        const hex = value.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

export function interpolateColor(color1, color2, factor) {
    const result = color1.slice();
    for (let i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - result[i]));
    }
    return result;
}

export function mapToGradient(value, colors, maxVal) {
    const range = (maxVal / (colors.length - 1));
    const lowerIndex = Math.floor(value / range);
    const upperIndex = lowerIndex + 1;
    const factor = (value % range) / range;

    const lowerColor = hexToRgb(colors[lowerIndex]);
    const upperColor = hexToRgb(colors[upperIndex]);

    const interpolatedColor = interpolateColor(lowerColor, upperColor, factor);
    return rgbToHex(interpolatedColor);
}
