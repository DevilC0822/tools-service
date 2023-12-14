const db = require('./db');
const app = require('./app');
const config = require('./config');
const http = require('http');

db(() => {
  const port = config.port || 3000;
  app.set('port', port);

  const server = http.createServer(app);
  server.listen(port);
  
  server.on('error', (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  });

  server.on('listening', () => {
    const addr = server.address();
    console.log(`Listening on http://127.0.0.1:${addr.port}`);
  });

}, () => {});