const Xcomfort = require('xcomfort-shc-api');
const DimActuator = require('./devices/dimActuator');
const Sensor = require('./devices/sensor');
const StateActuator = require('./devices/stateActuator');
const PullTimer = require("homebridge-http-base").PullTimer;

class XcomfortPlatform {
  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;

    this.xapi = undefined

    this.accessories = []
    this.devices = []

    this.Characteristic = this.api.hap.Characteristic;
    this.Service = this.api.hap.Service;

    this.sleepMode = false

    this.api.on('didFinishLaunching', () => {
      const { ip, user, password } = this.config

      const config = {
        baseUrl: `http://${ip}`,
        username: user,
        password,
        autoSetup: true
      }

      this.xapi = new Xcomfort(config);

      this.xapi.on('error', (error) => {
        this.log.warn('Error connecting to SHC. Please check config', error)
        return
      });

      this.xapi.on('ready', () => {
        this.log.info('SHC Connection successful')

        this.startTimers()
      });
    })
  }

  startTimers = () => {
    const activeInterval = (this.config.intervalActive || 15) * 1000
    const sleepInterval = (this.config.intervalSleep || 60) * 1000

    this.log.info('Starting timers')
    this.pullTimer = new PullTimer(this.log, activeInterval, () => this.getDevices(this.config.zone));
    this.sleepPullTimer = new PullTimer(this.log, sleepInterval, () => this.getDevices(this.config.zone));

    this.pullTimer.start();

    this.sleepTimer = new PullTimer(this.log, 300000, () => {
      this.sleepMode = true
      this.pullTimer.stop()
      this.sleepPullTimer.start()
    });
    this.sleepTimer.start();
  }

  configureAccessory = (accessory) => {
    this.accessories.push(accessory);
  }

  getDevices = async (zone) => {
    const devices = await this.xapi.query('StatusControlFunction/getDevices', [`hz_${zone}`, ''])

    if (this.pullTimer) this.pullTimer.resetTimer()
    if (this.sleepPullTimer) this.sleepPullTimer.resetTimer()

    devices.map((device, index) => {
      const { id, type, value } = device
      const uuid = this.api.hap.uuid.generate(id);

      const accessory = this.accessories.find(a => a.UUID === uuid)

      const dataForDevice = {
        accessory,
        device,
        uuid,
        log: this.log,
        api: this.api,
        xapi: this.xapi,
        zone: `hz_${zone}`,
        config: this.config,
        onDeviceWasActive: () => this.onDeviceWasActive()
      }

      this.devices.push({ ...device, uuid })

      if (type === 'DimActuator') {
        if (accessory?.context) {
          accessory.context.isOn = !!parseInt(device?.value) > 0
          accessory.context.brightness = parseInt(device?.value)
        }

        new DimActuator(dataForDevice)

        if (accessory) {
          const deviceService = accessory.getService(this.Service.Lightbulb);
          if (deviceService) {
            deviceService.updateCharacteristic(this.Characteristic.On, accessory.context.isOn);
            deviceService.updateCharacteristic(this.Characteristic.Brightness, accessory.context.brightness);
          }
        }
      }

      if (device?.type === 'LightActuator' || device?.type === 'SwitchActuator') {
        if (accessory?.context) {
          accessory.context.isOn = device?.value === 'ON'
        }
        new StateActuator(dataForDevice)

        if (accessory) {
          const deviceService = accessory.getService(this.Service[device?.type === 'LightActuator' ? 'Lightbulb' : 'Switch']);
          if (deviceService) {
            deviceService.updateCharacteristic(this.Characteristic.On, accessory.context.isOn);
          }
        }
      }

      if (device?.type === 'HumiditySensor' || device?.type === 'LuxSensor' || device?.type === 'TemperatureSensor') {
        if (accessory?.context) {
          accessory.context.value = parseFloat(device?.value) || 0.0001
        }
        new Sensor(dataForDevice)

        if (accessory) {
          const deviceService = accessory.getService(this.Service[serviceMap[device?.type]]);
          if (deviceService) {
            deviceService.updateCharacteristic(this.Characteristic[characteristicMap[device?.type]], accessory.context.value);
          }
        }
      }
    })
  }

  onDeviceWasActive = () => {
    if (!this.sleepMode) return
    this.sleepMode = false

    this.pullTimer.start()
    this.sleepPullTimer.stop()

    this.sleepTimer.resetTimer()
  }
}

const serviceMap = {
  'HumiditySensor': 'HumiditySensor',
  'LuxSensor': 'LightSensor',
  'TemperatureSensor': 'TemperatureSensor'
}

const characteristicMap = {
  'HumiditySensor': 'CurrentRelativeHumidity',
  'LuxSensor': 'CurrentAmbientLightLevel',
  'TemperatureSensor': 'CurrentTemperature'
}

module.exports = XcomfortPlatform