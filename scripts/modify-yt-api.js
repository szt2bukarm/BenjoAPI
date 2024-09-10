const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../node_modules/youtube-music-api/src/index.js');
const searchLine = "'X-Goog-Visitor-Id': this.ytcfg.VISITOR_DATA,";

// Read the file
fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
        return;
    }

    // Remove the specific line
    const result = data.split('\n').filter(line => line.trim() !== searchLine.trim()).join('\n');

    // Write the modified content back to the file
    fs.writeFile(filePath, result, 'utf8', err => {
        if (err) {
            console.error('Error writing the file:', err);
        } else {
            console.log('File modified successfully');
        }
    });
});
