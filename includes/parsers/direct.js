export function parseDirect(values, {xBounds}) {
    const vals = {};
    const xValues = {};
    let minX = Infinity;
    let maxX = -Infinity;

    values.forEach(v => {
        v.series.forEach(s => {
            if (!Array.isArray(s.data))
                throw new Error(`Missing or invalid direct data for series '${s.key}'`);

            const isPairs = s.data.length > 0 && Array.isArray(s.data[0]);
            if (isPairs) {
                const xs = [];
                const ys = [];
                s.data.forEach(point => {
                    if (!Array.isArray(point) || point.length < 2)
                        throw new Error(`Invalid [x, y] point in direct data for series '${s.key}'`);
                    const x = Number(point[0]);
                    const y = Number(point[1]);
                    if (Number.isNaN(x) || Number.isNaN(y))
                        throw new Error(`Non-numeric [x, y] point in direct data for series '${s.key}'`);
                    xs.push(x);
                    ys.push(y);
                    if (x < minX)
                        minX = x;
                    if (x > maxX)
                        maxX = x;
                });
                xValues[s.key] = xs;
                vals[s.key] = ys;
            } else {
                const ys = s.data.map((value, index) => {
                    const y = Number(value);
                    if (Number.isNaN(y))
                        throw new Error(`Non-numeric y value in direct data for series '${s.key}'`);
                    if (index < minX)
                        minX = index;
                    if (index > maxX)
                        maxX = index;
                    return y;
                });
                xValues[s.key] = ys.map((_, index) => index);
                vals[s.key] = ys;
            }
        });
    });

    if (xBounds && Number.isFinite(minX) && Number.isFinite(maxX)) {
        xBounds[0] = minX;
        xBounds[1] = maxX;
    }

    return {vals, xValues};
}
