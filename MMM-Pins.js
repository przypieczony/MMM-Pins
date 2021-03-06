/* global Module */

/* Magic Mirror
 * Module: MMM-Pins
 *
 * MIT Licensed.
 */

Module.register('MMM-Pins',{	
	requiresVersion: "2.1.0",
	defaults: {
		pinConfiguration: []		
	},	
	
	// Override notification handler.
	notificationReceived: function(notification, payload) {
		if(notification === "ALL_MODULES_STARTED"){
			this.sendSocketNotification('PIN_CONFIG', this.config.pinConfiguration)
			let payload = {
				module: this.name,
				path: "pins",
				actions: {}
			};
			for (let index = 0; index < this.config.pinConfiguration.length; ++index) {
				let pinConfig = this.config.pinConfiguration[index];
				payload.actions[pinConfig.notification] = {notification: pinConfig.notification, prettyName: pinConfig.prettyName};
			}
			Log.log(payload.module);
			Log.log(payload.actions.toString());
			this.sendNotification("REGISTER_API", payload);
			return;
		}
		for (let index = 0; index < this.config.pinConfiguration.length; ++index) {
                        let pinConfig = this.config.pinConfiguration[index];
			if(pinConfig.notification === notification){
                if (pinConfig.state == undefined) {
                    nodeConfig = {
                      "pinNumber": pinConfig.pin,
                      "unblockOnNotification": pinConfig.unblockOnNotification,
		      "notification": notification
                    }
				    this.sendSocketNotification("TOGGLE_PIN", nodeConfig);
                } else {
                    nodeConfig = {
                      "state" : pinConfig.state,
                      "pinNumber": pinConfig.pin,
                      "unblockOnNotification": pinConfig.unblockOnNotification,
		      "notification": notification
                    }
                    this.sendSocketNotification("SET_PIN_STATE", nodeConfig);
                }    
				if(pinConfig.sound){
					this.sendNotification('PLAY_SOUND', pinConfig.sound);
				}
				break;
			}
		}
	},	
	start: function() {
		Log.info('Starting module: ' + this.name);
	}
});
