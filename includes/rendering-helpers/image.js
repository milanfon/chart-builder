import { escapeXML } from "../aux";

export const ImageAspectRatio = Object.freeze({
    NONE: 'none',
    TOP_LEFT_MEET: 'xMinYMin meet',
    TOP_CENTER_MEET: 'xMidYMin meet',
    TOP_RIGHT_MEET: 'xMaxYMin meet',
    CENTER_LEFT_MEET: 'xMinYMid meet',
    CENTER_MEET: 'xMidYMid meet',
    CENTER_RIGHT_MEET: 'xMaxYMid meet',
    BOTTOM_LEFT_MEET: 'xMinYMax meet',
    BOTTOM_CENTER_MEET: 'xMidYMax meet',
    BOTTOM_RIGHT_MEET: 'xMaxYMax meet',
    TOP_LEFT_SLICE: 'xMinYMin slice',
    TOP_CENTER_SLICE: 'xMidYMin slice',
    TOP_RIGHT_SLICE: 'xMaxYMin slice',
    CENTER_LEFT_SLICE: 'xMinYMid slice',
    CENTER_SLICE: 'xMidYMid slice',
    CENTER_RIGHT_SLICE: 'xMaxYMid slice',
    BOTTOM_LEFT_SLICE: 'xMinYMax slice',
    BOTTOM_CENTER_SLICE: 'xMidYMax slice',
    BOTTOM_RIGHT_SLICE: 'xMaxYMax slice'
});

// Accept embedded data URLs and relative image paths; callers own image loading.
export function renderImage({href, x = 0, y = 0, width, height, preserveAspectRatio}) {
    const attributes = Object.entries({"xlink:href": href, x, y, width, height, preserveAspectRatio})
        .filter(([, value]) => value !== undefined)
        .map(([name, value]) => `${name}="${escapeXML(value)}"`).join(' ');
    return `<image ${attributes}/>`;
}
