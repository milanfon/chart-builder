const Page = require("./includes/page");
const fs = require('fs');
const path = require('path');
const {ArgumentParser} = require('argparse');

const argparser = new ArgumentParser({
    description: "MML Chart render service"
});

argparser.add_argument('-m', {help: 'Mode', type: 'str', choices: ['batch', 'single']});
argparser.add_argument('-i', {help: 'Input file/directory'});
const args = argparser.parse_args();

if (args.m === 'single') {
    const input = require('./template_new.json');
    const page = new Page(input);
    fs.writeFileSync("./output/"+page.props.fileName+".svg", page.render());
} else if (args.m === 'batch') {
    const dirPath = './input/'+args.i;
    const outPath = './output/'+args.i;
    const files = fs.readdirSync(dirPath).map(f => path.join(dirPath, f));
    if (!fs.existsSync(outPath))
        fs.mkdirSync(outPath, {recursive: true});
    files.forEach(f => {
        const page = new Page(require('./'+f));
        const name = path.parse(f).name;
        fs.writeFileSync("./output/"+args.i+"/"+name+".svg", page.render());
    });
}
