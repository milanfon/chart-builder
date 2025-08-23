const colors = require("../constants/colors.json");
const dimensions = require("../constants/dimensions.json");
import { imageToBase64} from "../includes/aux";
import { renderBrightnessTable } from "./chart-types/brightness";
import { getEmbeddedLogo, renderHeader } from "./chart-types/general-components";
import { renderLine, renderVerticalAxis } from "./chart-types/line";

export class Page {
    constructor(props, inputName) {
        this.props = props;
        this.inputName = inputName;
        if (props.type === 'bars') {
            this.calcMaxScale();
            this.sortValues();
        }
        if (this.props?.values)
            this.props.values = this.props.values.filter(i => i?.show === undefined || i.show);
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

    barKeys = [
        "primary",
        "secondary",
        "triary"
    ]

    calcMaxScale() {
        this.max = 0;
        this.props.values.forEach(i => {
            const m = Math.max(...i.val.map(v => this.getAbsValue(v)));
            if (m > this.max)
                this.max = m;
        });
        this.max = this.max * 1.1;
    }

    sortValues() {
        const sort = this.props?.sort;
        const index = this.props?.sortIndex || 0;
        if (!sort)
            return;
        this.props.values = this.props.values.sort((a, b) => this.getAbsValue(a.val[index]) - this.getAbsValue(b.val[index]));
        if (sort === 'desc')
            this.props.values = this.props.values.reverse();
    }

    getAbsValue(val) {
        if (this.props.units === 'min' || this.props.units === 'hrs') {
            const time = val.split(":");
            return parseInt(time[0]) * 60 + parseInt(time[1]);
        }
        return val;
    }

    renderLegend() {
        const startX = 240;
        return this.props.bars.map((val, index) => `
                <g transform="translate(${startX + index * (this.props.legendSpacing || 150)}, 1010)">
                    <rect x="5" y="5" width="30" height="30" fill="#${colors[this.props.type][this.props.legendBy || "general"][this.barKeys[index]]}"/>
                    <text x="${45}" y="20" fill="#${colors.general.outline}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="20" dominant-baseline="central">${val}</text>
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

    scaleBar(val) {
        const converted = this.getAbsValue(val);
        const corr = this.props.barsX ? (dimensions.canvas.barsX - this.props.barsX) : 0;
        const unit = (dimensions["bar-length"] + corr) / this.max;
        const ret = converted * unit;
        const min = this.props.units === 'min' ? 150 : 60;
        return ret > min ? ret : min;
    }

    getDescriptions(one, d, scale) {
        return this.props.values.map((val, index) => {
                const iconHref = val?.icon ? `<image xlink:href="data:image/png;base64,${imageToBase64("./assets/icons/"+val.icon+".png")}" x="0" y="0" width="${40 * scale}" height="${40 * scale}"/>` : undefined;
                return `
                <g transform="translate(0 ${index * one + d})">
                    ${iconHref || ""}
                    <text x="${iconHref ? 50 : 0}" y="${20 * scale}" fill="#${colors.general.outline}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="${40 * scale}" dominant-baseline="central">${val.name}</text>
                    <text x="0" y="${50 * scale}" fill="#${colors.general["font-secondary"]}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="${28 * scale}" dominant-baseline="hanging">${val.date}</text>
                    <text x="95" y="${50 * scale}" fill="#${colors.general["font-secondary"]}" text-anchor="start" align-baseline="middle" font-family="Russo One" font-size="${28 * scale}" dominant-baseline="hanging">${val.model || ""}</text>
                </g>
            `});
    }

    getBars(one, d, scale) {
        const h = 80;
        const count = this.props.bars.length;
        const unit = h/count;
        return this.props.values.map((val, index) => {
            const variant = val?.variant || "general";
            let bars = "";
            for (let i = 0; i < count; i++){
                bars += `
                <rect x="0" y="${i * unit * scale}" width="${this.scaleBar(val.val[i])}" height="${unit * scale}" fill="#${colors[this.props.type][variant][this.barKeys[i]]}"/>
                <text x="${this.scaleBar(val.val[i]) - 15}" y="${(i+0.5) * unit * scale}" fill="#${colors.general["font-primary"]}" text-anchor="end" align-baseline="middle" font-family="Russo One" font-size="${dimensions["font-size"].unit * scale * 1 / count}" dominant-baseline="central">${val.val[i]}</text>
            `;
            }
            return `
                <g transform="translate(0 ${index * one + d})">
                    ${bars}
                </g>
            `});
    }

    renderSeries() {
        const h = 100;
        const n = this.props.values.length;
        const height = 840;
        const one = (height / n);
        const d = (one - h) / 2;
        const scale = n > 8 ? (one/h) : 1;
        const mapped = this.getDescriptions(one, d, scale);
        const bars = this.getBars(one, d, scale);
        const barsX = this.props.barsX || dimensions.canvas.barsX;
        return `
            <g transform="translate(60, 180)">
                ${mapped}
            </g>
            <g transform="translate(${barsX}, 180)">
                ${bars}
            </g>
            <line x1="${barsX}" y1="150" x2="${barsX}" y2="1010" stroke="#${colors.general.outline}" stroke-width="2"/>
        `;
    }

    renderChart() {
        return `
            ${renderHeader(this.props)}
            ${this.renderFooter()}
            ${this.renderSeries()}
        `;
    }

    renderParameters(paramLine, headLine) {
        const paramCount = this.props.parameters.length;
        const columnCount = this.props.values.length;
        const totalHeight = dimensions.canvas.height - (2*dimensions.specs.padding + dimensions.specs["head-line"]);
        const unitHeight = totalHeight / (paramCount + 1);
        const valArea = dimensions.canvas.width - dimensions.specs.padding - paramLine;
        const valUnit = valArea / columnCount;
        let params = `
            <rect x="${dimensions.specs.padding}" y="${headLine}" width="${dimensions.specs["param-line"]}" height="${totalHeight}" fill="#${colors.specs.darker}"/>
            <rect x="${dimensions.specs.padding}" y="${headLine}" width="${dimensions.canvas.width - dimensions.specs.padding * 2}" height="${unitHeight}" fill="#${colors.specs.lighter}"/>
        `;
        for (let i = 0; i < paramCount + 1; i++) {
            const yPos = headLine + i * unitHeight;
            if (i % 2 != 0) {
                params += `<rect x="${paramLine}" y="${headLine + i * unitHeight}" width="${dimensions.canvas.width - paramLine - dimensions.specs.padding}" height="${unitHeight}" fill="#${colors.specs.darker}"/>`
            }
            params += `<line x1="${dimensions.specs.padding}" y1="${yPos}" x2="${dimensions.canvas.width - dimensions.specs.padding}" y2="${yPos}" stroke="#${colors.general.outline}" stroke-width="2"/>`;
            for (let c = 0; c < columnCount + 1; c++) {
                if (i < 1 && c < 1) {
                    params += `<text x="${dimensions.specs["param-line"] / 2 + dimensions.specs.padding}" y="${headLine + (i+0.5) * unitHeight}" fill="#${colors.general.background}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="${dimensions.specs["font-size"]}" dominant-baseline="central">Parametr</text>`
                }  else if (c < 1) {
                    params += `<text x="${dimensions.specs.padding + dimensions.specs["param-line"] / 2}" y="${headLine + (i+0.5) * unitHeight}" fill="#${colors.general.outline}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="${dimensions.specs["font-size"]}" dominant-baseline="central">${this.props.parameters[i - 1]}</text>`;
                } else if (i > 0) {
                    params += `<text x="${paramLine + (c - 0.5) * valUnit}" y="${headLine + (i+0.5) * unitHeight}" fill="#${colors.general.outline}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="${dimensions.specs["font-size"]}" dominant-baseline="central">${this.props.values[c - 1].val[i - 1]}</text>`;
                }
            }
        }
        for (let c = 1; c < columnCount + 1; c++) {
            params += `<text x="${paramLine + (c - 0.5) * valUnit}" y="${headLine + (0.5) * unitHeight}" fill="#${colors.general.background}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="${dimensions.specs["font-size"]}" dominant-baseline="central">${this.props.values[c - 1].name}</text>
                        <line x1="${paramLine + c * valUnit}" y1="${dimensions.specs.padding}" x2="${paramLine + c * valUnit}" y2="${dimensions.canvas.height - dimensions.specs.padding}" stroke="#${colors.general.outline}" stroke-width="2"/>`;
            if (this.props.values[c-1].pic) {
                params += `<image xlink:href="../../input/${this.inputName}/${this.props.values[c-1].pic.path}" x="${paramLine + (c - 0.9) * valUnit}" y="${dimensions.specs.padding + dimensions.specs["head-line"] * 0.1}" width="${valUnit * 0.8}" height="${dimensions.specs["head-line"] * 0.8}"/>`;
            }
        }
        return params;
    }

    renderSpecs() {
        const headLine = dimensions.specs.padding + dimensions.specs["head-line"];
        const headLineHalf = dimensions.specs.padding + (dimensions.specs["head-line"] / 2);
        const paramLine = dimensions.specs["param-line"] + dimensions.specs.padding;
        return `
            <rect x="30" y="30" width="${dimensions.specs["param-line"]}" height="${dimensions.specs["head-line"]/2}" fill="#${colors.general.outline}"/>
            <line x1="30" y1="${headLine}" x2="2130" y2="${headLine}" stroke="#${colors.general.outline}" stroke-width="2"/>
            <line x1="30" y1="${headLineHalf}" x2="${paramLine}" y2="${headLineHalf}" stroke="#${colors.general.outline}" stroke-width="2"/>
            <text x="${dimensions.specs.padding + dimensions.specs["param-line"]/2}" y="${dimensions.specs.padding + dimensions.specs["head-line"] / 4}" fill="#${colors.general.background}" text-anchor="middle" align-baseline="middle" font-family="Russo One" font-size="${40}" dominant-baseline="central">${this.props.name}</text>
            <image xlink:href="${getEmbeddedLogo()}" x="${dimensions.specs.padding}" y="${dimensions.specs["head-line"] * 0.55 + dimensions.specs.padding}" width="${dimensions.specs["param-line"]}" height="${dimensions.specs["head-line"]/2 * 0.8}"/>
            ${this.renderParameters(paramLine, headLine)}
            <line x1="${paramLine}" y1="30" x2="${paramLine}" y2="1050" stroke="#${colors.general.outline}" stroke-width="2"/>
        `;
    }

    render() {
        let body = "";
        if (this.props.type === 'bars')
            body = this.renderChart();
        if (this.props.type === 'line')
            body = renderLine(this.props, this.inputName);
        if (this.props.type === 'specs')
            body = this.renderSpecs();
        if (this.props.type === 'brightness')
            body = renderBrightnessTable(this.props, this.inputName);
        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${dimensions.canvas.width}" height="${dimensions.canvas.height}" version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:svg="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#${colors.general.background}"/>
    <rect x="30" y="30" width="2100" height="1020" fill="none" stroke="#${colors.general.outline}" stroke-width="2"/>
    ${body}
</svg>`;
    }
}
