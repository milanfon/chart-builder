import fs from "fs";
import path from "path";
import Mustache from "mustache";

const indexPath = 'index.json';

export function getIndex() {
    try {
        fs.accessSync(indexPath, fs.constants.F_OK);
        const data = fs.readFileSync(indexPath, {encoding: 'utf8'});
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
}

export function writeIndex(data) {
    fs.writeFile(indexPath, JSON.stringify(data, null, 2), 'utf8', e => {
        if (e)
            console.log('Index write error!', e);
    });
}

export function getDirectory(filePath) {
    try {
        const stats = fs.lstatSync(filePath);
        return stats.isFile() ? path.dirname(filePath) : filePath;
    } catch (err) {
        return path.extname(filePath) ? path.dirname(filePath) : filePath;
    }
}

export function loadGeneral(inputPath) {
    const dir = getDirectory(inputPath);
    if (!dir)
        return undefined;
    const generalFilePath = path.join(dir, '.global');
    if (fs.existsSync(generalFilePath)) {
        const view = fs.readFileSync(generalFilePath, 'utf8');
        return JSON.parse(view);
    }
    return undefined;
}

export function checkOrCreateOutPath(argOutPath) {
    const outPath = getDirectory(argOutPath);
    if (!fs.existsSync(outPath))
        fs.mkdirSync(outPath, {recursive: true});
}

function renderTopLevelTemplates(obj, view) {
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
            obj[key] = Mustache.render(obj[key], view);
        }
    });
}

export async function loadInput(inputPath, templateView) {
    const file = Bun.file(inputPath);
    const content = await file.json();
    if (templateView)
        renderTopLevelTemplates(content, templateView);
    return content;
}
