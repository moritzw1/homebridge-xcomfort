class XcomfortPlatform {
  constructor(log, config, api) {
    this.config = config
    this.api.on('didFinishLaunching', () => {
      console.log(this.config)
    });
  }
}

module.exports = XcomfortPlatform