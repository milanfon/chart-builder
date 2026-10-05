import {$} from "bun";
import fs, {unlinkSync} from "node:fs";
import path from "node:path";

const inkscape = process.platform === 'darwin' ? '/Applications/Inkscape.app/Contents/MacOS/inkscape' : 'inkscape';

export function getOutputFrames(page, name) {
    const steps = page.getRenderSteps();
    const digits = Math.max(2, String(steps[steps.length - 1] || 1).length);
    return steps.map(step => ({
        step,
        name: step === undefined ? name : `${name}_step-${String(step).padStart(digits, '0')}`
    }));
}

export async function renderOutputs(page, frames, directory, format, previousOutputs = []) {
    const results = await Promise.allSettled(frames.map(async frame => {
        await fs.promises.writeFile(path.join(directory, frame.name + '.svg'), page.render(frame.step));
        if (format === 'png')
            await saveAsPNG(directory, frame.name);
        return frame.name + '.' + format;
    }));
    const failure = results.find(result => result.status === 'rejected');
    if (failure)
        throw failure.reason;
    const outputs = results.map(result => result.value);
    for (const output of previousOutputs) {
        if (typeof output !== 'string' || path.basename(output) !== output || outputs.includes(output))
            continue;
        const oldPath = path.join(directory, output);
        if (fs.existsSync(oldPath))
            fs.unlinkSync(oldPath);
    }
    return outputs;
}

export async function saveAsPNG(outPath, name) {
    const res = await $`${inkscape} ./${outPath}/${name}.svg --export-filename=./${outPath}/${name}.png --export-dpi=200`.quiet();
    console.log("PNG "+name+" generated.");
    unlinkSync(`./${outPath}/${name}.svg`);
}
