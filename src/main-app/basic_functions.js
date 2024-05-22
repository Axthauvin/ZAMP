const fs = require('fs');

const writeAsJson = (dict, path) => {
    jsonData = JSON.stringify(dict, null, 4);
  
    fs.writeFile(path, jsonData, (err) => {
      if (err) {
        console.error('Error writing JSON file:', err);
      }
    });
}

module.exports.writeAsJson = writeAsJson;