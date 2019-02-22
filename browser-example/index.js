const express = require('express');
const proxy = require('http-proxy-middleware')
const path = require('path');
const fs = require('fs'),
    http = require('http'),
    https = require('https')
const mosca = require("mosca");

let app = express();

// An api endpoint that returns a short list of items
app.get('/api/getList', (req,res) => {
	var list = ["item1", "item2", "item3"];
	res.json(list);
	console.log('Sent list of items');
});

//// Handles any requests that don't match the ones above
//app.get('*', (req,res) =>{
	//res.sendFile(path.join(__dirname+'/client/build/index.html'));
//});

// Development, proxy to local create-react-app
app.use('/', proxy({ target: 'http://localhost:3000' }))
// production - Serve the static files from the React app
//app.use(express.static(path.join(__dirname, 'client/build')));



var options = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./certificate.pem'),
};
let port='443'
var webServer = https.createServer(options, app).listen(port, function(){
  console.log("Express server listening on port " + port);
});

var moscaServer = new mosca.Server({
  secure: {
	port: 8443,
    keyPath: './key.pem',
    certPath: './certificate.pem',  
  },
  allowNonSecure: true
  //,
  //https: {
    //port: 443,
    //bundle: true
   //// ,
  ////  static: './build'
  //}
});
// setup authentication 
//moscaServer.on('ready', setup);

moscaServer.attachHttpServer(webServer);

//app.listen(port);

console.log('App is listening on port ' + port);



// mosca --credentials ./credentials.json --authorize-publish hermod/browser_demo/# --authorize-subscribe hermod/browser_demo/# adduser demo demo123
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
	//console.log('setup mosca');
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

