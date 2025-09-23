const { spawn } = require('child_process');

console.log('🚀 Starting LPRT Backend Server...');

const server = spawn('node', ['Backend/server.js'], {
    stdio: 'inherit',
    cwd: __dirname
});

server.on('close', (code) => {
    console.log(`Backend server exited with code ${code}`);
});

server.on('error', (error) => {
    console.error('Failed to start server:', error);
});

// Keep the process running
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down backend server...');
    server.kill();
    process.exit();
});