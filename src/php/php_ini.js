const fs = require("fs");
const {writeAsJson, getAppPath} = require("../main-app/basic_functions");
const path = require("path");


function setExtensionDir(phpIniFilePath, extPath) {
  let content;
  if (!fs.existsSync(phpIniFilePath)) {
    
    content = fs.readFileSync(phpIniFilePath.replace("php.ini", "php.ini-development"), 'utf-8');

  } else {
    
    content = fs.readFileSync(phpIniFilePath, 'utf-8');

  }
   
  const lines = content.split('\n');
  const updatedLines = lines.map(line => {
    if (line.startsWith(`extension_dir`) || line.startsWith(';extension_dir = "ext"')) {
      return `extension_dir = ${extPath}`;
    }
    return line;
  });
  content = updatedLines.join('\n');
  fs.writeFileSync(phpIniFilePath, content, 'utf-8');
}


function setPhPPaths(app, phpConfigPaths) {
  const PHPversionsPath = path.resolve(path.join(getAppPath(app), "bin", "php"));
  
  let PHPversions;
  if (!fs.existsSync(phpConfigPaths)) {
    
    PHPversions = {
      "selected": null,
      "paths": {}
    }
    
    writeAsJson(PHPversions, phpConfigPaths);
  } else {
    PHPversions = JSON.parse(fs.readFileSync(phpConfigPaths, 'utf-8'));
  }

  PHPversions.paths = {};
  var versions = fs.readdirSync(PHPversionsPath);
  for (var version of versions) {
      var phpDirpath = path.resolve(path.join(PHPversionsPath, version));
      var files = fs.readdirSync(phpDirpath); 
      var apacheExec = null;
      var Apacheversion = null;
      const apacheFile = /apache([0-9]+\_[0-9]+)/i;
      
      for (var file of files) {
        
        const match = apacheFile.exec(file);
  
        if (match && match.length > 1) {
          apacheExec = file;
          Apacheversion = match[1].replace("_", ".");
          break;
        }
      }
      if (apacheExec != null) {
        var phpApacheFile =  path.resolve(path.join(phpDirpath, apacheExec));
        PHPversions.paths[version] = {"path" : phpApacheFile, "apache_version" : Apacheversion};
      } else {
        console.log(`PHP version ${version} could not be load as there is no apache associated file.`);
      }
      
  }

  if (PHPversions.selected == null) {
    PHPversions.selected = versions[0];
  }

  writeAsJson(PHPversions, phpConfigPaths);

  return PHPversions;
}


module.exports.setExtensionDir = setExtensionDir
module.exports.setPhPPaths = setPhPPaths;