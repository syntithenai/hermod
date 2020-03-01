var config={
	mqttServer:'mqtt://localhost',  // optional, default to run mosca in this process
	siteId:'jest',
	username:'',
	password:'',
	services: {
		//HermodMicrophoneService: {
			
		//}
		//,
		HermodSpeakerService: {
		}
		,
		HermodTtsService: {
		}
		,
		HermodPorcupineHotwordService: {
		}
		,
		HermodDeepSpeechAsrService: {
			 deepspeech_model_dir: "/projects/deepspeech-0.6.1-models/",
			 files: {
				model :"output_graph.pbmm",  // use .tflite on raspberry pi
				alphabet: "alphabet.txt",
				lm: "lm.binary",
				trie: "trie"
			}
		}
		,
		HermodDialogManagerService: {
		}
		
		
	}
}

module.exports = config;
