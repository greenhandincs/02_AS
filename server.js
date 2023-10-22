const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
   const filePath = path.join(__dirname, req.url);
   const fileExt = path.extname(filePath);
   let contentType = 'text/html';

   if (fileExt === '.js') {
     contentType = 'text/javascript';
   }

   fs.readFile(filePath, (err, content) => {
     if (err) {
       res.writeHead(404);
       res.end('File not found');
     } else {
       res.writeHead(200, { 'Content-Type': contentType });
       res.end(content, 'utf-8');
     }
   });
 });

server.listen(port, hostname, () => {
   console.log(`Server running at http://${hostname}:${port}/`);
});