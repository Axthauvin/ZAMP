const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * List all Apache versions installed in the bin/apache directory.
 * @param {string} apacheRoot - The root path to the bin/apache directory.
 * @returns {string[]} - An array of Apache version folder names.
 */

function listApacheVersions(apacheDir) {
    try {
      
      if (!fs.existsSync(apacheDir)) {
        console.error(`Directory not found: ${apacheDir}`);
        return [];
      }
  
      const folders = fs.readdirSync(apacheDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
  
      return folders;
    } catch (error) {
      console.error(`Error reading Apache versions: ${error}`);
      return [];
    }
}

module.exports = { listApacheVersions };
