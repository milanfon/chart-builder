const Page = require("./includes/page");
const fs = require('fs');
const path = require('path');
const {ArgumentParser} = require('argparse');
import {$} from "bun";
import { getIndex, writeIndex } from "./includes/files";

const argparser = new ArgumentParser({
    description: "MML Chart render service"
});

argparser.add_argument('-m', {help: 'Mode', type: 'str', choices: ['batch', 'single']});
argparser.add_argument('-i', {help: 'Input file/directory'});
argparser.add_argument('-e', {help: 'Export', choices: ['svg', 'png'], default: 'svg'});
const args = argparser.parse_args();

const inkscape = process.platform === 'darwin' ? '/Applications/Inkscape.app/Contents/MacOS/inkscape' : 'inkscape';
const index = getIndex();
let filesChanged = 0;

if (args.m === 'single') {
    const input = require('./template_new.json');
    const page = new Page(input);
    fs.writeFileSync("./output/"+page.props.fileName+".svg", page.render());
} else if (args.m === 'batch') {
    const dirPath = './input/'+args.i;
    const outPath = './output/'+args.i;
    const files = fs.readdirSync(dirPath).filter(f => path.extname(f) === '.json').map(f => path.join(dirPath, f));
    if (!fs.existsSync(outPath))
        fs.mkdirSync(outPath, {recursive: true});
    if (!index?.[args.i])
        index[args.i] = {};
    const processFile = async (f) => {
        const checksum = await $`shasum -a 512 ${f}`.text().then(i => i.split('  ')[0]);
        if (index?.[args.i]?.[f] === checksum)
            return;
        else 
            index[args.i][f] = checksum;
        filesChanged++;
        const page = new Page(require('./'+f), args.i);
        const name = path.parse(f).name;
        fs.writeFileSync(outPath+"/"+name+".svg", page.render());
        if (args.e === 'png') {
            const res = await $`${inkscape} ./${outPath}/${name}.svg --export-filename=./${outPath}/${name}.png --export-dpi=200`.quiet();
            console.log("PNG "+name+" generated.");
            fs.unlinkSync(`./${outPath}/${name}.svg`);
        }
    };
    Promise.all(files.map(processFile)).then(() => {
        if (filesChanged > 0)
            writeIndex(index);
        else
            console.log("No files changed!");
    });
}
