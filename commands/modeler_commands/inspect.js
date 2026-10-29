const { handler, builder } = require('./info');

module.exports = {
    desc: 'Inspects model definition, including fields',
    command: 'inspect <model>',
    handler,
    builder
}