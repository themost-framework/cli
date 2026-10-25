import { getApplication } from './app';
import { serveApplication } from './serve';
import minimist from 'minimist';
import {TraceUtils} from '@themost/common';

(async function() {
    try {
        const args = minimist(process.argv.slice(2), {
            string: ['port', 'host'],
            alias: {
                p: 'port',
                h: 'host'
            },
            default: {
                port: 3000
            }
        });
        const app = getApplication();
        await serveApplication(app, args.port, args.host);
    }
    catch(err) {
        TraceUtils.error(err);
        process.exit(1);
    }
})().then(() => void 0).catch(err => {
    TraceUtils.error(err);
    process.exit(1);
});