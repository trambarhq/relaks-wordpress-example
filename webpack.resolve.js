var Path = require('path');

module.exports = function(config) {
    config.module.rules.forEach((rule) => {
        if (rule.loader === 'babel-loader' && rule.query) {
            if (rule.query.presets) {
                rule.query.presets = rule.query.presets.map((preset) => {
                    return resolve('preset', preset);
                })
            }
            if (rule.query.plugins) {
                rule.query.plugins = rule.query.plugins.map((plugin) => {
                    return resolve('plugin', plugin);
                })
            }
        }
    });
    config.resolve.modules.splice(1, 0, Path.resolve('./node_modules'));    
};

function resolve(type, module) {
    if (module instanceof Array) {
        module[0] = resolve(type, module[0]);
        return module;
    } else {
        if (!/^[\w\-]+$/.test(module)) {
            return module;
        }
        return Path.resolve(`./node_modules/babel-${type}-${module}`);
    }
}
