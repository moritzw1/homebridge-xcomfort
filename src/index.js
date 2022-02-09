import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import XcomfortPlatform from './platform';

/**
 * This method registers the platform with Homebridge
 */
module.exports = function (api) {
  api.registerPlatform(PLATFORM_NAME, XcomfortPlatform);
}