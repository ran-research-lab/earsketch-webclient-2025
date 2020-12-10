/**
 * Waveform cache service.
 *
 * @module WaveforrmCache
 * @author Taka
 */
app.service('WaveformCache', function () {
    var CACHE = {};

    function clear() {
        CACHE = {};
    }

    function prepKey(clip) {
        return clip.filekey + '-' + clip.start + '-' + clip.end;
    }

    function checkIfExists(clip) {
        return prepKey(clip) in CACHE;
    }

    function logCurve(val, factor) {
        factor = factor <= 1 ? 1.000001 : factor;
        return (Math.log(val * (factor - 1.) + 1.)) / (Math.log(factor));
    }

    function normalize(waveform) {
        var max = waveform.reduce(function (a, b) { return Math.max(a, b); });
        var maxLog = logCurve(max, 5);
        return waveform.map(function (v) { return v / maxLog * 0.8; });
    }

    function add(clip, waveform) {
        CACHE[prepKey(clip)] = normalize(waveform);
    }

    function get(clip) {
        return CACHE[prepKey(clip)];
    }

    return {
        clear: clear,
        checkIfExists: checkIfExists,
        add: add,
        get: get
    }
});

