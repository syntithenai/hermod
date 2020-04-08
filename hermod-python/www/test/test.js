
console.log('hi')

//var mqtt = require('mqtt')

var fs = require("fs");
//var get = require("browser-get")
var path = require("path");
var test = require('tape');
var HermodWebClient = require('../');
//http://www.nch.com.au/acm/8k16bitpcm.wav
var config = {
    server: "ws://jest:hermod@localhost:9001",
    subscribe: "hermod/jest/#",
    hotwordsensitivity : 0.9
}
var testwav = fs.readFileSync('./test/audio/test.wav')
var hotwordwav = fs.readFileSync('./test/audio/oklamp.wav')
var client = HermodWebClient(config)


//const wavDummy = require('wav-dummy');

// Generates a 10 second stereo wav file with a 44.1kHz sample rate
//var testwav =  null //wavDummy(10, 1, 44100)
//const axios = require('axios');
 
//// Make a request for a user with a given ID
//axios.get('http://www.nch.com.au/acm/8k16bitpcm.wav')
  //.then(function (response) {
    //// handle success
    //console.log(response);
  //})
  //.catch(function (error) {
    //// handle error
    //console.log(error);
  //})


//var request = require('browser-request')
//request({method:'GET', url:'http://192.168.1.192:40647/test.wav',withCredentials:false}, function(er, res) {
  //if(!er)
    //return console.log('browser-request got your root path:\n' + res.body)
 
  //console.log('There was an error, but at least browser-request loaded and ran!')
  //throw er
//})

//get('http://www.nch.com.au/acm/8k16bitpcm.wav').then(function(testwav) {
//get('http://google.com').then(function(testwav) {

    //test('connect', function (t) {
        //client.connect().then(function() {
            //console.log('connected in test')
            //console.log(client.disconnect)
            //client.disconnect()
            //t.pass('yay')
            //t.end()
        //})
    //})
    
    test('speaker play', function (t) {
        t.plan(1)
        console.log('sp play')
        client.connect().then(function() {
            client.sendAndWaitFor('hermod/jest/speaker/play',testwav,'hermod/jest/speaker/finished').then(function() {
                console.log('done wait')
                client.disconnect()
                t.pass('yay')
                t.end()
            });
        })
    })

   
    //test('microphone audio', function (t) {
        //t.plan(1)
        //console.log('mic audio test')
        //client.connect().then(function() {
            //client.sendAndWaitFor('hermod/jest/microphone/start',JSON.stringify({}),'hermod/jest/microphone/audio').then(function() {
                //console.log('done wait')
                //client.disconnect()
                //t.pass('yay')
                //t.end()
            //});
        //})
    //})

    // TODO PICOVOICE LOCAL AUDIO MEANS I WOULD NEED TO PLAY THROUGH SPEAKER TO TRIGGER HOTWORD
    
    //test('hotword detected', function (t) {
        //t.plan(1)
        //console.log('hotword test')
        //client.connect().then(function() {
            ////client.sendMessage(['hermod/jest/microphone/start',JSON.stringify({}))
            //client.sendMessage('hermod/jest/hotword/activate',JSON.stringify({}))
            //client.sendMessage('hermod/jest/hotword/start',JSON.stringify({}))
            //console.log('hotword test started')
        
            //setTimeout(function() {
                //console.log('SEND AUDIO FOR HOITWORDUI')
                //client.sendAudioAndWaitFor('jest',hotwordwav,'hermod/jest/hotword/detected').then(function() {
                    //console.log('done wait')
                    //client.disconnect()
                    //t.pass('yay')
                    //t.end()
                //})
            //},5000);
        //})
    //})

