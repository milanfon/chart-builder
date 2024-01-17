const fs = require('fs');

function imageToBase64(filePath) {
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
}

function getCurrentDateMonth() {
  const date = new Date();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return month + '/' + year;
}

module.exports = {
    getCurrentDateMonth,
    imageToBase64
}
