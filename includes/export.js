import {$} from "bun";
import {unlinkSync} from "node:fs";

const inkscape = process.platform === 'darwin' ? '/Applications/Inkscape.app/Contents/MacOS/inkscape' : 'inkscape';

export async function saveAsPNG(outPath, name) {
    const res = await $`${inkscape} ./${outPath}/${name}.svg --export-filename=./${outPath}/${name}.png --export-dpi=200`.quiet();
    console.log("PNG "+name+" generated.");
    unlinkSync(`./${outPath}/${name}.svg`);
}
