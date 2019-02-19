var functions = {
		'joke_tell_me_a_joke': function(siteId,action,slots) {
			let that = this;
			return new Promise(function(resolve,reject) {
				console.log(['IN ACTION - tell a joke',siteId,action,slots]);
				that.sendMqtt('hermod/'+siteId+'/tts/say',{text:'this is a joke'});
				let callbacks = {}
				callbacks['hermod/'+siteId+'/tts/finished'] = function() {
					console.log('GOT TTS FINSIH NOW RESOLVE ACTION');
					resolve();
				}
				console.log('BIND ACTION CALLBACKS');
					
				// automatic cleanup after single message with true parameter
				that.manager.addCallbacks('jokeaction',callbacks,true,false,siteId)
				
			});
		}	
}

module.exports = functions;


