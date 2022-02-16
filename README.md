# homebridge-xcomfort

[![Npm package version](https://badgen.net/npm/v/homebridge-xcomfort)](https://npmjs.com/package/homebridge-xcomfort)
[![Npm package total downloads](https://badgen.net/npm/dt/homebridge-xcomfort)](https://www.npmjs.com/package/homebridge-xcomfort)

`homebridge-xcomfort` is a [Homebridge](https://homebridge.io) plugin that exposes Eaton Xcomfort devices to [Apple's](https://www.apple.com) [HomeKit](https://www.apple.com/ios/home) smart home platform.

:heart: This plugin would not be possible without the great Javascript plugin from [oanylund](https://github.com/oanylund/xcomfort-shc-api#readme)!


## Prerequisites

* [SHC](https://www.eaton.com/de/en-gb/catalog/residential/xcomfort-smart-home-controller.html) - Smart Home Controller in your local network (it does not support the round bridge)
* [Homebridge Instance](https://github.com/homebridge/homebridge/wiki) - Running in the same network as the SHC

## Installation Instructions

#### Option 1: Install via Homebridge Config UI X

Search for "xcomfort" in [homebridge-config-ui-x](https://github.com/oznu/homebridge-config-ui-x) and install `homebridge-xcomfort`.

#### Option 2: Manually Install

```sh
sudo npm install -g homebridge-xcomfort
```

## Supported Devices

* [CRCA-00](https://www.eaton.com/de/en-gb/catalog/residential/xcomfort-room-controller-touch.html) - Room Controller Touch (Humidity, Temperature, Brightness)
* [CDAx-01/0x](https://www.eaton.com/de/en-gb/catalog/residential/xcomfort-actuators.html) - Dimming Actuator (On/Off, Brightness)
* [CSAU-01/01-1x](https://www.eaton.com/de/en-gb/catalog/residential/xcomfort-actuators.html) - Switch Actuator (On/Off)

## Configuration

### Example

Enter the required data on the config-ui (recommended) or add it to your config file:

```json
{
  "ip": "192.168.2.100",
  "user": "admin",
  "password": "password",
  "zone": "14",
  "platform": "Xcomfort"
}
```

* **platform** (mandatory): the name of the plugin
* **ip** (mandatory): IP Address of the Smart Home Controller in your local network. You can find this in your Router menu
* **user** (mandatory): A user that you can create in the SHC menu.
* **password** (mandatory): Password of the user
* **zone** (mandatory): Please create a new Zone and add all the devices you want to control with HomeKit to this zone. Then go to tab '3 Advanced' -> tab 'Functions' -> Select your new created zone and enable the checkmark for 'Status and Switch'. Scroll down and you can see 'Latest action' at the bottom of the page. There is your zone (e.g. hz_14). Enter only the number: 14
* *intervalActive* (optional): The interval for the homebridge to fetch new data from the SHC. (Default: 15)
* *intervalSleep* (optional): This plugin will go to 'Sleep mode' and decrease the requests to the SHC after 5 Minutes of inactivity on the Home app. (Default: 60)

## Known issues

It is most often seen with the Brightness slider -> as you slide, the Home app will send numerous Brightness values, resulting in numerous event executions and flickering of the lights. If you slide faster it won't be a big issue.