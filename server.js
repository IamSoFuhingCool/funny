const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const CORRECT_PASSWORD = "195JA-SIBUX-A14DG-OAL14-LAK19"; // Your new password

const server = http.createServer((req, res) => {
    const cookieHeader = req.headers.cookie || '';
    const isLoggedIn = cookieHeader.includes('auth=true');

    const serveFile = (filePath, contentType) => {
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            }
        });
    };

    // 1. Public Home Page
    if (req.url === '/' || req.url === '/index.html') {
        serveFile(path.join(__dirname, 'index.html'), 'text/html');
    } 
    // 2. Handle Password Submission from about.html
    else if (req.url === '/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            const params = new URLSearchParams(body);
            const passwordParam = params.get('password');
            
            if (passwordParam === CORRECT_PASSWORD) {
                // Success: Set cookie and send them to about.html
                res.writeHead(302, {
                    'Set-Cookie': 'auth=true; HttpOnly',
                    'Location': '/about.html'
                });
                res.end();
            } else {
                // Failure: Send back to about.html with an error flag
                res.writeHead(302, { 'Location': '/about.html?error=1' });
                res.end();
            }
        });
    } 
    // 3. The About Page (The Gatekeeper)
    else if (req.url.startsWith('/about.html')) {
        if (isLoggedIn) {
            // If logged in, serve your real secret about.html file
            serveFile(path.join(__dirname, 'about.html'), 'text/html');
        } else {
            // If NOT logged in, show the password login form right on the page
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <link rel="stylesheet" type="text/css" href="style.css">
                    <title>Password Required - About</title>
                </head>
                <body>
                    <h2>This page is unauthorized.</h2>
                    <p>Enter the password to access the page:</p>
                    <form action="/login" method="POST">
                        <input type="password" name="password" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" required autofocus>
                        <button type="submit">Unlock</button>
                    </form>
                    ${req.url.includes('error=1') ? '<p class="error">Incorrect password, try again!</p>' : ''}
                    <br><br>
                    <a href="/index.html" style="color: #888;">← Back to Home</a>
                </body>
                </html>
            `);
        }
    } 
    // 4. Handle other assets (CSS, JS, images, audio like horse.mp3)
    else {
        const filePath = path.join(__dirname, req.url);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath);
            let contentType = 'text/plain';
            
            if (ext === '.html') contentType = 'text/html';
            else if (ext === '.css') contentType = 'text/css';
            else if (ext === '.js') contentType = 'application/javascript';
            else if (ext === '.mp3') contentType = 'audio/mpeg';
            else if (ext === '.png') contentType = 'image/png';
            else if (ext === '.jpg') contentType = 'image/jpeg';

            serveFile(filePath, contentType);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        }
    }
});

server.listen(PORT, () => {
    console.log(`Server running! Open http://localhost:${PORT}`);
});