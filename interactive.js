// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const path = require('path');
const os = require('os');
const repl = require('repl');
const Yargs = require('yargs/yargs');

const INTERACTIVE_ARGS = ['-i', '--interactive'];

/**
 * An error which is thrown to stop the execution of the current command
 */
class ExitSignal extends Error {
    constructor() {
        super('Command execution was stopped');
    }
}

/**
 * Splits a command line into arguments respecting single/double quotes and backslash escapes
 * @param {string} line
 * @returns {Array<string>}
 */
function parseArgs(line) {
    const args = [];
    let current = '';
    let quote = null;
    let hasToken = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (quote) {
            if (ch === quote) {
                quote = null;
            } else if (ch === '\\' && quote === '"' && i + 1 < line.length) {
                current += line[++i];
            } else {
                current += ch;
            }
        } else if (ch === '"' || ch === '\'') {
            quote = ch;
            hasToken = true;
        } else if (ch === '\\' && i + 1 < line.length) {
            current += line[++i];
            hasToken = true;
        } else if (/\s/.test(ch)) {
            if (hasToken) {
                args.push(current);
                current = '';
                hasToken = false;
            }
        } else {
            current += ch;
            hasToken = true;
        }
    }
    if (quote) {
        throw new Error(`Unterminated quoted string (${quote})`);
    }
    if (hasToken) {
        args.push(current);
    }
    return args;
}

/**
 * Returns true if the given arguments request interactive mode
 * @param {Array<string>} args
 * @returns {boolean}
 */
function isInteractive(args) {
    return args.some((arg) => INTERACTIVE_ARGS.includes(arg));
}

/**
 * Removes interactive mode arguments
 * @param {Array<string>} args
 * @returns {Array<string>}
 */
function stripInteractive(args) {
    return args.filter((arg) => !INTERACTIVE_ARGS.includes(arg));
}

/**
 * Creates a command line parser which does not exit process
 * @param {function(Error=)} done
 * @param {function()} started
 */
function createParser(done, started) {
    return Yargs()
        .scriptName('themost')
        .commandDir(path.resolve(__dirname, 'commands'))
        .demandCommand()
        .strictCommands()
        .help()
        .version(false)
        .exitProcess(false)
        .middleware(() => started())
        .onFinishCommand(() => done())
        .fail((msg, err) => {
            done(err || new Error(msg));
            // stop executing command handler after a validation error
            throw new ExitSignal();
        });
}

/**
 * Starts an interactive shell which executes cli commands against the same process
 * so as the application instance is loaded once and shared across commands
 * @param {Array<string>=} initialArgs - a command to execute before prompting
 */
function startInteractive(initialArgs) {
    const exit = process.exit;
    let queue = Promise.resolve();
    let closed = false;
    // the command which is currently executing
    let current = null;
    // true while a command line is being parsed and its handler is called synchronously
    let parsing = false;

    // commands call process.exit() on completion so in interactive mode exit marks the current command as completed
    process.exit = function interactiveExit(code) {
        if (current) {
            current.finish(code ? new Error(`Command exited with code ${code}`) : null, true);
        }
        if (parsing) {
            // stop the synchronous execution of the current command handler
            throw new ExitSignal();
        }
    };
    process.on('uncaughtException', (err) => {
        if (current && !(err instanceof ExitSignal)) {
            return current.finish(err);
        }
    });
    process.on('unhandledRejection', (reason) => {
        if (current && !(reason instanceof ExitSignal)) {
            return current.finish(reason instanceof Error ? reason : new Error(reason));
        }
    });

    const runCommand = (args) => {
        return new Promise((resolve) => {
            let isStarted = false;
            const command = current = {
                finish: (err, exited) => {
                    if (current !== command) {
                        return;
                    }
                    current = null;
                    // errors are already reported by commands which call process.exit()
                    if (err && !exited) {
                        console.error('ERROR', err.message);
                    }
                    return resolve();
                }
            };
            parsing = true;
            try {
                createParser((err) => command.finish(err), () => isStarted = true).parse(args);
            }
            catch(err) {
                return command.finish(err);
            }
            finally {
                parsing = false;
            }
            if (!isStarted) {
                // help or validation output; no command handler was executed
                command.finish();
            }
        });
    };

    const commands = createParser(() => {}, () => {}).getCommandInstance().getCommands();
    const keywords = ['help', 'exit'].concat(commands);
    console.log('Type a command e.g. cat User --top 1, "help" for available commands or ".exit" to quit.');
    const startRepl = () => {
        const server = repl.start({
            prompt: 'themost> ',
            ignoreUndefined: true,
            completer: (line) => {
                const words = line.split(/\s+/);
                const last = words[words.length - 1];
                const candidates = words.length === 1 ? keywords : [];
                const hits = candidates.filter((name) => name.startsWith(last));
                return [hits.length ? hits : candidates, last];
            },
            eval: (cmd, context, filename, callback) => {
                // commands are queued so that buffered input (e.g. piped lines) is executed sequentially
                queue = queue.then(() => {
                    const args = stripInteractive(parseArgs(cmd));
                    if (closed || args.length === 0) {
                        return;
                    }
                    if (args[0] === 'exit' || args[0] === 'quit') {
                        closed = true;
                        return server.close();
                    }
                    if (args[0] === 'help') {
                        return runCommand(args.slice(1).concat('--help'));
                    }
                    return runCommand(args);
                }).catch((err) => {
                    console.error('ERROR', err.message);
                }).then(() => {
                    return callback(null);
                });
            }
        });
        if (typeof server.setupHistory === 'function') {
            server.setupHistory(path.resolve(os.homedir(), '.themost_history'), (err) => {
                if (err) {
                    console.error('WARN', 'Command history cannot be loaded.', err.message);
                }
            });
        }
        server.on('exit', () => {
            // wait for pending commands e.g. when input stream ends
            queue.then(() => exit.call(process, 0));
        });
        return server;
    };
    // execute the given command, if any, before prompting
    queue = initialArgs && initialArgs.length ? runCommand(initialArgs) : Promise.resolve();
    return queue.then(startRepl);
}

module.exports.parseArgs = parseArgs;
module.exports.isInteractive = isInteractive;
module.exports.stripInteractive = stripInteractive;
module.exports.startInteractive = startInteractive;
