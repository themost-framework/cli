const {writeFileFromTemplate, getConfiguration, createLogger} = require('../../util');
const fs = require('fs-extra');
const path = require('path');

module.exports.command = 'listener <name>';

module.exports.desc = 'Generate a new event listener';

module.exports.builder = {
};

module.exports.handler = function handler(argv) {
    let options = getConfiguration();
    const logger = createLogger();
    //get service name
    let listenerName = argv.name;
    
    //get listener file name
    let destFile = listenerName.concat(options.mode==='typescript' ? '.ts': '.js');
    logger.debug(`Generating listener ${destFile}`);
    let destPath = path.resolve(process.cwd(), options.base, `listeners/${destFile}`);
    logger.debug(`Validating listener path ${destPath}`);
    if (fs.existsSync(destPath)) {
        logger.warn('The specified listener already exists. Skipping listener generation.');
        return Promise.resolve();
    }
    //get template file path
    let templateFile = path.resolve(__dirname,'../../templates/generate/listener' + (options.mode==='typescript' ? '.ts': '.js') + '.ejs');
    //get destination folder path
    let destFolder = path.dirname(destPath);
    logger.debug(`Validating listener folder (${destFolder}).`);
    return fs.ensureDir(destFolder).catch((err) => {
           return Promise.reject(err);
    }).then(() => {
       return writeFileFromTemplate(templateFile, destPath, {
            name: argv.name
        }).then(() => {
           logger.info(`Listener generated successfully at ${destPath}`);
           return Promise.resolve();
        });
    });
};
