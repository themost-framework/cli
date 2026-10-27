const writeFileFromTemplate = require('../../util').writeFileFromTemplate;
const getConfiguration = require('../../util').getConfiguration;
const fs = require('fs-extra');
const path = require('path');

module.exports.command = 'service <name>';

module.exports.desc = 'Generate a new service';

module.exports.builder = {
};

module.exports.handler = function handler(argv) {
    let options = getConfiguration();
    //get service name
    let serviceName = argv.name;
    //get service file name
    let destFile = serviceName.concat(options.mode==='typescript' ? '.ts': '.js');
    let destPath = path.resolve(process.cwd(), options.base, `services/${destFile}`);
    if (fs.existsSync(destPath)) {
        console.warn('WARNING','The specified service already exists. Skipping service generation.');
        return Promise.resolve();
    }
    //get template file path
    let templateFile = path.resolve(__dirname,'../../templates/generate/service' + (options.mode==='typescript' ? '.ts': '.js') + '.ejs');
    
    //get destination folder path
    let destFolder = path.dirname(destPath);
    try {
        fs.ensureDirSync(destFolder);
    }
    catch (err) {
        console.error('ERROR', 'SERVICE', `An error occurred while validating destination path for service "${serviceName}".`);
        return Promise.reject(err);
    }
    console.log('INFO',`Generating service "${serviceName}"`);
    return writeFileFromTemplate(templateFile, destPath, {
        name:serviceName
    }).then(() => {
        console.log('INFO', 'SERVICE', `The service "${serviceName}" generated successfully at ${destPath}`);
        return Promise.resolve();
    }).catch((err)=> {
        console.error('ERROR', 'SERVICE', 'An error occurred while generating service.');
        return Promise.reject(err);
    });
};
