const fs = require("fs");
const {writeAsJson, getAppPath} = require("../main-app/basic_functions");
const path = require("path");
const { exec, execSync, execFile, execFileSync } = require("child_process");



let LASTCONFIG;


function install_mariadb(mariaDB_folder) {
    const data_folder = path.resolve(path.join(mariaDB_folder, "data"));
    if (!fs.existsSync(data_folder)) { // maria db is not already installed

        console.log("Installing Maria DB...");
        const install_exe = path.resolve(path.join(mariaDB_folder, "bin", "mysql_install_db.exe"));

        try {
            const stdout = execFileSync(install_exe, { encoding: 'utf-8' });
            console.log(stdout);
        } catch (err) {
            console.error(err);
        }

    } else {
        console.log("Maria db was already installed.");
    }
}

function start_mariadb(mariaDB_folder, config, mariaDBPath) {

    LASTCONFIG = config;
    
    const mariadbEXE = path.resolve(path.join(mariaDB_folder, "bin", "mysqld.exe"));
    console.log("Starting MariaDB server...");
    execFile(mariadbEXE, (error, stdout, stderr) => {

        if (stdout) {
            console.log(stdout);
        }

        if (error) {
            if (error.code === 'ENOENT') {
                console.error('mysqld.exe not found');
            } else {
                if (LASTCONFIG.status != "Closed") {
                    console.log("MariaDB already running ?");
                    console.error(error);
                }
                
            }
        } else {
            
        }

        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }
    });

    config.status = "Started";
    writeAsJson(config, mariaDBPath);

}

function get_mariadb_version(mariaDB_folder) {
    
    const mariadbEXE = path.resolve(path.join(mariaDB_folder, "bin", "mysqld.exe"));
    try {
        const stdout = execSync(`${mariadbEXE} --version`, { encoding: 'utf-8' });
        const pattern = new RegExp(`Ver ([^"]+)-MariaDB`);
        let version = pattern.exec(stdout)[1];
        return version + "-MariaDB";
    
    } catch (err) {
        
        console.error(err);
        return null;
    }
}

function kill_maria_server(config, mariaDBPath) {
    LASTCONFIG = config;

    // Windows command to find and kill mysqld.exe
    console.log("Killing MariaDB server");
    
    const cmd = 'tasklist /FI "IMAGENAME eq mysqld.exe" /FO CSV | findstr /I "mysqld.exe"';
    const stdout = execSync(cmd, { encoding: 'utf8' });

    if (stdout.includes('mysqld.exe')) {
        // Extract the process ID and kill the process
        const processInfo = stdout.split('\n').filter(line => line.includes('mysqld.exe'))[0].split(',');
        const processId = processInfo[1].replace(/"/g, '').trim();

        try {
            execSync(`taskkill /PID ${processId} /F`);
            console.log(`mysqld.exe with PID ${processId} killed successfully.`);
        } catch {

        }
       
       
    } else {
        console.log('mysqld.exe is not running.');
    }

    config.status = "Closed";
    writeAsJson(config, mariaDBPath);

}


function load_maria_config(mariaDBPath, version) {
    if (!fs.existsSync(mariaDBPath)) {

        var content = {
            "version": version,
            "status": "Closed"
        }

        writeAsJson(content, mariaDBPath);

        return content;

    } else {
        var content = JSON.parse(fs.readFileSync(mariaDBPath, 'utf-8'));
        if (content.version != version) {
            content.version = version;
            writeAsJson(content, mariaDBPath);
        }

        return content;
    }
}


module.exports.install_mariadb = install_mariadb;
module.exports.start_mariadb = start_mariadb;
module.exports.get_mariadb_version = get_mariadb_version;
module.exports.load_maria_config = load_maria_config;
module.exports.kill_maria_server = kill_maria_server;