// global constant usually defined in main.js but defined here since
// tests don't use require
var SITE_BASE_URI = location.origin + '/base';
var BUILD_NUM = 0;

// Visibility for Amazon Contest 2019 UI
var SHOW_AMAZON = true;

// Common sound clips visibility.
var SHOW_COMMON = false;

// A new script compiler behavior that does not rely on the sound clip names in the interpreter scope.
var LAZY_SCRIPT_COMPILER = true;

// Global variables for testing the SOX vs Kali time stretching algorithms on DEV.
var USER_CLIENT_TS = false;
var TS_QUICK_SEARCH = true;
var CACHE_TS_RESULTS = true;

var customMatchers = {

    toMatchResult: function(util, customEqualityTesters) {
        return {
            compare: function(actual, expected, script) {
                result = matchResult(actual, expected);
                if (!result.pass) {
                    result.message +='\nScript:\n\n';
                    result.message += script;
                }
                return result
            }
        };
    }
};

/**
 * A custom Jasmine matcher that matches compiler result outputs. Does not
 * check every key intentionally. Only the ones of importance.
 *
 * @param {Object} actual The actual result to be tested.
 * @param {Object} expected The expected result to be tested against.
 * @returns true if actual is similar to expected
 */
function matchResult(actual, expected) {

    if (actual.tempo !== expected.tempo) {
        return {
            pass: false,
            message: 'Expected tempo: ' + expected.tempo + '\n'
                   + 'Actual tempo: ' + actual.tempo
        }
    }

    if (actual.length !== expected.length) {
        return {
            pass: false,
            message: 'Expected length: ' + expected.length + '\n'
                   + 'Actual length: ' + actual.length
        }
    }

    // exclude metronome
    var actualTracks = actual.tracks.slice(0,-1)

    if (actualTracks.length !== expected.tracks.length) {
        return {
            pass: false,
            message: 'Number of expected tracks: ' + expected.tracks.length + '\n'
                   + 'Actual number of tracks: ' + actualTracks.length
        }
    }

    for (var track in actualTracks) {
        var actualTrack = actualTracks[track];
        var expectedTrack = expected.tracks[track];

        var actualClips = actualTrack.clips.sort(sortClips);
        var expectedClips = expectedTrack.clips.sort(sortClips);

        console.log(JSON.stringify(actualClips));
        console.log('--------------');
        console.log(JSON.stringify(expectedClips));

        if (!checkSimilarity(actualClips, expectedClips)) {
            return {
                pass: false,
                message: 'Differing track ' + track + '.\n'
                       + 'Expected:\n\n' + JSON.stringify(expectedTrack) + '\n\n'
                       + 'Actual:\n\n' + JSON.stringify(actualTrack) + '\n\n'
            };
        }

        if (expectedTrack.effects !== undefined
        && actualTrack.effects !== undefined) {
            if (!checkSimilarity(actualTrack.effects, expectedTrack.effects)) {
                return {
                    pass: false,
                    message: 'Differing effects on track ' + track + '.\n'
                       + 'Expected:\n\n' + JSON.stringify(expectedTrack.effects) + '\n\n'
                       + 'Actual:\n\n' + JSON.stringify(actualTrack.effects) + '\n\n'
                }
            }
        }

    }

    return {
        pass: true,
        message: 'Results are similar.'
    }

}

/**
 * Sort clips by start measure.
 */
function sortClips(a, b) {
    return a.measure - b.measure;
}

/**
 * Looks to see if the actual object contains
 * the same keys with the same values as the expected object. Additional keys
 * that might be in the actual object are ignored.
 *
 * Used to test the compiler since there will be keys like "audio" that are too
 * much work to test. That is, we don't want a strict toEqual() match.
 *
 * @param {Object} actual The actual object to be tested.
 * @param {Object} expected The expected object to be tested against.
 * @returns true if actual is similar to expected
 */
function checkSimilarity(actual, expected) {
    var valid = true;

    // can't be equal if they're not the same type
    if (typeof(actual) !== typeof(expected)) {
        return false;
    }

    // check floats to within 0.01 margin of error
    if (typeof(actual) === 'number' && typeof(expected) === 'number' &&
        (actual % 1 !== 0 || expected % 1 !== 0))
    {
        var e = 0.01;
        return (expected - e <= actual && expected + e >= actual);
    }

    // check primitives
    if (!(actual instanceof Object && expected instanceof Object)) {
        return (actual === expected);
    }

    // recursively check objects
    // Only check keys that are expected, this check does not check for
    // extra keys that might be in the actual object
    for (var key in expected) {
        if (actual[key] === undefined) {
            return false;
        }
        if (!checkSimilarity(actual[key], expected[key])) {
            valid = false;
        }
    }

    return valid;
}
