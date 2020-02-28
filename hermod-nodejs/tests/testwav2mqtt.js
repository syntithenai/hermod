var mqtt2wav = require('./mqtt2wav')
var mqtt = require("./mqttconnect");
var config = require('./config')
var wav2mqtt = require('./wav2mqtt')
var mqtt2wav = require('./mqtt2wav')

mqtt.startMoscaAndConnect(config).then(function(client) {
	wav2mqtt.start(client,'jest','./bumblebee.wav')
})
