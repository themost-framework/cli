// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const {getConfiguration, createLogger} = require('../util');

module.exports = {
    command: 'build',
    desc: 'Build current @themost/cli project',
    builder: function builder(yargs) {
        return yargs;
    },
    handler: function handler() {
        const options = getConfiguration();
        const logger = createLogger();
        const buildModule = options.mode === 'typescript' ? '@themost-devkit/build-typescript' : '@themost-devkit/build';
        let build;
        try {
            build = require(buildModule).build;
        } catch (err) {
            if (err.code === 'MODULE_NOT_FOUND') {
                logger.error(`Build module ${buildModule} cannot be found. Install it with: npm i -D ${buildModule}`);
            }
            return Promise.reject(err);
        }
        return build(process.cwd()).then(() => {
            logger.info('Build operation was completed successfully.');
        }).catch((err) => {
            logger.error('An error occurred while building project.');
            return Promise.reject(err);
        });
    }
};
