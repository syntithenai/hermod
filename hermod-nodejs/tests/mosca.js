var mosca = require("mosca");

var fs = require("fs");
var server = null;

function startMosca() {
	return new Promise(function(resolve,reject) {
		server = new mosca.Server({
		  //secure: {
			   //port: 8443,
			//keyPath: '../key.pem',
			//certPath: '../certificate.pem',  
		  //},
		  http: {
			port: 9001,
			bundle: true,
			static: './'
		  }
		}); 
		server.on('ready', function() {resolve()} );
	})
}

function stopMosca() {
	if (server && server.close) server.close();
}

module.exports={startMosca : startMosca, stopMosca : stopMosca}


