import {readFileSync} from "node:fs";

export function imageToBase64(filePath) {
    const buffer = readFileSync(filePath);
    return buffer.toString('base64');
}

export function getCurrentDateMonth() {
  const date = new Date();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return month + '/' + year;
}
