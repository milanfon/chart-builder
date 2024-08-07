export async function parseUniformityTest(filePath, inputName) {
    const file = Bun.file("input/"+inputName+"/"+filePath);
    const text = await file.text();

    const match = text.match(/.*results = \{.*$/gm);
    const resultsLine = match[0];
    const jsonStringMatch = resultsLine.match(/(\{.*\})/);
    const importedObject = eval("("+jsonStringMatch[0]+")");

    Object.values(importedObject).forEach(v => console.log(v[0].XYZ[1]))
}
