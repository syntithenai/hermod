var config={
	//mqttServer:'wss://hermod.syntithenai.com',  // optional, default to run mosca in this process
	mqttServer:'ws://localhost',
	siteId:'default',
	username:'admin',
	password:'admin',
	allowedSites:['default','demo'],
	services: {
		HermodMicrophoneService: {
			
		}
		,
		HermodSpeakerService: {
		}
		,
		HermodTtsService: {
		}
		//,
		//HermodHotwordService: {
			//hotwords: {
				//'bumblebee': 'path/to/keyword.ppn',
				//'hey_edison': 'path/to/..',
			//}
		//}
		//,
		//HermodDeepSpeechAsrService: {
			 //model: "default",
			 //timeout: 5000,
			 ////These constants control the beam search decoder
			 ////These constants are tied to the shape of the graph used (changing them changes
			 ////the geometry of the first layer), so make sure you use the same constants that
			 ////were used during training
			//BEAM_WIDTH : 1024, //500, // Beam width used in the CTC decoder when building candidate transcriptions
			//LM_ALPHA : 0.75, // The alpha hyperparameter of the CTC decoder. Language Model weight
			//LM_BETA : 1.85, // The beta hyperparameter of the CTC decoder. Word insertion bonus.
			//N_FEATURES : 26, // Number of MFCC features to use
			//N_CONTEXT : 9, // Size of the context window used for producing timesteps in the input vector
			//files: {
				//model :"../deepspeech-model/models/output_graph.pbmm",
				//alphabet: "../deepspeech-model/models/alphabet.txt",
				//lm: "../deepspeech-model/models/lm.binary",
				//trie: "../deepspeech-model/models/trie"
			//},
			//maxProcesses: 2
		//}
		
		//,
		//HermodDialogManagerService: {
		//}
	}
}

module.exports = config;
