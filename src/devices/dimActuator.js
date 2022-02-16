const PLUGIN_NAME = 'homebridge-xcomfort';
const PLATFORM_NAME = 'Xcomfort';

class DimActuator {
  constructor(data) {
    this.api = data?.api
    this.log = data?.log
    this.accessory = data?.accessory
    this.device = data?.device
    this.zone = data?.zone
    this.xapi = data?.xapi
    this.wasActiveFunc = data?.onDeviceWasActive

    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;
    this.Categories = this.api.hap.Categories;

    this.isOn = !!parseInt(this.device?.value) > 0
    this.prevIsOn = undefined
    this.onInProgress = false

    this.brightness = parseInt(this.device?.value)
    this.brightnessInProgress = false

    if (this.accessory == undefined) {
      this.log.info('Added new device:', this.device?.name)
      this.accessory = new this.api.platformAccessory(this.device?.name, data?.uuid);
      this.accessory.category = this.Categories.LIGHTBULB;
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [this.accessory]);
    }

    this.deviceService = this.accessory.getService(this.Service.Lightbulb);

    if (!this.deviceService) {
      this.deviceService = this.accessory.addService(this.Service.Lightbulb);
    }

    this.updateAllCharacteristics()
  }

  updateAllCharacteristics = () => {
    this.deviceService.getCharacteristic(this.Characteristic.On)
      .onSet(async (state) => {
        if (this.brightnessInProgress) return
        this.onInProgress = true
        this.prevIsOn = this.isOn
        this.isOn = state
        const isOnValue = this.isOn ? 'on' : 'off'

        if (this.prevIsOn === this.isOn) {
          this.onInProgress = false
          return
        }

        const response = await this.xapi.query('StatusControlFunction/controlDevice', [this.zone, this.device?.id, isOnValue])

        if (response?.status === 'ok') {
          this.onInProgress = false
          this.wasActiveFunc()
        }
      })
      .onGet(async () => {
        this.isOn = this.accessory.context.isOn || this.isOn
        this.brightness = this.accessory.context.brightness || this.brightness

        this.wasActiveFunc()
        return this.isOn
      });

    this.deviceService.getCharacteristic(this.Characteristic.Brightness)
      .onSet(async (state) => {
        if (this.onInProgress) return
        this.brightnessInProgress = true

        this.brightness = state

        const response = await this.xapi.query('StatusControlFunction/controlDevice', [this.zone, this.device?.id, this.brightness.toString()])

        if (response?.status === 'ok') {
          this.brightnessInProgress = false
          this.wasActiveFunc()
        }
      })
      .onGet(async () => {
        this.wasActiveFunc()

        return this.brightness
      });
  }
}

module.exports = DimActuator