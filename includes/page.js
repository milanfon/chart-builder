class Page {
    constructor(props) {
        this.props = props;
    }

    renderName() {
        return `<text x="50%" y="5%" text-anchor="middle" dominant-baseline="hanging"
    font-family="Roboto Medium" font-size="26pt"
    id="text513">${this.props.name}</text>`;
    }

    getVerticalScales() {
        const n = this.props.series.length;
        const start = 100/(n + 1);
        return Array.apply(undefined, Array(n)).map((i , index) => (start*(index+1)).toFixed(1));
    }

    renderSeriesNames() {
        const scales = this.getVerticalScales();
        const n = this.props.series.length;
        return [...Array(n).keys()].reduce((prev, curr) => prev + `
            <text x="0" y="${scales[curr]}%" font-size="25pt" text-anchor="start" dominant-baseline="middle">
            ${this.props.series[curr].name}
            </text>
        `, "");
    }

    renderLines() {

    }

    render() {
        console.log(this.getVerticalScales());
        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="2000" height="1000" version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:svg="http://www.w3.org/2000/svg">
    ${this.renderName()} 
    <g transform="scale(0.9) translate(100 100)">
        ${this.renderSeriesNames()}
    </g>
</svg>`;
    }
}

module.exports = Page;