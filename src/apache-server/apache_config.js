const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { PowerShell } = require('node-powershell');


let file_content;

const apachePath = path.resolve("./bin/apache/Apache24/bin/httpd.exe");

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
    const filePath = path.resolve(basepath, 'bin/apache/Apache24/conf/httpd.conf'); // Path to httpd.conf
    const apachePath = path.resolve(basepath, 'bin/Apache24'); // Desired Apache path

    log.info(basepath);

    try {
        let file_content = await fs.readFile(filePath, 'utf8');

        // Replace the Define SRVROOT line with the new apachePath
        const updatedContent = file_content.replace('Define SRVROOT "c:/Apache24"', `Define SRVROOT "${apachePath}"`);

        await fs.writeFile(filePath, updatedContent, 'utf8');
        console.log('SRVROOT updated successfully');
    } catch (error) {
        console.error('Error updating SRVROOT:', error);
    }
}

async function killserver(log) {

    try {
        const ps = new PowerShell({
            executionPolicy: 'Bypass',
            noProfile: true
        });
    
        const command = `TASKKILL /F /IM httpd.exe /T`;
    
        await ps.invoke(command);

        log.info("Server was stopped");

    } catch {

    }
    

    
    
}

async function add_php_variable(app, log, php_path) {
    const basepath = app.getAppPath();
    const filePath = path.resolve(basepath, 'bin/apache/Apache24/conf/httpd.conf'); // Path to httpd.conf

    const php_folder_path = path.dirname(php_path);

    try {

        let data = await fs.readFile(filePath, 'utf8');

        let pattern = new RegExp(`LoadModule php_module "([^"]+)"`);
        if (pattern.test(data)) { // LoadModule is here
            data = data.replace(pattern, `LoadModule php_module "${php_path}"`);
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
        console.error('Error updating httpd.conf:', err);
    }
}

async function change_www_path(app, log, newpath) {

    const basepath = app.getAppPath();
    const filePath = path.resolve(basepath, 'bin/apache/Apache24/conf/httpd.conf'); // Path to httpd.conf
    
    // Read the content of the .conf file
    const apacheConfContent = await fs.readFile(filePath, 'utf-8');

    // Replace paths in the content
    const updatedConfContent = apacheConfContent
    .replace(/DocumentRoot\s+".*?"/g, `DocumentRoot "${newpath}"`)
    .replace(/<Directory\s+".*?">/g, `<Directory "${newpath}">`);

    // Write the updated content back to the file
    await fs.writeFile(filePath, updatedConfContent, 'utf-8');
}


async function setDefaultIndex(app, log, page = "index.php") {

    const basepath = app.getAppPath();
    const filePath = path.resolve(basepath, 'bin/apache/Apache24/conf/httpd.conf'); // Path to httpd.conf

    try {
        let file_content = await fs.readFile(filePath, 'utf8');

        const pattern = /(<IfModule dir_module>[\s\S]*?DirectoryIndex\s+)([^\s]+)([\s\S]*?<\/IfModule>)/;
        file_content = file_content.replace(pattern, `$1${page}$3`);
        file_content = file_content.replace("#ServerName www.example.com:80", "ServerName localhost");

        await fs.writeFile(filePath, file_content, 'utf8');
        console.log('Directory Index and ServerName replaced successfully');
    } catch (err) {
        console.error('Error updating httpd.conf:', err);
    }
}

async function server_instantiate(app, log, php_version) {

    await updateApacheServerRoot(app, log);     
    await add_php_variable(app, log, php_version);
    await setDefaultIndex(app, log);
}

function create_server(app, log, php_version) {
    
    isRunning(apachePath, async (status) => {
        if (!status) {
            await server_instantiate(app, log, php_version);
    
            // Start apache server
            const apacheProcess = exec(apachePath);

            apacheProcess.stdout.on('data', (data) => {
                console.log(`Apache stdout: ${data}`);
            });

            open_browser()

            apacheProcess.stderr.on('data', (data) => {
                console.error(`Apache stderr: ${data}`);
            });

            apacheProcess.on('close', (code) => {
                console.log(`Apache process exited with code ${code}`);
            });
        }
    })

    
}

function open_browser(url="http://localhost") {
    require("electron").shell.openExternal(url);
}

/*

module.exports.updateApacheServerRoot = updateApacheServerRoot
module.exports.add_php_variable = add_php_variable*/
module.exports.killserver = killserver;
module.exports.create_server = create_server
module.exports.open_browser = open_browser
module.exports.change_www_path = change_www_path