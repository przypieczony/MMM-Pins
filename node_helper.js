'use strict';

/* Magic Mirror
 * Module: MMM-Pins
 *
 * MIT Licensed.
 */

const NodeHelper = require('node_helper');
const Gpio = require('onoff').Gpio;
const fs = require('fs');
const path = require('path');

module.exports = NodeHelper.create({
  start: function () {
        this.started = false;
},

  socketNotificationReceived: function(notification, payload) {
	const self = this
    if (notification === 'PIN_CONFIG' && self.started === false) {
	  let pinConfigs = payload;
	  if (Gpio.accessible) {
		self.gpio = []
		for (let index = 0; index < pinConfigs.length; ++index) {
			let pinConfig = pinConfigs[index];
          	self.gpio[String(pinConfig.pin)] = new Gpio(pinConfig.pin, pinConfig.direction);
		}
	  }
	  self.started = true;				
	}
    else if (notification === 'TOGGLE_PIN') {     
		let pinNumber = payload;	  
		let pin = self.gpio[String(pinNumber)];
		let value = pin.readSync();
		if (value !== 1) {
			value = 1;
		}
		else{
			value = 0;
		}
		pin.writeSync(value);
		console.log(`Pin ${pinNumber} switched to ${value}`);
    } else if (notification === 'SET_PIN_STATE') {
        let pinNumber = payload.pinNumber;
        let desiredState = payload.state;
        // If unblocOnNotification is set
        if (payload.unblockOnNotification != "undefined") {
            // Check if lock for it already exists
            console.log(path.join(__dirname,pinNumber + "-pin.lock"));
            let lockFile = path.join(__dirname, pinNumber + "-pin.lock");
            if (!fs.existsSync(lockFile)) {
                // If not create it
                fs.writeFile(lockFile, payload.unblockOnNotification, function (err) {
                    if (err) throw err;
                })
            }
        } else {
            // if lockfile exists
            if (fs.existsSync(path.join(__dirname, pinNumber + "-pin.lock"))) {
                let unblockNotification = fs.readFileSync(lockFile);
                // if do contain unblockOnNotification notification
                if (payload.unblockNotification == unblockNotification) {
                    // do change state
                    let pin = self.gpio[String(pinNumber)];
                    pin.writeSync(("low" === desiredState) ? 1:0);
                    console.log(`Pin ${pinNumber} switched to ${desiredState}`);
                }
            } else {
                // do change state
                let pin = self.gpio[String(pinNumber)];
                pin.writeSync(("low" === desiredState) ? 1:0);
                console.log(`Pin ${pinNumber} switched to ${desiredState}`);
            }
        }
    }
  }
  
});
