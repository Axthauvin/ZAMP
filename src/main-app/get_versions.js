const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const cheerio = require('cheerio');



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


// Function to fetch Apache Windows binaries
async function fetchApacheVersions() {
  const url = 'https://www.apachelounge.com/download/';

  return await new Promise(async (resolve, reject) => {
    
    await https.get(url, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        const $ = cheerio.load(data);
        const links = [];

        // Extracting download links
        $('a').each((index, element) => {
          const href = $(element).attr('href');
          if (href && href.includes('httpd-') && href.endsWith('.zip')) {
            links.push(`https://www.apachelounge.com${href}`);
          }
        });


        resolve(links);
      });
    }).on('error', (err) => {
      reject(err.message);
    });
  });
}


module.exports = { listApacheVersions, fetchApacheVersions };
