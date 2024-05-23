const fs = require('fs');

async function writeAsJson (dict, path)  {
    jsonData = JSON.stringify(dict, null, 4);
  
    await fs.writeFile(path, jsonData, (err) => {
      if (err) {
        console.error('Error writing JSON file:', err);
      }
    });
}

function getProjectPath(projectName, config) {
    return (projectName == null) ? null : config.projects[projectName].path;
}

function load_config(configPath) {
  try {
    var content = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    /* 
    Test the required key, so that the file will be complete on load. 
    Otherwise, we create a new one 
    */
   
    var select = content.selected;
    var projects = content.projects;

    return content;
  } catch  {
    
    var configContent = {
      "selected": null,
      "projects": {}
    }
    
    writeAsJson(configContent, configPath);

    return configContent;
  }
}

module.exports.writeAsJson = writeAsJson;
module.exports.getProjectPath = getProjectPath;
module.exports.load_config = load_config;