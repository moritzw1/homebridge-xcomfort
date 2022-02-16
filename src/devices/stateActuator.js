const PLUGIN_NAME = 'homebridge-xcomfort';
const PLATFORM_NAME = 'Xcomfort';

// Could be a Light Switch (withouth dimming capabilities) or normal Switch

class StateActuator {
  constructor(data) {
    this.api = data?.api
    this.log = data?.log
    this.accessory = data?.accessory
    this.device = data?.device
    this.zone = data?.zone
    this.xapi = data?.xapi
    this.wasActiveFunc = data?.onDeviceWasActive

    this.Service = this.api.hap.Service;
    this.ServiceElement = this.Service[this.device?.type === 'LightActuator' ? 'Lightbulb' : 'Switch']
    this.Characteristic = this.api.hap.Characteristic;
    this.Categories = this.api.hap.Categories;
    this.CategoryElement = this.Categories[this.device?.type === 'LightActuator' ? 'LIGHTBULB' : 'SWITCH']

    this.isOn = this.device.value === 'ON'
    this.prevIsOn = undefined
    
    if (this.accessory == undefined) {
      this.log.info('Added new device:', this.device?.name)
      this.accessory = new this.api.platformAccessory(this.device?.name, data?.uuid);
      this.accessory.category = this.CategoryElement;
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [this.accessory]);
    }

    this.deviceService = this.accessory.getService(this.ServiceElement);

    if (!this.deviceService) {
      this.deviceService = this.accessory.addService(this.ServiceElement);
    }

    this.updateAllCharacteristics()
  }

  updateAllCharacteristics = () => {
    this.deviceService.getCharacteristic(this.Characteristic.On)
      .onSet(async (state) => {
        this.prevIsOn = this.isOn
        this.isOn = state
        const isOnValue = this.isOn ? 'on' : 'off'

        if (this.prevIsOn === this.isOn) {
          return
        }
        
        const response = await this.xapi.query('StatusControlFunction/controlDevice', [this.zone, this.device?.id, isOnValue])
        
        if (response?.status === 'ok') {
          this.wasActiveFunc()
        }
      })
      .onGet(async () => {
        this.isOn = this.accessory.context.isOn || false
        
        this.wasActiveFunc()
        return this.isOn
      });
  }
}

module.exports = StateActuator