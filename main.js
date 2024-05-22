const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const { killserver, create_server, open_browser, change_www_path } = require('./src/apache-server/apache_config');
const { openFolderInEditor } = require('./src/main-app/start_apps');
const { listApacheVersions } = require('./src/main-app/get_versions');
const { exec, execFile  } = require('child_process');
const path = require('path');
const log = require('electron-log');
const fs = require('fs');
const { info } = require('console');

const phpVersionsPath = path.resolve(path.join(app.getAppPath(), "src", "php", 'versions.json'));

const configPath = path.resolve(path.join(app.getAppPath(), "src", 'config.json'));
const wwwPath = path.resolve(path.join(app.getAppPath(), "bin", "apache", "Apache24", 'htdocs'));

const apacheVersionsFolder = path.resolve(path.join(app.getAppPath(), "bin", "apache"));
const apacheVersionsPath = path.resolve(path.join(app.getAppPath(), "src", "apache-server", 'versions.json'));

var apacheConfig = JSON.parse(fs.readFileSync(apacheVersionsPath, 'utf-8'));
let selectedApacheVersion = apacheConfig.selected;

var php_versions = JSON.parse(fs.readFileSync(phpVersionsPath, 'utf-8'));
let php_current_version = path.resolve(php_versions[Object.keys(php_versions)[0]]);
let php_folder_path = path.dirname(php_current_version);
const phpIniFilePath = path.resolve(path.join(php_folder_path, "php.ini"));; // Replace with your actual php.ini file path


var config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
var currentProject = config.selected;
let currentProjectPath = config.projects[currentProject].path;
log.info(currentProjectPath);


function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0'); // Get day with leading zero if needed
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Get month with leading zero if needed (months are zero-based)
  const year = date.getFullYear(); // Get full year
  return `${day}/${month}/${year}`;
}

function getLastModifiedDate(folderPath) {
  try {
    const stats = fs.statSync(folderPath);
    return formatDate(stats.mtime); // Returns the last modified time
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

let projects = config.projects;
for (var key of Object.keys(projects)) {
  var pro = projects[key];
  pro.last_edited = getLastModifiedDate(pro.path);
  projects[key] = pro;
}




let mainWindow;

const createWindow = () => {
    const win = new BrowserWindow({
      width: 1000,
      height: 700,
      minWidth: 1000,
      minHeight: 700,
      webPreferences: {
        nodeIntegration: true,        // Allow Node.js integration
        contextIsolation: false,    // Disable context isolation
        enableRemoteModule: false,       
      },
      //autoHideMenuBar: true,
      
    })

    mainWindow = win;
  
    win.loadFile('index.html')

  }

  

  app.whenReady().then(() => {
    createWindow();

    log.info('App was started');
    
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

app.on('window-all-closed', () => {
    async function terminate() {
      await killserver(log);
      if (process.platform !== 'darwin') app.quit();
    }

    terminate();
})

function openExplorer(targetPath) {

  var tpath = path.resolve(targetPath);

  const platform = process.platform;

  let command;
  if (platform === 'win32') {
    command = `explorer "${tpath}"`;
  } else if (platform === 'darwin') {
    command = `open "${tpath}"`;
  } else if (platform === 'linux') {
    command = `xdg-open "${tpath}"`;
  } else {
    console.error('Unsupported platform:', platform);
    return;
  }

  exec(command, (error) => {
    if (error) {
      console.error('Error opening file explorer:', error);
    } else {
      console.log('File explorer opened successfully:', tpath);
    }
  });
}



ipcMain.on('open', () => {

  create_server(app, log, php_current_version);

});

ipcMain.on('close', () => {
    
  killserver(log);

});

ipcMain.on('browse', () => {
    
  open_browser();

});

ipcMain.on('reveal', () => {
    
  openExplorer(currentProjectPath);

});



ipcMain.on('editor', () => {
    
  openFolderInEditor(currentProjectPath, "vscode", log);

});

const writeAsJson = (dict, path) => {
  jsonData = JSON.stringify(dict, null, 4);

  fs.writeFile(path, jsonData, (err) => {
    if (err) {
      console.error('Error writing JSON file:', err);
    }
  });
}

function load_project(project_name) {
  
  currentProject = project_name;
  currentProjectPath = config.projects[currentProject].path

  config.selected = currentProject;
  writeAsJson(config, configPath);

  change_www_path(app, log, currentProjectPath)
}

// Clear the directory
const deleteContentsRecursive = (dir) => {
  log.info(dir);
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((file) => {
      const curPath = path.join(dir, file);

      if (fs.lstatSync(curPath).isDirectory()) {
        deleteContentsRecursive(curPath);
        fs.rmdirSync(curPath); // Remove the now-empty subdirectory
      } else {
        fs.unlinkSync(curPath); // Delete file
      }
    });
  }
};

// List all files and subfiles of the current directory
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




ipcMain.on('select_project', (evt, name) => {
  var project_name = name.name;
  log.info(project_name);
  load_project(project_name);

});



ipcMain.on('asynchronous-message', function (evt, messageObj) {
  // Send message back to renderer.
  switch(messageObj) {
      case 'php-versions' : evt.sender.send('php-versions', php_versions); break;
      case 'currentProject' : evt.sender.send('currentProject', currentProject); break;
      case 'get-projects' : evt.sender.send('get-projects', projects); break;
      case 'getApacheversions' : 
      var versions = listApacheVersions(apacheVersionsFolder);
      var tosend = {"versions" : versions, "selected" : selectedApacheVersion}
      evt.sender.send('getApacheversions', tosend); break;    
  }
});


function createPopupWindow() {
  const popupWindow = new BrowserWindow({
    width: 500,
    height: 600,
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  popupWindow.loadFile('./extensions.html');

  popupWindow.once('ready-to-show', () => {
    popupWindow.show();
  });

  // Send the list of extensions to the popup window
  popupWindow.webContents.on('did-finish-load', () => {
    const extensions = getExtensionsFromPhpIni();
    popupWindow.webContents.send('extensions-list', extensions);
  });
}


const is_extension = (line) => {
  return line.startsWith('extension=')|| line.startsWith(';extension=');
}

function getExtensionsFromPhpIni() {
  log.info(phpIniFilePath);
  const content = fs.readFileSync(phpIniFilePath, 'utf-8');
  const lines = content.split('\n');
  const extensions = lines.filter(line => is_extension(line)).map(line => {
    return {
      name: line.split('=')[1].trim().split(";")[0],
      enabled: !line.startsWith(';')
    };
  });
  return extensions;
}

ipcMain.on('update-extension-status', (event, extensionName, enabled) => {
  updateExtensionStatusInPhpIni(extensionName, enabled);
});

function updateExtensionStatusInPhpIni(extensionName, enabled) {
  let content = fs.readFileSync(phpIniFilePath, 'utf-8');
  const lines = content.split('\n');
  const updatedLines = lines.map(line => {
    if (line.includes(`extension=${extensionName}`)) {
      if (enabled) {
        return `extension=${extensionName}`;
      } else {
        return `;extension=${extensionName}`;
      }
    }
    return line;
  });
  content = updatedLines.join('\n');
  fs.writeFileSync(phpIniFilePath, content, 'utf-8');
}

ipcMain.on('manage-extensions', (event, arg) => {
  createPopupWindow();
});


ipcMain.handle('open-folder-dialog', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  
  // If the user canceled the dialog, result.canceled will be true
  if (result.canceled) {
    return null;
  } else {
    const folderPath = result.filePaths[0];
    var tosend = {"path" : folderPath, "date" : getLastModifiedDate(folderPath)};
    return tosend; // Return the selected folder path
  }
});

/*ipcMain.on('files-dropped', (event, files) => {
  const folderPath = files.filePaths[0];
  
  var tosend = {"path" : folderPath, "date" : getLastModifiedDate(folderPath)};
  log.info("geur");
  var tosend = {"path" : null, "date" : null};

  // PowerShell command to get the full path
  const command = `powershell.exe -Command "(Get-Item -LiteralPath '${folderPath}').FullName"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    const fullPath = stdout.trim();
    console.log(`Full path: ${fullPath}`);

    // Send the full path back to the renderer process
    event.sender.send('full-path', fullPath);
  });


  
  mainWindow.webContents.send("files-dropped", tosend);
});*/

ipcMain.on('folder-dropped', (event, folderPath) => {
  console.log(folderPath);
  var tosend = {"path" : folderPath, "date" : getLastModifiedDate(folderPath)};
  mainWindow.webContents.send("folder-dropped", tosend);
  
});


let name_to_delete;


// Define the context menu
const contextMenu = Menu.buildFromTemplate([
  {
    label: 'Delete from list',
    click: (menuItem, browserWindow) => {
      const data = { command: 'delete', name: name_to_delete };
      remove_project(name_to_delete, mainWindow.webContents);
      mainWindow.webContents.send('context-menu-command', data);
    },
  }
]);

// Show context menu on right click
ipcMain.on('show-context-menu', (event, data ) => {
  var name = data.name;
  name_to_delete = name;
  contextMenu.popup({
    window: mainWindow,
    x: event.x,
    y: event.y,
    name: name // Pass the name attribute value to the context menu click handler
  });
});


function remove_project(name, sender) {
  delete config.projects[name];


  
  if (Object.keys(config.projects).length > 0) {
    if (name == currentProject) {
      currentProject = config.projects[Object.keys(config.projects)[0]];
      sender.send("select_project", currentProject);
      load_project(currentProject)
    }
  }
  else {
    currentProject = null;
    load_project(currentProject)
    sender.send("select_project", currentProject);

  }

  writeAsJson(config, configPath);
  
  log.info(config);
  log.info(currentProject);

  
  
  
}