import {NUMBERS_AUDIOKEYS} from 'numbersAudiokeys';
import {AUDIOKEYS_RECOMMENDATIONS} from 'audiokeysRecommendations';
/**
 * Autograder addition to main ES live testing.
 *
 * @author Jason Smith
 */
app.factory('recommender', ['esconsole', 'reader', function (esconsole, reader) {

	var PAGE_LOADED = false;

	// Load list of audiokeys
    var AUDIOKEYS = Object.values(NUMBERS_AUDIOKEYS);

	function addRecInput(recInput, script) {
        // Generate list of input samples
        if (script) {
            var lines = script.source_code.split('\n');
            for (var line = 0; line < lines.length; line++) {
                for (var idx = 0; idx < AUDIOKEYS.length; idx++) {
                    var name = AUDIOKEYS[idx];
                    // exclude makebeat
                    if (name.slice(0,3) !== 'OS_') {
                        if (lines[line].includes(name) &&  !recInput.includes(name)) {
                            // exclude comments
                            if (lines[line].indexOf('#') === -1 || lines[line].indexOf(name) < lines[line].indexOf('#')) {
                                recInput.push(name);
                            }
                        }
                    }
                }
            }
        }
        return recInput;
    };


    function recommend(recommendedSounds, input_samples, co_usage, similarity) {
        // amount of recommendations per category
        var best_limit = 3;

        // Generate recommendations for each input sample and add together
        var recs = {};
        for (var idx = 0; idx < input_samples.length; idx++) {
            var audioNumber = Object.keys(NUMBERS_AUDIOKEYS).find(n => NUMBERS_AUDIOKEYS[n] === input_samples[idx]);
            if (audioNumber === undefined) {
                break;
            }
            var audioRec = AUDIOKEYS_RECOMMENDATIONS[String(audioNumber)];
            for (var num in audioRec) {
                if (!audioRec.hasOwnProperty(num)) {
                    throw new Error('Error enumerating the recommendation audioKeys');
                }
                var value = audioRec[num];
                var valA = value[0];
                var valB = value[1];
                var valC = value[2];
                var full_val =  valA+co_usage*valB+similarity*valC;
                var key = NUMBERS_AUDIOKEYS[num];

                if (Object.keys(recs).includes(key))
                    recs[key] = (full_val+recs[key])/1.41;
                else
                    recs[key] = full_val;
            }
        }

        if (input_samples.length > 0) {
            var i = 0;
            while (i < best_limit) {
                var maxRec = _.max(Object.keys(recs), function (o) { return recs[o]; });

                if (maxRec === -Infinity || maxRec === undefined) {
                    break;
                }

                if (!recommendedSounds.includes(maxRec) && !input_samples.includes(maxRec) && maxRec.slice(0,3) !== 'OS_') {
                    recommendedSounds.push(maxRec);
                    i += 1;
                }
                delete recs[maxRec];
            }
        }
        return recommendedSounds;
    };



  return {
  	recommend: recommend,
  	addRecInput: addRecInput,
  };

}]);



