class Page {
    constructor(props) {
        this.props = props;
    }

    renderName() {
        return `<text x="50%" y="5%" text-anchor="middle" dominant-baseline="hanging"
    font-family="Roboto Medium" font-size="26pt"
    id="text513">${this.props.name}</text>`;
    }

    render() {
        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="2000" height="1000" version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:svg="http://www.w3.org/2000/svg">
    ${this.renderName()} 
</svg>`
    }
}

module.exports = Page;