var config={
	mqttServer:'mqtt://localhost',  // optional, default to run mosca in this process
	siteId:'jest',
	username:'',
	password:'',
	allowedSites:['default','demo'],
	services: {
		HermodSpeakerService: {
		}
		
	}
}

module.exports = config;
