from earsketch import *

init()
setTempo(120)

# Generated by putting this snippet in applyeffects.ts:
# let s = "EFFECTS = {\n"
# for (const [name, effect] of Object.entries(EFFECT_MAP)) {
#     s += `    ${name}: {\n`
#     for (const [param, info] of Object.entries(effect.DEFAULTS)) {
#         if (param !== "BYPASS") {
#             s += `        ${param}: (${info.min}, ${info.value}, ${info.max}),\n`
#         }
#     }
#     s += '    },\n'
# }
# s += "}"
# console.log(s)

EFFECTS = {
    VOLUME: {
        GAIN: (-60, 0, 12),
    },
    DELAY: {
        DELAY_TIME: (0, 300, 4000),
        DELAY_FEEDBACK: (-120, -5, -1),
        MIX: (0, 0.5, 1),
    },
    FILTER: {
        FILTER_FREQ: (20, 1000, 20000),
        FILTER_RESONANCE: (0, 0.8, 1),
        MIX: (0, 1, 1),
    },
    COMPRESSOR: {
        COMPRESSOR_THRESHOLD: (-30, -18, 0),
        COMPRESSOR_RATIO: (1, 10, 100),
    },
    PAN: {
        LEFT_RIGHT: (-100, 0, 100),
    },
    BANDPASS: {
        BANDPASS_FREQ: (20, 800, 20000),
        BANDPASS_WIDTH: (0, 0.5, 1),
        MIX: (0, 1, 1),
    },
    EQ3BAND: {
        EQ3BAND_LOWGAIN: (-24, 0, 18),
        EQ3BAND_LOWFREQ: (20, 200, 20000),
        EQ3BAND_MIDGAIN: (-24, 0, 18),
        EQ3BAND_MIDFREQ: (20, 200, 20000),
        EQ3BAND_HIGHGAIN: (-24, 0, 18),
        EQ3BAND_HIGHFREQ: (20, 200, 20000),
        MIX: (0, 1, 1),
    },
    CHORUS: {
        CHORUS_LENGTH: (1, 15, 250),
        CHORUS_NUMVOICES: (1, 1, 8),
        CHORUS_RATE: (0.1, 0.5, 16),
        CHORUS_MOD: (0, 0.7, 1),
        MIX: (0, 1, 1),
    },
    FLANGER: {
        FLANGER_LENGTH: (0, 6, 200),
        FLANGER_FEEDBACK: (-80, -50, -1),
        FLANGER_RATE: (0.001, 0.6, 100),
        MIX: (0, 1, 1),
    },
    PHASER: {
        PHASER_RATE: (0, 0.5, 10),
        PHASER_FEEDBACK: (-120, -3, -1),
        PHASER_RANGEMIN: (40, 440, 20000),
        PHASER_RANGEMAX: (40, 1600, 20000),
        MIX: (0, 1, 1),
    },
    TREMOLO: {
        TREMOLO_FREQ: (0, 4, 100),
        TREMOLO_AMOUNT: (-60, -6, 0),
        MIX: (0, 1, 1),
    },
    DISTORTION: {
        DISTO_GAIN: (0, 20, 50),
        MIX: (0, 0.5, 1),
    },
    PITCHSHIFT: {
        PITCHSHIFT_SHIFT: (-12, 0, 12),
        MIX: (0, 1, 1),
    },
    RINGMOD: {
        RINGMOD_MODFREQ: (0, 40, 100),
        RINGMOD_FEEDBACK: (0, 0, 100),
        MIX: (0, 1, 1),
    },
    WAH: {
        WAH_POSITION: (0, 0, 1),
        MIX: (0, 1, 1),
    },
    REVERB: {
        REVERB_TIME: (0, 3500, 4000),
        REVERB_DAMPFREQ: (200, 8000, 18000),
        MIX: (0, 1, 1),
    },
}

num_params = sum(len(d) for d in EFFECTS.values())

fitMedia(ELECTRO_ANALOGUE_LEAD_012, 1, 1, 1 + num_params * 2)
measure = 1
for effect, params in EFFECTS.items():
    setEffect(1, effect, BYPASS, 1, 1, 1, measure)
    setEffect(1, effect, BYPASS, 1, measure, 0, measure)
    for param, (min, default, max) in params.items():
        setEffect(1, effect, param, default, 1, default, measure)
        setEffect(1, effect, param, min, measure, max, measure + 2)
        setEffect(1, effect, param, default, measure + 2, default, measure + 2)
        measure += 2
    setEffect(1, effect, BYPASS, 0, measure, 1, measure)

finish()
