export async function parseUniformityTest(filePath, inputName) {
    const file = Bun.file("input/"+inputName+"/"+filePath);
    const text = await file.text();

    const resMatch = text.match(/.*results = \{.*$/gm);
    const resultsLine = resMatch[0];
    const jsonStringMatch = resultsLine.match(/(\{.*\})/);
    const importedObject = eval("("+jsonStringMatch[0]+")");

    const values = Object.values(importedObject).map(v => Math.round(v[0].XYZ[1]));

    const colsMatch = text.match(/cols\s*=\s*(\d+)\s*,/gm);
    const cols = Number.parseInt(colsMatch[0].match(/\d+/)[0]);

    const rowsMatch = text.match(/var\s+rows\s*=\s*\d+\s*,/gm);
    const rows = Number.parseInt(rowsMatch[0].match(/\d+/)[0]);

    return { rows, cols, values };
}
