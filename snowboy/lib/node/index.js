"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream = require("stream");
const path = require("path");
const fs = require("fs");
const binary = require("node-pre-gyp");
const bindingPath = binary.find(path.resolve(path.join(__dirname, '../../package.json')));
const SnowboyDetectNative = require(bindingPath).SnowboyDetect;
var DetectionResult;
(function (DetectionResult) {
    DetectionResult[DetectionResult["SILENCE"] = -2] = "SILENCE";
    DetectionResult[DetectionResult["ERROR"] = -1] = "ERROR";
    DetectionResult[DetectionResult["SOUND"] = 0] = "SOUND";
})(DetectionResult || (DetectionResult = {}));
var ModelType;
(function (ModelType) {
    ModelType[ModelType["PMDL"] = 0] = "PMDL";
    ModelType[ModelType["UMDL"] = 1] = "UMDL";
})(ModelType || (ModelType = {}));
class HotwordModels {
    constructor() {
        this.models = [];
    }
    add(model) {
        model.hotwords = [].concat(model.hotwords);
        model.sensitivity = model.sensitivity || "0.5";
        if (fs.existsSync(model.file) === false) {
            throw new Error(`Model ${model.file} does not exists.`);
        }
        const type = path.extname(model.file).toUpperCase();
        if (ModelType[type] === ModelType.PMDL && model.hotwords.length > 1) {
            throw new Error('Personal models can define only one hotword.');
        }
        this.models.push(model);
        this.lookupTable = this.generateHotwordsLookupTable();
    }
    get modelString() {
        return this.models.map((model) => model.file).join();
    }
    get sensitivityString() {
        return this.models.map((model) => model.sensitivity).join();
    }
    lookup(index) {
        const lookupIndex = index - 1;
        if (lookupIndex < 0 || lookupIndex >= this.lookupTable.length) {
            throw new Error('Index out of bounds.');
        }
        return this.lookupTable[lookupIndex];
    }
    numHotwords() {
        return this.lookupTable.length;
    }
    generateHotwordsLookupTable() {
        return this.models.reduce((hotwords, model) => {
            return hotwords.concat(model.hotwords);
        }, new Array());
    }
}
exports.HotwordModels = HotwordModels;
class SnowboyDetect extends stream.Writable {
    constructor(options) {
        super();
        this.models = options.models;
        this.nativeInstance = new SnowboyDetectNative(options.resource, options.models.modelString);
        if (this.nativeInstance.NumHotwords() !== options.models.numHotwords()) {
            throw new Error('Loaded hotwords count does not match number of hotwords defined.');
        }
        this.nativeInstance.SetSensitivity(options.models.sensitivityString);
        if (options.audioGain) {
            this.nativeInstance.SetAudioGain(options.audioGain);
        }
        if (options.applyFrontend) {
            this.nativeInstance.ApplyFrontend(options.applyFrontend);
        }
        if (options.highSensitivity) {
            this.nativeInstance.SetHighSensitivity(options.highSensitivity);
        }
    }
    reset() {
        return this.nativeInstance.Reset();
    }
    runDetection(buffer) {
        const index = this.nativeInstance.RunDetection(buffer);
        this.processDetectionResult(index, buffer);
        return index;
    }
    setSensitivity(sensitivity) {
        this.nativeInstance.SetSensitivity(sensitivity);
    }
    setHighSensitivity(highSensitivity) {
        this.nativeInstance.SetHighSensitivity(highSensitivity);
    }
    getSensitivity() {
        return this.nativeInstance.GetSensitivity();
    }
    setAudioGain(gain) {
        this.nativeInstance.SetAudioGain(gain);
    }
    updateModel() {
        this.nativeInstance.UpdateModel();
    }
    numHotwords() {
        return this.nativeInstance.NumHotwords();
    }
    sampleRate() {
        return this.nativeInstance.SampleRate();
    }
    numChannels() {
        return this.nativeInstance.NumChannels();
    }
    bitsPerSample() {
        return this.nativeInstance.BitsPerSample();
    }
    _write(chunk, encoding, callback) {
        const index = this.nativeInstance.RunDetection(chunk);
        this.processDetectionResult(index, chunk);
        return callback();
    }
    processDetectionResult(index, buffer) {
        switch (index) {
            case DetectionResult.ERROR:
                this.emit('error');
                break;
            case DetectionResult.SILENCE:
                this.emit('silence');
                break;
            case DetectionResult.SOUND:
                this.emit('sound', buffer);
                break;
            default:
                const hotword = this.models.lookup(index);
                this.emit('hotword', index, hotword, buffer);
                break;
        }
    }
}
exports.SnowboyDetect = SnowboyDetect;
exports.Detector = SnowboyDetect;
exports.Models = HotwordModels;
