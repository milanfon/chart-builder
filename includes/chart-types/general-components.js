import colors from "../../constants/colors.json";
import { imageToBase64, getCurrentDateMonth } from "../aux";
import { renderText } from "../rendering-helpers/text";

export function getEmbeddedLogo() {
    return `data:image/png;base64,${imageToBase64("./assets/logo.png")}`;
}


export function renderHeader(props) {
    const settingsFontSize = props.sizes?.["settings-font"] || 20;
    return `
        <line x1="240" y1="30" x2="240" y2="150" stroke="#${colors.general.outline}" stroke-width="2"/>
        <line x1="30" y1="150" x2="2130" y2="150" stroke="#${colors.general.outline}" stroke-width="2"/>
        <line x1="1320" y1="30" x2="1320" y2="150" stroke="#${colors.general.outline}" stroke-width="2"/>
        <line x1="1520" y1="30" x2="1520" y2="150" stroke="#${colors.general.outline}" stroke-width="2"/>
        <line x1="1820" y1="30" x2="1820" y2="150" stroke="#${colors.general.outline}" stroke-width="2"/>
        <line x1="1320" y1="70" x2="1820" y2="70" stroke="#${colors.general.outline}" stroke-width="2"/>
        <line x1="1320" y1="110" x2="1820" y2="110" stroke="#${colors.general.outline}" stroke-width="2"/>
        <rect x="240" y="30" width="1080" height="120" fill="#${colors.general.outline}"/>
        <text x="270" y="90" fill="#${colors.general.background}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="40" dominant-baseline="central">${props.name}</text>

        ${renderText({x: 1340, y: 50, textAnchor: "start", alignBaseline: "middle", fontFamily: "Russo One", fontSize: 20, dominantBaseline: "central", text: props?.settings ? "Nastavení" : (props?.info?.[0]?.title || "")})}
        ${renderText({x: 1340, y: 90, textAnchor: "start", alignBaseline: "middle", fontFamily: "Russo One", fontSize: 20, dominantBaseline: "central", text: props?.driver ? "Driver" : (props?.info?.[1]?.title || "")})}
        ${renderText({x: 1340, y: 130, textAnchor: "start", alignBaseline: "middle", fontFamily: "Russo One", fontSize: 20, dominantBaseline: "central", text: props?.version ? "Verze" : (props?.info?.[2]?.title || "")})}
        
        ${renderText({x: 1540, y: 50, textAnchor: "start", alignBaseline: "middle", fontFamily: "Russo One", fontSize: 20, dominantBaseline: "central", text: props?.settings || props?.info?.[0]?.value || ""})}
        ${renderText({x: 1540, y: 90, textAnchor: "start", alignBaseline: "middle", fontFamily: "Russo One", fontSize: 20, dominantBaseline: "central", text: props?.driver || props?.info?.[1]?.value || ""})}
        ${renderText({x: 1540, y: 130, textAnchor: "start", alignBaseline: "middle", fontFamily: "Russo One", fontSize: 20, dominantBaseline: "central", text: props?.version || props?.info?.[2]?.value || ""})}

        <text x="1975" y="90" fill="#${colors.general.outline}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="40" dominant-baseline="central">${getCurrentDateMonth()}</text>

        <image xlink:href="${getEmbeddedLogo()}" x="30" y="47" width="210" height="90"/>
    `;
}
