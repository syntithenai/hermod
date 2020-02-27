var mosca = require("mosca");

// mosca --credentials ./credentials.json --authorize-publish hermod/browser_demo/# --authorize-subscribe hermod/browser_demo/# adduser demo demo123
var fs = require("fs");
var Authorizer = require("mosca/lib/authorizer");

function loadAuthorizer(credentialsFile, cb) {
	console.log('setup mosca load auth '+credentialsFile);
	if (credentialsFile) {
		fs.readFile(credentialsFile, function(err, data) {
			if (err) {
				cb(err);
				return;
			}

			var authorizer = new Authorizer();

			try {
				authorizer.users = JSON.parse(data);
				cb(null, authorizer);
			} catch(err) {
				cb(err);
			}
		});
	} else {
		cb(null, null);
	}
}

function setup() {
	//// setup authorizer
	console.log('setup mosca');
	//loadAuthorizer("./credentials.json", function(err, authorizer) {
	    //console.log(['setup mosca authorizer',authorizer,authorizer.users.admin]);
	    //if (err) {
		   //console.log(err);
		    //// handle error here
	    //}

	    //if (authorizer) {
		    ////server.authenticate = function(client, username, password, callback) {
			  ////callback(null, true);
			////}
			////server.authenticate = authorizer.authenticate;
		    //////server.authorizeSubscribe = function(client, topic, callback) {
				//////callback(null,true);
				////////let result = authorizer.authorizeSubscribe(client, topic, callback);
			//////}
			////server.authorizeSubscribe = authorizer.authorizeSubscribe;
		    ////server.authorizePublish = function(client, topic, payload, callback) {
				////callback(null,true);
				//////let result = authorizer.authorizeSubscribe(client, topic, callback);
			////}
		    //////server.authorizePublish = authorizer.authorizePublish;
	    //}
	//});

    // you are good to go!
}

var server = new mosca.Server({
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

server.on('ready', setup);

