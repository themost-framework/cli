import http from 'http';
import {Args, TraceUtils} from '@themost/common';

// normalize a port into a number, string, or false.
function normalizePort(val) {
    let port = parseInt(val, 10);
    if (isNaN(port)) {
        // named pipe
        return val;
    }
    if (port >= 0) {
        // port number
        return port;
    }
    return false;
}
// noinspection JSUnusedGlobalSymbols
/**
 *
 * @param {Application} app
 * @param {*=} port
 * @param {*=} host
 * @return Promise<Server>
 */
export function serveApplication(app, port, host) {

    return new Promise((resolve, reject) => {
        // get port from environment
        let _port = normalizePort(port);
        // get bind address.
        let _host = host || 'localhost';
        // noinspection JSUnresolvedFunction
        let server = http.createServer(app);
        // listen on provided port, on all network interfaces.
        server.on('error', err => {
            TraceUtils.error(err);
            return reject(err);
        });
        server.on('close', () => {
            TraceUtils.debug('Stopping the application server from accepting new connections.');
        });
        server.on('listening', () => {
            let addr = server.address();
            // eslint-disable-next-line no-console
            // noinspection HttpUrlsUsage
            TraceUtils.debug(`The application server starts listening on http://${_host}:${addr.port}`);
            return resolve(server);
        });
        server.listen(_port, _host);
    });
}

// noinspection JSUnusedGlobalSymbols
/**
 * @param {Server} server
 * @return {string}
 */
export function getServerAddress(server) {
    Args.notNull(server, 'server');
    // noinspection JSUnresolvedFunction
    const addressInfo = server.address();
    // noinspection HttpUrlsUsage
    return `http://${addressInfo.address}:${addressInfo.port}/`;
}
