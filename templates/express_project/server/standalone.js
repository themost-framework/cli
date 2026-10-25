import debug from 'debug';
import { getApplication } from './app';
import { serveApplication } from './serve';
import minimist from 'minimist';
const log = debug('themost-framework:*');
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
        log(err);
        process.exit(1);
    }
})();