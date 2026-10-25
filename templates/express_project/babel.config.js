module.exports = function (api) {
    api.cache(false);
    return {
        'sourceMaps': 'both',
        'presets': [
            [
                '@babel/preset-env',
                {
                    'targets': {
                        'node': 'current'
                    }
                }
            ]
        ],
        'plugins': [
            [
                '@babel/plugin-proposal-decorators',
                {
                    'legacy': true
                }
            ]
        ]
    };
};
