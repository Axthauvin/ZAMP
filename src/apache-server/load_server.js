const fs = require('fs');
const path = require('path');

const listFilesRecursive = (dir, fileList = []) => {
    const files = fs.readdirSync(dir);
  
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        listFilesRecursive(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    });
  
    return fileList;
};

function load_project(evt, project_name) {
  
    currentProject = project_name;
    currentProjectPath = config.projects[currentProject].path
  
    load_project_folder(evt, currentProjectPath);
  }
  
  function load_project_folder(evt, folderPath) {
    
    const files = fs.readdirSync(folderPath);
  
    for (let i = 0; i < files.length; i++) {
      const sourceFile = path.join(folderPath, files[i]);
      const destFile = path.join(wwwPath, files[i]);
  
      fs.copyFileSync(sourceFile, destFile);
  
      const progress = Math.round(((i + 1) / files.length) * 100);
      evt.sender.send('progress-load', progress);
    }
  }

