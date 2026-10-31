// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { createLogger } = require('../../util');
const existsSync = require('fs-extra').existsSync;
const readdirSync = require('fs-extra').readdirSync;
const copy = require('fs-extra').copy;
const readFile = require('fs-extra').readFile;
const writeFile = require('fs-extra').writeFile;
const semver = require('semver');

module.exports.command = 'project <directory>';

module.exports.desc = 'Create a new project';

module.exports.builder = function builder(yargs) {
    return yargs.option('template', {
        describe:'the target template',
        choices: ['api', 'express'],
        default:'api'
    }).option('typescript', {
        describe:'generates a typescript project',
        default: false,
        type: 'boolean'
    }).option('skip-install', {
        describe:'skips installing dependencies',
        default: false,
        type: 'boolean'
    });
};

/**
 *
 * @param {{template: string, typescript: boolean, directory: string, skipInstall: boolean}} argv
 * @returns {*}
 */
module.exports.handler = function handler(argv) {
    const logger = createLogger();
    let projectRoot = path.resolve(process.cwd(), argv.directory);
    if (existsSync(projectRoot) && readdirSync(projectRoot).length>0) {
        logger.warn('Project root directory must be empty. Skipping project creation.');
        return Promise.resolve();
    }
    logger.info('Creating new project  at %s', projectRoot);
    //get template path
    let  templateRoot = path.resolve(__dirname, `../../templates/${argv.template}_project`);
    if (argv.typescript) {
        templateRoot = path.resolve(__dirname, `../../templates/typescript/${argv.template}_project`);
    }

    //validate template folder
    if (!existsSync(templateRoot)) {
        logger.error('The specified template cannot be found.');
        return Promise.reject(new Error('The specified template cannot be found.'));
    }
    return copy(templateRoot, projectRoot).then(() => {
            return Promise.all([
                updateApplicationConfiguration(argv)
                ]).then(() => {
                    return preInstallDependencies(projectRoot).then(() => {
                        if (argv.skipInstall) {
                            return Promise.resolve();
                        }
                        return installDependencies(projectRoot, logger);
                    });
                }).then(()=> {
                    logger.log(`The operation was completed successfully. A new project was created at ${projectRoot}`);
                    return Promise.resolve();
                }).catch((err) => {
                    logger.error('An error occurred while executing post operations.');
                    return Promise.reject(err);
                });
        }, err => {
            logger.error('An error occurred while generating new project.', err);
            return Promise.reject(err);
        });

};

function preInstallDependencies(projectRoot) {
    return new Promise((resolve, reject) => {
        let packageJsonPath = path.resolve(projectRoot, 'package.json');
        if (existsSync(packageJsonPath)) {
            return readFile(packageJsonPath, 'utf8', (err, str) => {
                if (err) {
                    return reject(err);
                }
                // noinspection JSCheckFunctionSignatures
                let data = JSON.parse(str);
                if (!data.nodeEngineDependencies) {
                    return resolve();
                }
                let nodeVersion = process.versions.node;
                let nodeEngineDependencies = data.nodeEngineDependencies;
                for (const [packageName, versionMap] of Object.entries(nodeEngineDependencies)) {
                    let selectedVersion = null;
                    // noinspection JSCheckFunctionSignatures
                    for (const [versionRange, version] of Object.entries(versionMap)) {
                        if (semver.satisfies(nodeVersion, versionRange)) {
                            selectedVersion = version;
                            break;
                        }
                    }
                    if (selectedVersion) {
                        data.dependencies[packageName] = selectedVersion;
                    }
                }
                delete data.nodeEngineDependencies;
                return writeFile(packageJsonPath, JSON.stringify(data, null, 4), 'utf8', (err) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve();
                })
            })
        }
        return resolve();
    });
}

function installDependencies(projectRoot, logger) {
    return new Promise((resolve, reject) => {
        logger.info('Installing dependencies');
        const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        const child = spawn(npm, ['install'], {
            cwd: projectRoot,
            stdio: 'inherit',
            shell: process.platform === 'win32'
        });
        child.on('error', reject);
        child.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`npm install exited with code ${code}`));
            }
            return resolve();
        });
    });
}

function updateApplicationConfiguration(argv) {
    return new Promise((resolve, reject) => {
        let projectRoot = path.resolve(process.cwd(), argv.directory);
        let appJsonPath = path.resolve(projectRoot, 'server/config/app.json');
        // generate application key
        if (existsSync(appJsonPath)) {
            return readFile(appJsonPath, 'utf8', (err, str)=> {
               if (err) {
                   return reject(err);
               } 
               // noinspection JSCheckFunctionSignatures
                let data = JSON.parse(str);
               return crypto.randomBytes(48, (err, buffer) => {
                   if (err) {
                       return reject(err);
                   }
                   // set application key
                  // noinspection JSCheckFunctionSignatures
                   data.settings.crypto.key = buffer.toString('hex');
                  return crypto.randomBytes(12, (err, buffer) => {
                       if (err) {
                           return reject(err);
                       }
                       // set unattended execution account
                      // noinspection JSCheckFunctionSignatures
                      data.settings.auth.unattendedExecutionAccount = buffer.toString('base64');
                      // write app.json
                      return writeFile(appJsonPath, JSON.stringify(data, null, 4), 'utf8', (err) => {
                          if (err) {
                              return reject(err);
                          }
                          return resolve();
                      })
                    });
                });
            });
        }
    });
}
