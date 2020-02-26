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

  lockPin: function(payload) {
	  var self = this
	  let pinNumber = payload.pinNumber
	  let pin = self.gpio[String(pinNumber)];
	  let releaseNotification = payload.unblockOnNotification
	  let lockFile = path.join(__dirname, pinNumber + "-pin.lock");

	  if (releaseNotification != undefined) {
		if (!fs.existsSync(lockFile)) {
                	fs.writeFile(lockFile, releaseNotification, function (err) {
                    		if (err) throw err;
               		})
			return true;
		}
	  } else {
		// Pin already locked or no need to lock it
		return false;
	  }
  },

  getLockFile: function(lockFile) {
    	if (fs.existsSync(lockFile)) {
		return fs.readFileSync(lockFile);
	} else {
		return false
	}
  },

  togglePin: function(pinNumber) {
	var self = this
	let pin = self.gpio[String(pinNumber)];
	let value = pin.readSync();
	if (value !== 1) {
		value = 1;
	} else {
		value = 0;
	}
	pin.writeSync(value);
	console.log(`Pin ${pinNumber} switched to ${value}`);
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
		let pinNumber = payload.pinNumber;
	        let incomingNotification = payload.notification
	        let lockFile = path.join(__dirname, pinNumber + "-pin.lock");
	        if (self.lockPin(payload)) {
			self.togglePin(pinNumber);
                    	console.log(`Pin ${pinNumber} locked`);
		} else {
			let releaseNotification = self.getLockFile(lockFile)
			if (releaseNotification == incomingNotification) {
				self.togglePin(pinNumber);
				fs.unlinkSync(lockFile);
                    		console.log(`Pin ${pinNumber} released`);
			} else if (! releaseNotification) {
				self.togglePin(pinNumber);
			}
		}
    } else if (notification === 'SET_PIN_STATE') {
        let pinNumber = payload.pinNumber;
        let desiredState = payload.state;
        let lockFile = path.join(__dirname, pinNumber + "-pin.lock");
	let incomingNotification = payload.notification
	let pin = self.gpio[String(pinNumber)];

        // If unblocOnNotification is set
	if (self.lockPin(payload)) {
		pin.writeSync(("low" === desiredState) ? 1:0);
                console.log(`Pin ${pinNumber} switched to ${desiredState} and locked`);
        } else {
	    let releaseNotification = self.getLockFile(lockFile)
	    // if content of lockFile equals to incoming notification...
            if (incomingNotification == releaseNotification) {
                    // ...do change state...
                    pin.writeSync(("low" === desiredState) ? 1:0);
		    // ...and remove lockFile
		    fs.unlinkSync(lockFile);
                    console.log(`Pin ${pinNumber} switched to ${desiredState} and released`);
            } else if (! releaseNotification) {
                // do change state
                pin.writeSync(("low" === desiredState) ? 1:0);
                console.log(`Pin ${pinNumber} switched to ${desiredState}`);
            }
        }
    }
  }
});
