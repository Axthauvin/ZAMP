const path = require('path');
const fs = require('fs');
const https = require('https');
const decompress = require('decompress');
const decompressTargz = require('decompress-targz');
const { writeAsJson } = require('./basic_functions');
const cheerio = require('cheerio');


const apacheDownloadPage = 'https://downloads.apache.org/httpd/';

/**
 * Fetches the available Apache versions from the download page.
 * @returns {Promise<string[]>} A promise that resolves to a list of available versions.
 */
async function fetchAvailableVersions() {
  return new Promise((resolve, reject) => {
    https.get(apacheDownloadPage, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        const $ = cheerio.load(data);
        const versions = [];

        $('a').each((index, element) => {
          const href = $(element).attr('href');
          if (href && href.includes('httpd-') && href.endsWith('.tar.gz')) {
            versions.push(href);
          }
        });

        resolve(versions);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });

}

const downloadApacheVersion = (version, destination, zipFile) => {
  const downloadUrl = apacheDownloadPage + zipFile;
  console.log(downloadUrl);
  const destinationDir = path.dirname(destination);
  console.log(destination);

  const file = fs.createWriteStream(destination);
  https.get(downloadUrl, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close(() => {

        console.log("Starting decompress");
        
        /*// Read the downloaded .tar.gz file
        fs.readFile(destination, (err, data) => {
          if (err) {
            console.error(`Error reading file ${destination}: ${err.message}`);
            return;
          }

          // Decompress the .tar.gz file
          zlib.gunzip(data, (err, decompressedData) => {
            if (err) {
              console.error('Error decompressing file:', err);
              return;
            }

            // Extract the decompressed data using AdmZip
            const zip = new AdmZip(decompressedData);
            zip.extractAllTo(destinationDir, true); //overwrite

            console.log('Extraction complete');
            // Notify the main process that download is complete
            mainWindow.webContents.send('download-complete', version);
          });
        });
        */

        decompress(destination, destinationDir, {
          plugins: [
            decompressTargz()
          ]
        }).then(() => {
          console.log('Files decompressed');
        });
      });
    });
  }).on('error', (err) => {
    fs.unlink(destination, () => {
      console.error(`Error downloading Apache version ${version}: ${err.message}`);
    });
  });
}



function download_apache_version(version, apachePath, configPath) {
    
    var config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    if (!config.dowloaded[version]) {
        var zipFile = `httpd-${version}.tar.gz`;
        const destination = path.resolve(path.join(apachePath, zipFile));
        downloadApacheVersion(version, destination, zipFile);
    } else {
        console.log(`Apache version ${version} was already downloaded before`);
    }
   
    //config.dowloaded[version] = true;
    writeAsJson(config, configPath);
}


module.exports.download_apache_version = download_apache_version;
module.exports.fetchAvailableVersions = fetchAvailableVersions;
