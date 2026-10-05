import { Page } from "./includes/page";
const fs = require('fs');
const path = require('path');
const {ArgumentParser} = require('argparse');
import { checkOrCreateOutPath, getChecksum, getIndex, loadGeneral, loadInput, writeIndex } from "./includes/files";
import { getOutputFrames, renderOutputs } from "./includes/export";

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
checkOrCreateOutPath(outPath);
const generalVals = loadGeneral(dirPath);

if (args.m === 'single') {
    const input = await loadInput(dirPath, generalVals);
    const fileDirName = path.dirname(args.i);
    const page = new Page(input, fileDirName);
    const name = path.parse(dirPath).name;
    const source = path.join('input', args.i);
    const checksum = await getChecksum(source);
    if (!index[fileDirName])
        index[fileDirName] = {};
    const outputs = await renderOutputs(page, getOutputFrames(page, name), path.join('output', fileDirName), args.e, index[fileDirName][source]?.outputs);
    index[fileDirName][source] = {checksum, outputs};
    await writeIndex(index);
} else if (args.m === 'batch') {
    const files = fs.readdirSync(dirPath).filter(f => path.extname(f) === '.json').map(f => path.join(dirPath, f));
    if (!index?.[args.i])
        index[args.i] = {};
    const processFile = async (f) => {
        const checksum = await getChecksum(f);
        const previous = index[args.i][f];
        const page = new Page(await loadInput('./'+f, generalVals), args.i);
        const name = path.parse(f).name;
        const frames = getOutputFrames(page, name);
        const expectedOutputs = frames.map(frame => frame.name + '.' + args.e);
        if (!args.f && previous?.checksum === checksum
            && JSON.stringify(previous.outputs) === JSON.stringify(expectedOutputs)
            && expectedOutputs.every(output => fs.existsSync(path.join(outPath, output))))
            return;
        const outputs = await renderOutputs(page, frames, outPath, args.e, previous?.outputs);
        index[args.i][f] = {checksum, outputs};
        filesChanged++;
    };
    const results = await Promise.allSettled(files.map(processFile));
    if (filesChanged > 0)
        await writeIndex(index);
    else if (results.every(result => result.status === 'fulfilled'))
        console.log("No files changed!");
    for (const result of results) {
        if (result.status === 'rejected') {
            console.error(result.reason);
            process.exitCode = 1;
        }
    }
}
