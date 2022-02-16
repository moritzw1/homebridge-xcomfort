const Platform = require('./src/platform')

module.exports = function (api) {
    api.registerPlatform('Xcomfort', Platform)
}