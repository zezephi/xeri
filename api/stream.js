const { File } = require('megajs');

// MEGA file URL
const url = 'https://mega.nz/file/iAhiBLjB#Y9-RQ6rM5NLfDb6-xoILOGNOIVNs5rFsT8RPa8eJDf8';
const mainFile = File.fromURL(url);

// Global flag to track if file attributes are loaded
let fileAttributesLoaded = false;

// Preload attributes before handling requests
async function loadFileAttributes() {
    try {
        await mainFile.loadAttributes();
        fileAttributesLoaded = true;
        console.log('File attributes loaded.');
        console.log('File name:', mainFile.name);
        console.log('File size:', mainFile.size);
    } catch (error) {
        console.error('Failed to load file attributes:', error.message);
    }
}

// Load file attributes before starting the server
loadFileAttributes();

export default async (req, res) => {
    try {
        // Ensure file attributes are loaded before processing the request
        if (!fileAttributesLoaded) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            return res.end('Error: File attributes not loaded yet.');
        }

        const range = req.headers.range;
        const totalSize = mainFile.size;

        if (!totalSize) {
            throw new Error('Unable to determine file size.');
        }

        let start = 0;
        let end = totalSize - 1;

        if (range) {
            const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
            start = parseInt(startStr, 10);
            end = endStr ? parseInt(endStr, 10) : end;

            if (start >= totalSize || end >= totalSize) {
                res.writeHead(416, { 'Content-Range': `bytes */${totalSize}` });
                res.end();
                return;
            }

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': end - start + 1,
                'Content-Type': 'video/x-matroska' // Adjust MIME type as needed
            });
        } else {
            res.writeHead(200, {
                'Content-Length': totalSize,
                'Content-Type': 'video/x-matroska' // Adjust MIME type as needed
            });
        }

        // Stream the requested range of the file
        const stream = mainFile.download({ start, end });
        stream.pipe(res);

    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error streaming video: ' + error.message);
    }
};
