const Page = require("./includes/page");
const fs = require('fs');

const input = require('./template.json');
const pages = input.pages.map(i => new Page(i));
pages.forEach(page => fs.writeFileSync("./output/"+page.props.fileName+".svg", page.render()));