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
    return `<text x="${x}" y="${y}" fill="#${fill}" text-anchor="${textAnchor}" align-baseline="${alignBaseline}" font-family="${fontFamily}" font-size="${fontSize}" dominant-baseline="${dominantBaseline}">${text}</text>`
}
