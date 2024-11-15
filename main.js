const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')

const { killserver, server_instantiate, create_server, open_browser, change_www_path, getApacheVersion, load_apache_config } = require('./src/apache-server/apache_config');

const { setPhPPaths } = require('./src/php/php_ini');

const { openFolderInEditor } = require('./src/main-app/start_apps');
const { listApacheVersions } = require('./src/main-app/get_versions');
const { writeAsJson, getProjectPath, load_config, getAppPath } = require('./src/main-app/basic_functions');
const { install_mariadb, start_mariadb, get_mariadb_version, load_maria_config, kill_maria_server } = require("./src/mariadb/db_init")



const { exec, execFile  } = require('child_process');
const path = require('path');
const log = require('electron-log');
const fs = require('fs');
const { info } = require('console');







const phpFolder = path.resolve(path.join(getAppPath(app), "bin", "php"));
const phpVersionsPath = path.resolve(path.join(getAppPath(app), "src", "php", 'versions.json'));

const configPath = path.resolve(path.join(getAppPath(app), "src", 'config.json'));

console.log("Path : ", configPath);

const apacheFolder = path.resolve(path.join(getAppPath(app), "bin", "apache"));
const apacheConfigFilePath = path.resolve(path.join(getAppPath(app), "src", "apache-server", 'config.json'));


let apacheConfig = load_apache_config(apacheConfigFilePath);
let php_versions = setPhPPaths(app, phpVersionsPath);



let php_current_version;
let php_folder_path;

let phpIniFilePath; 
let phpExtPath; 

load_php_version(php_versions.selected);


const mariaDBFolder = path.resolve(path.join(getAppPath(app), "bin", "mariadb"));
const mariaDB_version = get_mariadb_version(mariaDBFolder)
const mariaDBFilePath = path.resolve(path.join(getAppPath(app), "src", "mariadb", 'config.json'));
install_mariadb(mariaDBFolder);

let SQLConfig = load_maria_config(mariaDBFilePath, mariaDB_version);

if (SQLConfig.status != "Closed") {
  start_mariadb(mariaDBFolder, SQLConfig, mariaDBFilePath);
}


let serverRunning = false;


var config = load_config(configPath);
var currentProject = config.selected;
let currentProjectPath = getProjectPath(currentProject, config);

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
  console.log( path.resolve(path.join(getAppPath(app), "src", "images", "fishy.png")))
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
      icon:  path.resolve(path.join(getAppPath(app), "src", "images", "fishy.png")),
      autoHideMenuBar: true,
      //frame: false 
      
    });

    win.on('close', e => {

      if (serverRunning) {
        
        e.preventDefault();

        win.webContents.send('close-but-running');
      } else {
        if (process.platform !== 'darwin') app.exit()
      }
      
    })

    mainWindow = win;
  
    win.loadFile('index.html');

    

  }

  async function startApp() {
    var version = await getApacheVersion(app);
    apacheConfig.version = version;
    writeAsJson(apacheConfig, apacheConfigFilePath)
    

    app.whenReady().then(async () => {
      createWindow();

      log.info('App was started');

      await server_instantiate(app, log, php_current_version, phpIniFilePath, phpExtPath);

      await load_project(currentProject);
      
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
      })

      console.log("---------------------")
    })



  
}

startApp();
  

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
    /*if (error) {
      console.error('Error opening file explorer:', error);
    } else {
      console.log('File explorer opened successfully:', tpath);
    }*/
  });
}

ipcMain.on('close-app', () => {
  async function terminate ()  {
    
    await killserver(log, mainWindow, true);
    if (process.platform !== 'darwin') app.exit()
  }

  terminate();

});


ipcMain.on('open', () => {
  serverRunning = true;
  if (currentProject)
    create_server(app, log, php_current_version, phpIniFilePath, phpExtPath, mainWindow, true);

});

ipcMain.on('close', () => {
  killserver(log, mainWindow, true);
  serverRunning = false;

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



async function load_project(project_name) {

  if (project_name == null) {
    return
  }

  var wasRunning = false;
  if (project_name != currentProject && serverRunning) { // We have to check if the server is running and kill and restart
      await killserver(log, mainWindow, true); // function will set serverRunning at false
      wasRunning = true;
  }
  
  currentProject = project_name;
  currentProjectPath = config.projects[currentProject].path

  config.selected = currentProject;
  await writeAsJson(config, configPath);

  await change_www_path(app, log, currentProjectPath);

  if (wasRunning)
    create_server(app, log, php_current_version, phpIniFilePath, phpExtPath, mainWindow, true);
}



ipcMain.on('select_project', (evt, name) => {
  var project_name = name.name;
  load_project(project_name);

});



ipcMain.on('asynchronous-message', function (evt, messageObj) {
  // Send message back to renderer.
  switch(messageObj) {
      case 'php-versions' : evt.sender.send('php-versions', php_versions); break;
      case 'currentProject' : evt.sender.send('currentProject', currentProject); break;
      case 'get-projects' : evt.sender.send('get-projects', projects); break;
      case 'getApacheversion' : evt.sender.send('getApacheversion', apacheConfig); break;
      case 'getPhpVersions' : evt.sender.send('getPhpVersions', php_versions); break;
      case 'getMariaDBversion' : evt.sender.send('getMariaDBversion', SQLConfig); break;
      case 'openApacheFolder' : openExplorer(apacheFolder); break;
      case 'openPHPFolder' : openExplorer(phpFolder); break;
      case 'openSQLFolder' : openExplorer(mariaDBFolder); break;
      break;
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
    icon: path.resolve(path.join(getAppPath(app), "src", "svg", "fishy.svg")),
    autoHideMenuBar: true
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
    var lastmodified = getLastModifiedDate(folderPath);
    add_project(folderPath, lastmodified);
    var tosend = {"path" : folderPath, "date" : lastmodified, "selected" : Object.keys(config.projects).length == 1};
    return tosend; // Return the selected folder path
  }
});


ipcMain.on('folder-dropped', (event, folderPath) => {
  var lastmodified = getLastModifiedDate(folderPath);
  add_project(folderPath, lastmodified);
  var tosend = {"path" : folderPath, "date" : lastmodified, "selected" : Object.keys(config.projects).length == 1, "config" : configPath};
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
      currentProject = Object.keys(config.projects)[0];
      console.log("New selected project : " + currentProject);
      sender.send("select_project", currentProject);
      load_project(currentProject)
    }
  }
  else {
    currentProject = null;
    config.selected = currentProject;
    load_project(currentProject)
    sender.send("select_project", currentProject);

  }

  writeAsJson(config, configPath);
  
}

function add_project(folderPath, lastmodified) {
  var name =  path.basename(folderPath);
  config.projects[name] = {
    "path": folderPath,
    "ico": null,
    "tags": [],
    "last_edited": lastmodified
  };

  if (currentProject == null) {
    currentProject = name;
    config.selected = name;

    load_project(name);
  }
    

  writeAsJson(config, configPath);
  
}





/*
async function fetch_versions() {
  var versions = await fetchAvailableVersions();
  console.log(versions);
  return versions;
}



var fetched = fetch_versions();
console.log(fetched);
download_apache_version("2.4.59", apacheVersionsFolder, apacheVersionsPath)*/


ipcMain.on('SQL-Server', (event, status) => {
  if (status) {
    start_mariadb(mariaDBFolder, SQLConfig, mariaDBFilePath);
  } else {
    kill_maria_server(SQLConfig, mariaDBFilePath)
  }


  mainWindow.webContents.send('getMariaDBversion', SQLConfig);
});

ipcMain.on('apache-online', (event, status) => {
  if (status) {
    apacheConfig.mode = "Online";
  } else {
    apacheConfig.mode = "Offline";
  }

  console.log("Apache server mode was changed");

  writeAsJson(apacheConfig, apacheConfigFilePath);


  mainWindow.webContents.send('getMariaDBversion', SQLConfig);
});



function load_php_version(version, write = false) {
  
  php_versions.selected = version;
  
  php_current_version = php_versions.paths[php_versions.selected].path;
  php_folder_path = path.dirname(php_current_version);

  phpIniFilePath = path.resolve(path.join(php_folder_path, "php.ini")); 
  phpExtPath = path.resolve(path.join(php_folder_path, "ext"));

  if (write) {
    writeAsJson(php_versions, phpVersionsPath);
  }
}

ipcMain.on('change-PHP-version', async (event, version) => {
  
  var wasRunning = serverRunning;
  
  if (serverRunning) {
    await killserver(log, mainWindow, true);
  }

  load_php_version(version, true);
  
  console.log("PHP version was changed.");

  if (wasRunning) {
    server_instantiate(app, log, php_current_version, phpIniFilePath, phpExtPath);
  }

});


ipcMain.handle('show-create-folder-dialog', async (event) => {
  
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (result.canceled) {
    return null;
  } else {
    
    const folderPath = result.filePaths[0];
    var lastmodified = getLastModifiedDate(folderPath);
    add_project(folderPath, lastmodified);
    var tosend = {"path" : folderPath, "date" : lastmodified, "selected" : Object.keys(config.projects).length == 1};
    return tosend; // Return the selected folder path
  }

});

