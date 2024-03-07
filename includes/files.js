import fs from "fs";

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
