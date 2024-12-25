const http = require('http');
const { File } = require('megajs');

// MEGA file URL
const url = 'https://mega.nz/file/iAhiBLjB#Y9-RQ6rM5NLfDb6-xoILOGNOIVNs5rFsT8RPa8eJDf8'; // Replace with your MEGA file URL

// Create a File object
const mainFile = File.fromURL(url);

mainFile.loadAttributes().then(() => {
    console.log('File name:', mainFile.name);
});

const server = http.createServer(async (req, res) => {
    try {
        const range = req.headers.range;
        const totalSize = mainFile.size;

        let start = 0;
        let end = totalSize - 1;

        if (range) {
            const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
            start = parseInt(startStr, 10);
            end = endStr ? parseInt(endStr, 10) : end;

            if (start >= totalSize || end >= totalSize) {
                res.writeHead(416, {
                    'Content-Range': `bytes */${totalSize}`
                });
                res.end();
                return;
            }

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': end - start + 1,
                'Content-Type': 'video/x-matroska' // Correct MIME type for MKV files
            });
        } else {
            res.writeHead(200, {
                'Content-Length': totalSize,
                'Content-Type': 'video/x-matroska' // Correct MIME type for MKV files
            });
        }

        // Stream the required range of the file
        const stream = mainFile.download({ start, end });
        stream.pipe(res);

    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error streaming video: ' + error.message);
    }
});

const port = process.env.PORT || 3000; // Use PORT environment variable, default to 3000 if not set
server.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
});
