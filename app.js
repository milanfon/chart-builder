import { Page } from "./includes/page";
const fs = require('fs');
const path = require('path');
const {ArgumentParser} = require('argparse');
import {$} from "bun";
import { getIndex, writeIndex } from "./includes/files";
import { saveAsPNG } from "./includes/export";

const argparser = new ArgumentParser({
    description: "MML Chart render service"
});

argparser.add_argument('-m', {help: 'Mode', type: 'str', choices: ['batch', 'single']});
argparser.add_argument('-i', {help: 'Input file/directory'});
argparser.add_argument('-e', {help: 'Export', choices: ['svg', 'png'], default: 'svg'});
argparser.add_argument('-f', {help: 'Force update', action: 'store_true'});
const args = argparser.parse_args();

const index = getIndex();
let filesChanged = 0;

const dirPath = './input/'+args.i;
const outPath = './output/'+args.i;

if (args.m === 'single') {
    const input = require(dirPath);
    const page = new Page(input, args.i);
    const name = path.parse(dirPath).name;
    fs.writeFileSync("./output/"+name+".svg", page.render());
    if (args.e === 'png') 
        saveAsPNG('./output/', name);
} else if (args.m === 'batch') {
    const files = fs.readdirSync(dirPath).filter(f => path.extname(f) === '.json').map(f => path.join(dirPath, f));
    if (!fs.existsSync(outPath))
        fs.mkdirSync(outPath, {recursive: true});
    if (!index?.[args.i])
        index[args.i] = {};
    const processFile = async (f) => {
        const checksum = await $`shasum -a 512 ${f}`.text().then(i => i.split('  ')[0]);
        if (index?.[args.i]?.[f] === checksum && !args.f)
            return;
        else 
            index[args.i][f] = checksum;
        filesChanged++;
        const page = new Page(require('./'+f), args.i);
        const name = path.parse(f).name;
        fs.writeFileSync(outPath+"/"+name+".svg", page.render());
        if (args.e === 'png')
            saveAsPNG(outPath, name);
    };
    Promise.all(files.map(processFile)).then(() => {
        if (filesChanged > 0)
            writeIndex(index);
        else
            console.log("No files changed!");
    });
}
