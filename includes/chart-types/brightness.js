import { parseUniformityTest } from "../parsers/displaycal";

export function renderBrightnessTable(props, inputName) {
    parseUniformityTest(props.sourceFile, inputName);
}
