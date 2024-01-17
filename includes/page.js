const colors = require("../constants/colors.json");
const dimensions = require("../constants/dimensions.json");
const {getCurrentDateMonth, imageToBase64} = require("../includes/aux");

class Page {
    constructor(props) {
        this.props = props;
    }

    betterMap = {
        "higher": "Vyšší je lepší",
        "lower": "Nižší je lepší"
    }

    typesKeys= {
        "avg-percentile": [
            "Průměr",
            "1% Percentil"
        ]
    }

    typesColors = {
        "avg-percentile": [
            "primary",
            "secondary"
        ]
    }

    

    renderHeader() {
        const imageHref = `data:image/png;base64,${imageToBase64("./assets/logo.png")}`;
        return `
            <line x1="240" y1="30" x2="240" y2="150" stroke="#${colors.general.outline}" stroke-width="2"/>
            <line x1="30" y1="150" x2="2130" y2="150" stroke="#${colors.general.outline}" stroke-width="2"/>
            <line x1="1320" y1="30" x2="1320" y2="150" stroke="#${colors.general.outline}" stroke-width="2"/>
            <line x1="1520" y1="30" x2="1520" y2="150" stroke="#${colors.general.outline}" stroke-width="2"/>
            <line x1="1820" y1="30" x2="1820" y2="150" stroke="#${colors.general.outline}" stroke-width="2"/>
            <line x1="1320" y1="70" x2="1820" y2="70" stroke="#${colors.general.outline}" stroke-width="2"/>
            <line x1="1320" y1="110" x2="1820" y2="110" stroke="#${colors.general.outline}" stroke-width="2"/>
            <rect x="240" y="30" width="1080" height="120" fill="#${colors.general.outline}"/>
            <text x="270" y="90" fill="#${colors.general.background}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="40" dominant-baseline="central">${this.props.name}</text>

            <text x="1340" y="50" fill="#${colors.general.outline}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">Nastavení</text>
            <text x="1340" y="90" fill="#${colors.general.outline}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">Driver</text>
            <text x="1340" y="130" fill="#${colors.general.outline}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">Verze</text>
            
            <text x="1540" y="50" fill="#${colors.general.outline}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">${this.props.settings}</text>
            <text x="1540" y="90" fill="#${colors.general.outline}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">${this.props.driver}</text>
            <text x="1540" y="130" fill="#${colors.general.outline}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">${this.props.version}</text>

            <text x="1975" y="90" fill="#${colors.general.outline}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="40" dominant-baseline="central">${getCurrentDateMonth()}</text>

            <image xlink:href="${imageHref}" x="36" y="47" width="210" height="90"/>
        `;
    }

    renderLegend() {
        const startX = 240;
        return this.typesColors[this.props.type].map((val, index) => `
                <g transform="translate(${startX + index * 150}, 1010)">
                    <rect x="5" y="5" width="30" height="30" fill="#${colors[this.props.type].general[val]}"/>
                    <text x="${45}" y="20" fill="#${colors.general.outline}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">${this.typesKeys[this.props.type][index]}</text>
                </g>
            `);
    }

    renderFooter() {
        return `
            <line x1="30" y1="1010" x2="2130" y2="1010" stroke="#${colors.general.outline}" stroke-width="2"/>
            <line x1="240" y1="1010" x2="240" y2="1050" stroke="#${colors.general.outline}" stroke-width="2"/>
            <text x="135" y="1030" fill="#${colors.general.outline}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">Legenda</text>
            <line x1="1580" y1="1010" x2="1580" y2="1050" stroke="#${colors.general.outline}" stroke-width="2"/>
            <line x1="1730" y1="1010" x2="1730" y2="1050" stroke="#${colors.general.outline}" stroke-width="2"/>
            <line x1="1880" y1="1010" x2="1880" y2="1050" stroke="#${colors.general.outline}" stroke-width="2"/>
            <rect x="1730" y="1010" width="150" height="40" fill="#${colors.general.outline}"/>
            <text x="1655" y="1030" fill="#${colors.general.outline}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">Jednotky</text>
            <text x="1805" y="1030" fill="#${colors.general.background}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">${this.props.units}</text>
            <text x="2005" y="1030" fill="#${colors.general.outline}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">${this.betterMap[this.props.better]}</text>
            ${this.renderLegend()}
        `;
    }

    render() {
        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${dimensions.canvas.width}" height="${dimensions.canvas.height}" version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:svg="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#${colors.general.background}"/>
    <rect x="30" y="30" width="2100" height="1020" fill="none" stroke="#${colors.general.outline}" stroke-width="2"/>
    ${this.renderHeader()}
    ${this.renderFooter()}
</svg>`;
    }
}

module.exports = Page;
