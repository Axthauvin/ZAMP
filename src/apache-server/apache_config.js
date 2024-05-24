const path = require('path');
const fs1 = require('fs');
const fs = require('fs').promises;
const { exec, execFile } = require('child_process');
const { PowerShell } = require('node-powershell');
const { setExtensionDir } = require('../php/php_ini');
const { error } = require('console');
const { writeAsJson } = require('../main-app/basic_functions');
const util = require("util");







let file_content;

const apachePath = path.resolve("./bin/apache/bin/httpd.exe");
console.log(apachePath);
const apacheExec = "httpd.exe"

const isRunning = (query, cb) => {
    let platform = process.platform;
    let cmd = '';
    switch (platform) {
        case 'win32' : cmd = `tasklist`; break;
        case 'darwin' : cmd = `ps -ax | grep ${query}`; break;
        case 'linux' : cmd = `ps -A`; break;
        default: break;
    }
    exec(cmd, (err, stdout, stderr) => {
        cb(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1);
    });
}



async function updateApacheServerRoot(app, log) {
    const basepath = app.getAppPath();

    // Example usage:
    const filePath = path.resolve(basepath, 'bin/apache/conf/httpd.conf'); // Path to httpd.conf
    const apachePath = path.resolve(basepath, 'bin/apache'); // Desired Apache path


    log.info(basepath);

    try {
        let file_content = await fs.readFile(filePath, 'utf8');

        let pattern = new RegExp(`Define SRVROOT "([^"]+)"`);
        let DEFINESVROOT = pattern.exec(file_content)[1];

        // Replace the Define SRVROOT line with the new apachePath
        const updatedContent = file_content.replace(DEFINESVROOT, apachePath);

        await fs.writeFile(filePath, updatedContent, 'utf8');
        console.log('SRVROOT updated successfully');
    } catch (error) {
        throw new Error('Error updating SRVROOT:', error);
    }
}

const execPromise = util.promisify(exec);

async function get_task_list(callback) {
    
    let platform = process.platform;
    let cmd = '';
    switch (platform) {
        case 'win32' : cmd = `tasklist`; break;
        case 'darwin' : cmd = `ps -ax | grep ${query}`; break;
        case 'linux' : cmd = `ps -A`; break;
        default: break;
    }
    
    const { stdout, stderr } = await execPromise(cmd);
    
    var httpdlines = stdout.toLowerCase().split("\n").filter(line => {
        return line.includes("httpd.exe");
    });

    httpdlines = httpdlines.map(line => {
        return line.split(" ").filter(l => {return l != ''});
    })

    var PIDS = httpdlines.map(line => {return parseInt(line[1])})

    await callback(PIDS);

    

}




async function killProcessesByPID() {

    

    await get_task_list(async function (PIDS) {

        for (var pid of PIDS) {
            try {
                // Construct the PowerShell command to kill the process by PID
                const command = `TASKKILL /F /PID ${pid}`;
                const { stdout, stderr } = await execPromise(command);
                if (stderr) {
                    console.error(`Error: ${stderr}`);
                }

                //console.log(`Killed ${pid}`);

            } catch (r) {
                //console.log(`${pid} couldn't be killed`);
            }  
        }

        
        

    });


}


async function killserver(log, mainWindow, send = false) {
    
    if (send)
        mainWindow.webContents.send('stopping');
    
    try {
        
        await killProcessesByPID();

        log.info("Server was stopped");

        mainWindow.webContents.send('closed');
            
    } catch (err){
        console.log(err);
    }
    
}

async function add_php_variable(app, log, php_path) {
    const basepath = app.getAppPath().replaceAll(" ", "\ ");
    const filePath = path.resolve(basepath, 'bin/apache/conf/httpd.conf'); // Path to httpd.conf

    const php_exec_path = php_path;
    const php_folder_path = path.dirname(php_path);

    try {

        let data = await fs.readFile(filePath, 'utf8');

        let pattern = new RegExp(`LoadModule php_module "([^"]+)"`);
        if (pattern.test(data)) { // LoadModule is here
            data = data.replace(pattern, `LoadModule php_module "${php_exec_path}"`);
            await fs.writeFile(filePath, data, 'utf8');
            console.log('LoadModule replaced successfully');

            pattern = new RegExp(`PHPIniDir "([^"]+)"`);
            if (pattern.test(data)) { // PHPIniDir is here
                data = data.replace(pattern, `PHPIniDir "${php_folder_path}"`);
                await fs.writeFile(filePath, data, 'utf8');
                console.log('PHPIniDir replaced successfully');
            }
        } else {
            const updatedContent = `${data}\n\nLoadModule php_module "${php_path}"\n\nAddHandler application/x-httpd-php .php\n\nPHPIniDir "${php_folder_path}"`;
            await fs.writeFile(filePath, updatedContent, 'utf8');
            console.log('PHP module path added successfully');
        }
    } catch (err) {
        throw new Error('Error updating httpd.conf:', err);
    }
}

async function change_www_path(app, log, newpath) {

    try {
        const basepath = app.getAppPath().replaceAll(" ", "\ ");
        const filePath = path.resolve(basepath, 'bin/apache/conf/httpd.conf'); // Path to httpd.conf
        
        // Read the content of the .conf file
        let apacheConfContent = await fs.readFile(filePath, 'utf-8');

        let pattern = new RegExp(`DocumentRoot "([^"]+)"`);
        let DocumentRoot = pattern.exec(apacheConfContent)[1];
        apacheConfContent = apacheConfContent.replace(DocumentRoot, newpath);

        pattern = new RegExp(`<Directory "([^"]+)">`);
        let Directory = pattern.exec(apacheConfContent)[1];
        apacheConfContent = apacheConfContent.replace(Directory, newpath);

        console.log("Changed document root to " + newpath);

        // Write the updated content back to the file
        await fs.writeFile(filePath, apacheConfContent, 'utf-8');

    } catch {

    }
    
}


async function setDefaultIndex(app, log, page = "index.php") {

    const basepath = app.getAppPath().replaceAll(" ", "\ ");
    const filePath = path.resolve(basepath, 'bin/apache/conf/httpd.conf'); // Path to httpd.conf

    try {
        let file_content = await fs.readFile(filePath, 'utf8');

        const pattern = /(<IfModule dir_module>[\s\S]*?DirectoryIndex\s+)([^\s]+)([\s\S]*?<\/IfModule>)/;
        file_content = file_content.replace(pattern, `$1${page}$3`);
        file_content = file_content.replace("#ServerName www.example.com:80", "ServerName localhost");

        await fs.writeFile(filePath, file_content, 'utf8');
        console.log('Directory Index and ServerName replaced successfully');
    } catch (err) {
        throw new Error('Error updating httpd.conf:', err)
    }
}

async function server_instantiate(app, log, php_version, phpIniPath, extPath, regenerate = false) {
    try {
        await updateApacheServerRoot(app, log);     
        await add_php_variable(app, log, php_version);
        await setDefaultIndex(app, log);
        setExtensionDir(phpIniPath, extPath);

    }
    
    catch (err){
        console.log(err);
        if (regenerate) {
            console.log("The conf file is still not valid. The program cannot be executed");
            return;
        }
        
        console.log("There was an error inside the conf file. Regenerating it");
        await recreate_conf(app);
        server_instantiate(app, log, php_version, phpIniPath, extPath, true)
    }
    
}


function create_server(app, log, php_version, phpIniPath, extPath, mainWindow, send=false) {
    
    async function start_server(accsend) {
        
        if (send || accsend)
            mainWindow.webContents.send('open');
        // Start apache server


        const apacheProcess = execFile(apachePath);

        log.info("Server was started");

        apacheProcess.stdout.on('data', (data) => {
            console.log(`Apache stdout: ${data}`);
        });

        open_browser()

        apacheProcess.stderr.on('data', (data) => {
            console.error(`Apache stderr: ${data}`);
        });

        /*apacheProcess.on('close', (code) => {
            console.log(`Apache process exited with code ${code}`);
        });*/
    }


    isRunning(apacheExec, async (status) => {
        
        if (!status) {
            start_server();

        } else {
            console.log("Closing server first");
            await killserver(log, mainWindow);
            start_server(true);
        }
    });

    
}

function open_browser(url="http://localhost") {
    require("electron").shell.openExternal(url);
}

async function getApacheVersion(app) {
    const filePath = path.resolve(app.getAppPath().replaceAll(" ", "\ "), 'bin/apache/CHANGES.TXT');
    try {
        // Read the content of the CHANGES.TXT file
        const content = await fs.readFile(filePath, 'utf8');
        
        // Use regular expression to find the version number
        const versionRegex = /Changelog-([0-9]+\.[0-9]+)/i;
        const match = versionRegex.exec(content);
        
        // If a match is found, return the version number
        if (match && match.length > 1) {
            return match[1];
        } else {
            
            return null;
        }
    } catch (err) {
        // Handle any errors that occur during file reading or parsing
        console.error('Error reading CHANGES.TXT:', err);
        return 'Error';
    }
}


async function recreate_conf(app) {
    /*
     If the conf file is incorrect for some reason, 
     ZAMP will try to recreate one, using the "default_conf.conf" file.

    */

    const basepath = app.getAppPath().replaceAll(" ", "\ ");
    const confFilePath = path.resolve(basepath, 'bin/apache/conf/httpd.conf'); // Path to httpd.conf
    const defaultFilePath = path.resolve(basepath, 'bin/apache/conf/default_conf.conf'); // Path to default_conf.conf

    var defaultContent = fs1.readFileSync(defaultFilePath, 'utf-8');
    
    fs.writeFile(confFilePath, defaultContent);

}

function load_apache_config(apacheConfigFilePath) {
    if (!fs1.existsSync(apacheConfigFilePath)) {

        var content = {
            "version": null,
            "mode": "Offline"
        }

        writeAsJson(content, apacheConfigFilePath);

        return content;

    } else {
        return JSON.parse(fs1.readFileSync(apacheConfigFilePath, 'utf-8'));
    }
}

/*

module.exports.updateApacheServerRoot = updateApacheServerRoot
module.exports.add_php_variable = add_php_variable*/
module.exports.killserver = killserver;
module.exports.create_server = create_server
module.exports.server_instantiate = server_instantiate
module.exports.open_browser = open_browser
module.exports.change_www_path = change_www_path
module.exports.getApacheVersion = getApacheVersion
module.exports.load_apache_config = load_apache_config