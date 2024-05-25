const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')


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


function getAppPath(app, needressource) {


  var exePath = app.getPath('exe');

  if (path.basename(exePath) == "zamp.exe") { // to load resources folder if it is the exe
    return path.resolve(path.join(path.dirname(exePath), "resources"));
  }

  return app.getAppPath();

}

module.exports.writeAsJson = writeAsJson;
module.exports.getProjectPath = getProjectPath;
module.exports.load_config = load_config;
module.exports.getAppPath = getAppPath;