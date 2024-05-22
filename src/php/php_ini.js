const fs = require("fs");


function setExtensionDir(phpIniFilePath, extPath) {
    let content = fs.readFileSync(phpIniFilePath, 'utf-8');
    const lines = content.split('\n');
    const updatedLines = lines.map(line => {
      if (line.startsWith(`extension_dir`) || line == ';extension_dir = "ext"') {
        return `extension_dir = ${extPath}`;
      }
      return line;
    });
    content = updatedLines.join('\n');
    fs.writeFileSync(phpIniFilePath, content, 'utf-8');
  }


module.exports.setExtensionDir = setExtensionDir