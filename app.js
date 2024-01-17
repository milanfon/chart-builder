const Page = require("./includes/page");
const fs = require('fs');

const input = require('./template_new.json');
const page = new Page(input);
fs.writeFileSync("./output/"+page.props.fileName+".svg", page.render());
