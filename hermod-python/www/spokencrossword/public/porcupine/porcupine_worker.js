/*
    Copyright 2018 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
*/

//PorcupineModule = require("./pv_porcupine.js");
//Porcupine = require("./porcupine.js");

//console.log(['inc export INCLUDE ',PorcupineModule,Porcupine])

//module.exports = function (self) {
//console.log(['inc export RUN ',PorcupineModule,Porcupine])

//var PorcupineModule = require("./pv_porcupine.js");
//var Porcupine = require("./porcupine.js");


//module.exports = function (self) {
    importScripts("pv_porcupine.js");
    importScripts("porcupine.js");

    onmessage = function (e) {
        switch (e.data.command) {
            case "init":
                init(e.data.keywordIDs, e.data.sensitivities);
                break;
            case "process":
                process(e.data.inputFrame);
                break;
            case "release":
                release();
                break;
        }
    };
   // hi
    let keywordIDArray;
    let keywords;
    let sensitivities;

    let porcupine = null;

    function init(keywordIDs, _sensitivities_) {
        keywordIDArray = Object.values(keywordIDs);
        keywords = Object.keys(keywordIDs);
        sensitivities = _sensitivities_;

        if (Porcupine.isLoaded()) {
            porcupine = Porcupine.create(keywordIDArray, sensitivities);
            postMessage({ready: true});
        }
    }

    function process(inputFrame) {
        if (porcupine == null && Porcupine.isLoaded()) {
            porcupine = Porcupine.create(keywordIDArray, sensitivities);
        } else if (porcupine != null) {
            let keywordIndex = porcupine.process(inputFrame);
            postMessage({keyword: keywordIndex === -1 ? null : keywords[keywordIndex]});
        }
    }

    function release() {
        if (porcupine !== null) {
            porcupine.release();
        }

        porcupine = null;
    }
//}
