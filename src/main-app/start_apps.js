const { exec } = require('child_process');
const path = require('path');

async function openFolderInEditor(folderPath, editor, log) {
    // Ensure the folder path is absolute
    const absolutePath = path.resolve(folderPath);

    let command;

    // Determine the command based on the specified editor
    switch (editor.toLowerCase()) {
        case 'vscode':
            command = `code "${absolutePath}"`;
            break;
        case 'sublime':
            command = `subl "${absolutePath}"`;
            break;
        case 'atom':
            command = `atom "${absolutePath}"`;
            break;
        default:
            log.error(`Unsupported editor: ${editor}`);
            return;
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            log.error(`Error opening folder in ${editor}: ${error.message}`);
            return;
        }
        if (stderr) {
            log.error(`Error: ${stderr}`);
            return;
        }
        log.info(`Folder opened in ${editor}: ${absolutePath}`);
    });
}

module.exports.openFolderInEditor = openFolderInEditor;