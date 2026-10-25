import http from 'http';
import {Args, TraceUtils} from '@themost/common';
import {Application} from 'express';
import { AddressInfo } from 'net';

// normalize a port into a number, string, or false.
function normalizePort(val: any): number | boolean {
    const port = parseInt(val, 10);
    if (isNaN(port)) {
        // named pipe
        return val as number;
    }
    if (port >= 0) {
        // port number
        return port;
    }
    return false;
}

function serveApplication(app: Application, port: any, host: string): Promise<unknown> {

    return new Promise((resolve, reject) => {
        // get port from environment
        const _port = normalizePort(port);
        // get bind address.
        const _host = host || 'localhost';
        // noinspection JSUnresolvedFunction
        const server = http.createServer(app);
        // listen on provided port, on all network interfaces.
        server.on('error', err => {
            TraceUtils.error(err);
            return reject(err);
        });
        server.on('close', () => {
            TraceUtils.debug('Stopping the application server from accepting new connections.');
        });
        server.on('listening', () => {
            const addr = server.address() as AddressInfo;
            // eslint-disable-next-line no-console
            // noinspection HttpUrlsUsage
            TraceUtils.debug(`The application server starts listening on http://${_host}:${addr.port}`);
            return resolve(server);
        });
        server.listen(_port as any, _host, 0, () => {
            //
        });
    });
}

function getServerAddress(server: http.Server) {
    Args.notNull(server, 'server');
    // noinspection JSUnresolvedFunction
    const addressInfo = server.address() as AddressInfo;
    // noinspection HttpUrlsUsage
    return `http://${addressInfo.address}:${addressInfo.port}/`;
}

export {
    serveApplication,
    getServerAddress
}