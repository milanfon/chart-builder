import colors from "../../constants/colors.json" assert {type: "json"}
import dimensions from "../../constants/dimensions.json" assert {type: "json"}

export function renderText({
    x,
    y,
    fill = colors.general.outline,
    fontFamily = "Russo One",
    fontSize = dimensions.specs["font-size"].default,
    text = "",
    textAnchor = "middle",
    alignBaseline = "middle",
    dominantBaseline = "central"
}) {
    let [actualText, actualSize]  = [text, fontSize];
    if (typeof text === "object") {
        if (text?.text)
            actualText = text.text;
        else
            console.log("Text object does not include text field!", text);
        if (text?.size && typeof text?.size === "number")
            actualSize = text.size;
        else
            console.log("Size in object not defined or has wrong type!", text);
    } else if (typeof text != "string" && typeof text != "number") {
        console.log("Invalid text type!", text);
    }
    return `<text x="${x}" y="${y}" fill="#${fill}" text-anchor="${textAnchor}" align-baseline="${alignBaseline}" font-family="${fontFamily}" font-size="${actualSize}" dominant-baseline="${dominantBaseline}">${actualText}</text>`
}

export function estimateTextWidth(text, fontSize = dimensions.specs["font-size"].default) {
    return [...String(text)].reduce((width, char) => {
        if ("ilI1.,' ".includes(char))
            return width + fontSize * 0.35;
        if ("MW@#%&".includes(char))
            return width + fontSize * 0.9;
        if (/[A-Z0-9]/.test(char))
            return width + fontSize * 0.7;
        return width + fontSize * 0.55;
    }, 0);
}
