import fs from "node:fs";
import { determineFilePath } from "../aux";

function decodeHTMLEntities(text) {
    return text.replace(/&(#x[\da-f]+|#\d+|quot|apos|lt|gt|amp);/gi, (match, entity) => {
        if (entity[0] === '#')
            return String.fromCodePoint(entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10));
        return {quot: '"', apos: "'", lt: '<', gt: '>', amp: '&'}[entity.toLowerCase()];
    });
}

function parseCGATS(text, label, requireXYZ) {
    const fields = text?.match(/BEGIN_DATA_FORMAT\s+([\s\S]*?)\s+END_DATA_FORMAT/)?.[1].trim().split(/\s+/);
    const data = text?.match(/\bBEGIN_DATA\s+([\s\S]*?)\s+END_DATA\b/)?.[1];
    const required = ['SAMPLE_ID', 'RGB_R', 'RGB_G', 'RGB_B', 'LAB_L', 'LAB_A', 'LAB_B'];
    if (requireXYZ) required.push('XYZ_X', 'XYZ_Y', 'XYZ_Z');
    if (!fields || !data || required.some(key => !fields.includes(key)))
        throw new Error(`DisplayCAL: ${label} must contain RGB/Lab${requireXYZ ? '/XYZ' : ''} CGATS measurements`);
    const rows = data.trim().split(/\r?\n/).filter(line => line.trim() && !line.trim().startsWith('#')).map(line => {
        const values = line.trim().split(/\s+/);
        if (values.length !== fields.length)
            throw new Error(`DisplayCAL: malformed ${label} data row`);
        const row = Object.fromEntries(fields.map((key, i) => [key, key === 'SAMPLE_ID' ? values[i] : Number(values[i])]));
        if (required.filter(key => key !== 'SAMPLE_ID').some(key => !Number.isFinite(row[key])))
            throw new Error(`DisplayCAL: non-numeric ${label} measurement`);
        return row;
    });
    const count = Number(text.match(/NUMBER_OF_SETS\s+(\d+)/)?.[1]);
    if (!rows.length || (Number.isFinite(count) && rows.length !== count) || new Set(rows.map(row => row.SAMPLE_ID)).size !== rows.length)
        throw new Error(`DisplayCAL: invalid ${label} patch count or duplicate sample IDs`);
    return rows;
}

/*
 * CIEDE2000 for two CIELAB colors, with kL = kC = kH = 1:
 * ΔE00 = sqrt((ΔL′ / SL)^2 + (ΔC′ / SC)^2 + (ΔH′ / SH)^2
 *             + RT * (ΔC′ / SC) * (ΔH′ / SH)).
 * G adjusts a* before computing primed chroma/hue; SL, SC and SH weight
 * lightness, chroma and hue, and RT accounts for their interaction in blues.
 * Hue angles below are in degrees, including wraparound and achromatic cases.
 * Source: Sharma, Wu & Dalal (2005), The CIEDE2000 Color-Difference Formula:
 * Implementation Notes, Supplementary Test Data, and Mathematical Observations.
 * https://doi.org/10.1002/col.20070
 */
export function deltaE2000([l1, a1, b1], [l2, a2, b2]) {
    const rad = degrees => degrees * Math.PI / 180;
    const cos = degrees => Math.cos(rad(degrees));
    const sin = degrees => Math.sin(rad(degrees));
    const c1 = Math.hypot(a1, b1), c2 = Math.hypot(a2, b2), c = (c1 + c2) / 2;
    const g = (1 - Math.sqrt(c ** 7 / (c ** 7 + 25 ** 7))) / 2;
    const ap1 = a1 * (1 + g), ap2 = a2 * (1 + g);
    const cp1 = Math.hypot(ap1, b1), cp2 = Math.hypot(ap2, b2);
    const hue = (a, b) => (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
    const h1 = hue(ap1, b1), h2 = hue(ap2, b2);
    let dh = h2 - h1;
    if (cp1 * cp2 === 0) dh = 0;
    else if (dh > 180) dh -= 360;
    else if (dh < -180) dh += 360;
    const dl = l2 - l1, dc = cp2 - cp1, dH = 2 * Math.sqrt(cp1 * cp2) * sin(dh / 2);
    const lm = (l1 + l2) / 2, cm = (cp1 + cp2) / 2;
    const hm = cp1 * cp2 === 0 ? h1 + h2 : Math.abs(h1 - h2) <= 180 ? (h1 + h2) / 2 : (h1 + h2 + (h1 + h2 < 360 ? 360 : -360)) / 2;
    const t = 1 - .17 * cos(hm - 30) + .24 * cos(2 * hm) + .32 * cos(3 * hm + 6) - .20 * cos(4 * hm - 63);
    const sl = 1 + .015 * (lm - 50) ** 2 / Math.sqrt(20 + (lm - 50) ** 2);
    const sc = 1 + .045 * cm, sh = 1 + .015 * cm * t;
    const rt = -2 * Math.sqrt(cm ** 7 / (cm ** 7 + 25 ** 7)) * sin(60 * Math.exp(-(((hm - 275) / 25) ** 2)));
    return Math.sqrt((dl / sl) ** 2 + (dc / sc) ** 2 + (dH / sh) ** 2 + rt * (dc / sc) * (dH / sh));
}

/*
 * Inverse CIELAB (D50 reference white, XYZ normalized to Yn = 1):
 * fy = (L* + 16) / 116; fx = fy + a* / 500; fz = fy - b* / 200.
 * [X, Y, Z] = [Xn * f⁻¹(fx), Yn * f⁻¹(fy), Zn * f⁻¹(fz)],
 * where δ = 6/29 and f⁻¹(t) = t^3 for t > δ, else 3δ^2(t - 4/29).
 * The ICC D50 reference white is [Xn, Yn, Zn] = [0.9642, 1, 0.8249].
 */
export function labToXYZ([l, a, b]) {
    const y = (l + 16) / 116;
    const inverse = t => t > 6 / 29 ? t ** 3 : 3 * (6 / 29) ** 2 * (t - 4 / 29);
    return [inverse(y + a / 500) * .9642, inverse(y), inverse(y - b / 200) * .8249];
}

/*
 * Bradford adaptation: XYZ_D65 = M_B⁻¹ * diag(M_B * W_D65 / (M_B * W_D50))
 *                                   * M_B * XYZ_D50.
 * The coefficients below are the combined D50 -> D65 matrix.
 */
export function adaptXYZD50ToD65([x, y, z]) {
    return [
        .9555766 * x - .0230393 * y + .0631636 * z,
        -.0282895 * x + 1.0099416 * y + .0210077 * z,
        .0122982 * x - .0204830 * y + 1.3299098 * z
    ];
}

/*
 * Preview conversion: Lab -> D50 XYZ -> D65 XYZ -> linear sRGB -> encoded sRGB.
 * The matrix maps D65 XYZ (Yn = 1) to linear sRGB (IEC 61966-2-1).
 * Encode each channel c as 12.92c if c <= 0.0031308,
 * otherwise 1.055c^(1/2.4) - 0.055, then clamp to [0, 1] and round to 8-bit.
 * `clipped` flags linear channels outside [0, 1]; only the preview is clipped,
 * not the Lab data used for ΔE calculations.
 */
export function labToSRGB(lab) {
    const [xd, yd, zd] = adaptXYZD50ToD65(labToXYZ(lab));
    const linear = [3.2404542 * xd - 1.5371385 * yd - .4985314 * zd, -.9692660 * xd + 1.8760108 * yd + .0415560 * zd, .0556434 * xd - .2040259 * yd + 1.0572252 * zd];
    const clipped = linear.some(v => v < 0 || v > 1);
    const rgb = linear.map(v => Math.round(255 * Math.max(0, Math.min(1, v <= .0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - .055))));
    return {color: `rgb(${rgb.join(',')})`, clipped};
}

// CIE 1976 UCS chromaticity: u′ = 4X / (X + 15Y + 3Z),
// v′ = 9Y / (X + 15Y + 3Z). XYZ may use any common scale.
// A nonpositive denominator has no usable chromaticity and returns null.
export function xyzToUV([x, y, z]) {
    const denominator = x + 15 * y + 3 * z;
    return denominator > 0 ? [4 * x / denominator, 9 * y / denominator] : null;
}

export function parseMeasurementReport(filePath, inputName) {
    if (typeof filePath !== 'string' || !filePath.length)
        throw new Error('DisplayCAL: sourceFile is required');
    const text = fs.readFileSync(determineFilePath(filePath, inputName), 'utf8');
    const inputs = {};
    for (const tag of text.matchAll(/<input\b[^>]*>/gi)) {
        const attrs = Object.fromEntries([...tag[0].matchAll(/([\w-]+)\s*=\s*(["'])([\s\S]*?)\2/g)].map(m => [m[1].toLowerCase(), decodeHTMLEntities(m[3])]));
        if (attrs.name) inputs[attrs.name] = attrs.value;
    }
    const measured = parseCGATS(inputs.FF_data_in, 'measured', true);
    const reference = parseCGATS(inputs.FF_data_ref, 'reference', false);
    const refs = new Map(reference.map(row => [row.SAMPLE_ID, row]));
    const extractCGATSTriplet = (row, prefix, suffixes) => suffixes.map(suffix => row[`${prefix}_${suffix}`]);
    if (measured.length !== reference.length)
        throw new Error('DisplayCAL: reference and measured patch counts differ');
    const patches = measured.map(row => {
        const ref = refs.get(row.SAMPLE_ID);
        const rgb = extractCGATSTriplet(row, 'RGB', ['R', 'G', 'B']);
        if (!ref || rgb.some((v, i) => v < 0 || v > 100 || Math.abs(v - extractCGATSTriplet(ref, 'RGB', ['R', 'G', 'B'])[i]) > .001))
            throw new Error(`DisplayCAL: reference RGB mismatch for sample ${row.SAMPLE_ID}`);
        const lab = extractCGATSTriplet(row, 'LAB', ['L', 'A', 'B']);
        const referenceLab = extractCGATSTriplet(ref, 'LAB', ['L', 'A', 'B']);
        return {id: row.SAMPLE_ID, rgb, lab, referenceLab, xyz: extractCGATSTriplet(row, 'XYZ', ['X', 'Y', 'Z']), deltaE: deltaE2000(referenceLab, lab), gray: Math.max(...rgb) - Math.min(...rgb) < .001};
    });
    const reading = key => {
        const values = inputs[key]?.trim().split(/\s+/).map(Number);
        if (!values || values.length !== 3 || values.some(v => !Number.isFinite(v)))
            throw new Error(`DisplayCAL: missing or invalid ${key} reading`);
        return values;
    };
    const white = reading('FF_whitepoint'), black = reading('FF_blackpoint');
    if (white[1] <= 0 || black[1] < 0) throw new Error('DisplayCAL: invalid luminance readings');
    const average = list => list.length ? list.reduce((sum, patch) => sum + patch.deltaE, 0) / list.length : null;
    return {patches, white, black, contrast: black[1] > 0 ? white[1] / black[1] : null,
        average: average(patches), maximum: Math.max(...patches.map(patch => patch.deltaE)),
        grayAverage: average(patches.filter(patch => patch.gray)), colorAverage: average(patches.filter(patch => !patch.gray)),
        display: inputs.FF_display || '', instrument: inputs.FF_instrument || '', profile: inputs.FF_profile || '', datetime: inputs.FF_datetime || ''};
}
