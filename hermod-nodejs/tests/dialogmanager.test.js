var mqtt = require("./mqttconnect");
var config = require('./config')
var wav2mqtt = require('./wav2mqtt')
var mqtt2wav = require('./mqtt2wav')
var setupTests = require('./setupTests')

var fs = require('fs')
var timeout = null;
beforeAll(setupTests);

afterAll(() => {
	return new Promise(function(resolve,reject) {
		if (mqtt && mqtt.disconnect) mqtt.disconnect()
		resolve()
	})
	clearTimeout(timeout)
})


