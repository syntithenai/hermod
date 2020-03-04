var HermodService = require('./HermodService')

var stream = require('stream') 
var Readable = stream.Readable;
var Wav = require('wav')
var kill  = require('tree-kill');	

	
class HermodPorcupineHotwordService extends HermodService  {

    constructor(props) {
        super(props);

		this.child = {};
		let that = this;
		let eventFunctions = {
            'hermod/+/hotword/activate' : function(topic,siteId,payload) {
				
				console.log('start python service')
				// start python hotword service
				that.child[siteId] = require('child_process').spawn( 'porcupine/bin/python' , ['./porcupine/hotword_exec.py','localhost','1883','jest', 'picovoice,porcupine,bumblebee']); //, '--keywords picovoice', '--site '+props.siteId 
				//var child = require('child_process').execFile( 'ls' , [ '-al' ]); 
				//var child = require('child_process').execFile( 'porcupine/bin/python' , [ './porcupine/test.py' ]); //, '--keywords picovoice', '--site '+props.siteId 
				
				// use event hooks to provide a callback to execute when data are available: 
				console.log('started python service')
				that.child[siteId].stdout.on('data', function(data) {
					console.log(data.toString()); 
				});
				that.child[siteId].stderr.on('data', function(data) {
					console.log(data.toString()); 
				});

			}
		    ,
		    'hermod/+/hotword/deactivate' : function(topic,siteId,payload) {
				//console.log('stop python service')
				if (parseInt(that.child[siteId]) > 0) kill(parseInt(that.child[siteId]))
		    }
        }
		
        this.manager = this.connectToManager('HOTWORD',props.manager,eventFunctions);

	}
}
module.exports=HermodPorcupineHotwordService
  
