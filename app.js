const fs = require('fs');
const XMLWriter = require('xml-writer');

const input = require('./template.json').pages[0];

const stream = fs.createWriteStream('./output.svg');
const writer = new XMLWriter(true, (str, enc) => stream.write(str, enc));

writer.startDocument();
writer.startElement('svg');
writer.writeAttribute('width', 2000);
writer.writeAttribute('height', 1000);
writer.writeAttribute('xmlns', "http://www.w3.org/2000/svg");
writer.writeAttribute('xmlns:xlink', "http://www.w3.org/1999/xlink");
writer.startElement('text');
writer.writeAttribute('x', "50%");
writer.writeAttribute('y', "5%");
writer.writeAttribute('text-anchor', 'middle');
writer.writeAttribute('dominant-baseline', 'hanging');
writer.writeAttribute('font-family', 'Roboto Medium');
writer.writeAttribute('font-size', '26pt');
writer.text(input.name);
writer.endElement();
writer.endElement();
writer.endDocument();
