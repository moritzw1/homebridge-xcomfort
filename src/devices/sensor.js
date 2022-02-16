const PLUGIN_NAME = 'homebridge-xcomfort';
const PLATFORM_NAME = 'Xcomfort';

// Could be a Light Switch (withouth dimming capabilities) or normal Switch

class Sensor {
  constructor(data) {
    this.api = data?.api
    this.log = data?.log
    this.accessory = data?.accessory
    this.device = data?.device

    this.Service = this.api.hap.Service;
    this.ServiceElement = this.Service[serviceMap[this.device?.type]]
    this.Characteristic = this.api.hap.Characteristic[characteristicMap[this.device?.type]];
    this.Category = this.api.hap.Categories.SENSOR;

    if (this.accessory == undefined) {
      this.log.info('Added new device:', this.device?.name)
      this.accessory = new this.api.platformAccessory(this.device?.name, data?.uuid);
      this.accessory.category = this.Category;
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [this.accessory]);
    }

    this.deviceService = this.accessory.getService(this.ServiceElement);

    if (!this.deviceService) {
      this.deviceService = this.accessory.addService(this.ServiceElement);
    }

    this.updateAllCharacteristics()
  }

  updateAllCharacteristics = () => {
    this.deviceService.getCharacteristic(this.Characteristic)
      .onGet(async () => {
        this.value = this.accessory.context.value || 0.0001
        return this.value
      });
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

module.exports = Sensor