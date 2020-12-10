/**
 * Created by anandmahadevan on 10/29/14.
 */
var Unit1_1_src = "\"\"\"\nSetup\n\"\"\"\nfrom earsketch import *\ninit()\nsetTempo(120)# variables\nintroScratch = HOUSE_MAIN_BEAT_001\nintroWhoosh = TECHNO_WHITENOISESFX_006\nintroDrumfill = ELECTRO_DRUM_MAIN_BEAT_003\ndrums1 = TECHNO_KICKROLL_001\nlead = ELECTRO_ANALOGUE_LEAD_013\nbass1 = TECHNO_ACIDBASS_008\nsynth1 = TECHNO_CLUBRICH_PAD_001\nfloor = TECHNO_MAINLOOP_018\ndrums2 = TECHNO_SNAREROLL_001\nsynth2 = DUBSTEP_FILTERCHORD_002\nplucks = TECHNO_SYNTHPLUCK_001\nbass2 = TECHNO_ACIDBASS_006\ndrumbreak =ELECTRO_DRUM_MAIN_BEAT_002\nvoxfx = EIGHT_BIT_VIDEO_SPEAKNSPELL_BEAT_007\nbeatHit = TECHNO_MAINLOOP_008\nbeatString = \"0---0---0--0-0-0\" # specifies a rhythmic pattern of 16th notes\n\n\"\"\"\nMusic\n\"\"\"\n# Intro\n\nfitMedia(synth2, 5, 1, 5)\nfitMedia(introScratch, 8, 1, 5)\nfitMedia(plucks, 9, 3, 5)\nfitMedia(introWhoosh, 10, 1.75, 5)\nfitMedia(introDrumfill, 6, 4, 5)\n\n# A Section (simplest version)\n\nfitMedia(drums1, 1, 5, 9)\nfitMedia(synth1, 2, 5, 9)\nfitMedia(lead, 11, 5, 9)\n\n# A Section (more parts added)\n\nfitMedia(drums1, 1, 9, 13) # plays all through section A (4 bars)\nfitMedia(synth1, 2, 9, 13)\nfitMedia(floor, 3, 9, 13)\nfitMedia(lead, 11, 9, 13)\nfitMedia(bass1, 12, 9.125, 13)\n\n# B Section (contrasting section)\n\nfitMedia(drums2, 1, 13, 17)\nfitMedia(drumbreak, 4, 13, 17)\nfitMedia(synth2, 5, 13, 17)\nfitMedia(plucks, 9, 13, 17)\nfitMedia(bass2, 13, 13, 17)\nmakeBeat(beatHit, 6, 13, beatString)\nmakeBeat(beatHit, 6, 15, beatString)\n\n# A Section (more parts added)\n\nfitMedia(drums1, 1, 17, 23)\nfitMedia(synth1, 2, 17, 23)\nfitMedia(floor, 3, 17, 23)\nfitMedia(lead, 11, 17, 23)\nfitMedia(bass1, 12, 17.125, 23)\nfitMedia(voxfx, 7, 17, 18)\nfitMedia(voxfx, 7, 19, 20)\nfitMedia(voxfx, 7, 21, 22)\nmakeBeat(beatHit, 6, 19, beatString)\nmakeBeat(beatHit, 6, 21, beatString)\n\n# Ending\n\nfitMedia(synth2, 5, 23, 24)\nfitMedia(voxfx, 7, 23, 24.9375)\nfitMedia(introDrumfill, 6, 23, 24.125)\n\n# effects\n\n# set volumes on tracks\nsetEffect(1, VOLUME, GAIN, 1.5) # setting volumes on some tracks to help move toward a good mix of all sounds\n# setEffect(2, VOLUME, GAIN, 0) # since the volume level of this track sounds good at 0, we don't need to call this (but we still could, with volume value 0 as shown)\nsetEffect(3, VOLUME, GAIN, -2)\nsetEffect(4, VOLUME, GAIN, 3)\nsetEffect(5, VOLUME, GAIN, -4.5)\nsetEffect(6, VOLUME, GAIN, -5.5)\nsetEffect(7, VOLUME, GAIN, -6)\nsetEffect(8, VOLUME, GAIN, -3)\nsetEffect(9, VOLUME, GAIN, -4.5)\nsetEffect(10, VOLUME, GAIN, -22)\nsetEffect(11, VOLUME, GAIN, -11)\nsetEffect(12, VOLUME, GAIN, -4)\nsetEffect(13, VOLUME, GAIN, -4)\n\nsetEffect(6, DISTORTION, DISTO_GAIN, 12)\n\n\"\"\"\nFinishing\n\"\"\"\n\nfinish()";

var Unit1_1_data = [
    {
        "audioclips": [],
        "effects": []
    },
    {
        "audioclips": [
            {
                "bufferkey": "TECHNO_KICKROLL_001",
                "belongingtrack": 1,
                "startLocation": 5,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 53,
                "parentId": 53
            },
            {
                "bufferkey": "TECHNO_KICKROLL_001",
                "belongingtrack": 1,
                "startLocation": 7,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 54,
                "parentId": 53
            },
            {
                "bufferkey": "TECHNO_KICKROLL_001",
                "belongingtrack": 1,
                "startLocation": 9,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 55,
                "parentId": 55
            },
            {
                "bufferkey": "TECHNO_KICKROLL_001",
                "belongingtrack": 1,
                "startLocation": 11,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 56,
                "parentId": 55
            },
            {
                "bufferkey": "TECHNO_SNAREROLL_001",
                "belongingtrack": 1,
                "startLocation": 13,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 57,
                "parentId": 57
            },
            {
                "bufferkey": "TECHNO_SNAREROLL_001",
                "belongingtrack": 1,
                "startLocation": 15,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 58,
                "parentId": 57
            },
            {
                "bufferkey": "TECHNO_KICKROLL_001",
                "belongingtrack": 1,
                "startLocation": 17,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 59,
                "parentId": 59
            },
            {
                "bufferkey": "TECHNO_KICKROLL_001",
                "belongingtrack": 1,
                "startLocation": 19,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 60,
                "parentId": 59
            },
            {
                "bufferkey": "TECHNO_KICKROLL_001",
                "belongingtrack": 1,
                "startLocation": 21,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 61,
                "parentId": 59
            }
        ],
        "effects": [
            {
                "belongingtrack": 1,
                "effectname": "VOLUME",
                "parameter": "GAIN",
                "effectstartvalue": 1.1885022274370185,
                "effectstartvalue_visual": 1.5,
                "effectstartlocation": 1,
                "effectendvalue": 1.1885022274370185,
                "effectendlocation": 0
            }
        ]
    },
    {
        "audioclips": [
            {
                "bufferkey": "TECHNO_CLUBRICH_PAD_001",
                "belongingtrack": 2,
                "startLocation": 5,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 62,
                "parentId": 62
            },
            {
                "bufferkey": "TECHNO_CLUBRICH_PAD_001",
                "belongingtrack": 2,
                "startLocation": 7,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 63,
                "parentId": 62
            },
            {
                "bufferkey": "TECHNO_CLUBRICH_PAD_001",
                "belongingtrack": 2,
                "startLocation": 9,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 64,
                "parentId": 64
            },
            {
                "bufferkey": "TECHNO_CLUBRICH_PAD_001",
                "belongingtrack": 2,
                "startLocation": 11,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 65,
                "parentId": 64
            },
            {
                "bufferkey": "TECHNO_CLUBRICH_PAD_001",
                "belongingtrack": 2,
                "startLocation": 17,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 66,
                "parentId": 66
            },
            {
                "bufferkey": "TECHNO_CLUBRICH_PAD_001",
                "belongingtrack": 2,
                "startLocation": 19,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 67,
                "parentId": 66
            },
            {
                "bufferkey": "TECHNO_CLUBRICH_PAD_001",
                "belongingtrack": 2,
                "startLocation": 21,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 68,
                "parentId": 66
            }
        ],
        "effects": []
    },
    {
        "audioclips": [
            {
                "bufferkey": "TECHNO_MAINLOOP_018",
                "belongingtrack": 3,
                "startLocation": 9,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 69,
                "parentId": 69
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_018",
                "belongingtrack": 3,
                "startLocation": 11,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 70,
                "parentId": 69
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_018",
                "belongingtrack": 3,
                "startLocation": 17,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 71,
                "parentId": 71
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_018",
                "belongingtrack": 3,
                "startLocation": 19,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 72,
                "parentId": 71
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_018",
                "belongingtrack": 3,
                "startLocation": 21,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 73,
                "parentId": 71
            }
        ],
        "effects": [
            {
                "belongingtrack": 3,
                "effectname": "VOLUME",
                "parameter": "GAIN",
                "effectstartvalue": 0.7943282347242815,
                "effectstartvalue_visual": -2,
                "effectstartlocation": 1,
                "effectendvalue": 0.7943282347242815,
                "effectendlocation": 0
            }
        ]
    },
    {
        "audioclips": [
            {
                "bufferkey": "ELECTRO_DRUM_MAIN_BEAT_002",
                "belongingtrack": 4,
                "startLocation": 13,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 74,
                "parentId": 74
            },
            {
                "bufferkey": "ELECTRO_DRUM_MAIN_BEAT_002",
                "belongingtrack": 4,
                "startLocation": 15,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 75,
                "parentId": 74
            }
        ],
        "effects": [
            {
                "belongingtrack": 4,
                "effectname": "VOLUME",
                "parameter": "GAIN",
                "effectstartvalue": 1.4125375446227544,
                "effectstartvalue_visual": 3,
                "effectstartlocation": 1,
                "effectendvalue": 1.4125375446227544,
                "effectendlocation": 0
            }
        ]
    },
    {
        "audioclips": [
            {
                "bufferkey": "DUBSTEP_FILTERCHORD_002",
                "belongingtrack": 5,
                "startLocation": 1,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 76,
                "parentId": 76
            },
            {
                "bufferkey": "DUBSTEP_FILTERCHORD_002",
                "belongingtrack": 5,
                "startLocation": 3,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 77,
                "parentId": 76
            },
            {
                "bufferkey": "DUBSTEP_FILTERCHORD_002",
                "belongingtrack": 5,
                "startLocation": 13,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 78,
                "parentId": 78
            },
            {
                "bufferkey": "DUBSTEP_FILTERCHORD_002",
                "belongingtrack": 5,
                "startLocation": 15,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 79,
                "parentId": 78
            },
            {
                "bufferkey": "DUBSTEP_FILTERCHORD_002",
                "belongingtrack": 5,
                "startLocation": 23,
                "mediaStartLocation": 1,
                "mediaEndLocation": 2,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 50,
                "parentId": null,
                "noloop": false
            }
        ],
        "effects": [
            {
                "belongingtrack": 5,
                "effectname": "VOLUME",
                "parameter": "GAIN",
                "effectstartvalue": 0.5956621435290105,
                "effectstartvalue_visual": -4.5,
                "effectstartlocation": 1,
                "effectendvalue": 0.5956621435290105,
                "effectendlocation": 0
            }
        ]
    },
    {
        "audioclips": [
            {
                "bufferkey": "ELECTRO_DRUM_MAIN_BEAT_003",
                "belongingtrack": 6,
                "startLocation": 4,
                "mediaStartLocation": 1,
                "mediaEndLocation": 2,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 4,
                "parentId": null,
                "noloop": false
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 13,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 18,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 13.25,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 19,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 13.5,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 20,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 13.6875,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 21,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 13.8125,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 22,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 13.9375,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 23,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 15,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 24,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 15.25,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 25,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 15.5,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 26,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 15.6875,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 27,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 15.8125,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 28,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 15.9375,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 29,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 19,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 38,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 19.25,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 39,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 19.5,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 40,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 19.6875,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 41,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 19.8125,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 42,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 19.9375,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 43,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 21,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 44,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 21.25,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 45,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 21.5,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 46,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 21.6875,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 47,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 21.8125,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 48,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "TECHNO_MAINLOOP_008",
                "belongingtrack": 6,
                "startLocation": 21.9375,
                "mediaStartLocation": 1,
                "mediaEndLocation": 1.0625,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 49,
                "parentId": null,
                "noloop": true
            },
            {
                "bufferkey": "ELECTRO_DRUM_MAIN_BEAT_003",
                "belongingtrack": 6,
                "startLocation": 23,
                "mediaStartLocation": 1,
                "mediaEndLocation": 2.125,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 52,
                "parentId": null,
                "noloop": false
            }
        ],
        "effects": [
            {
                "belongingtrack": 6,
                "effectname": "VOLUME",
                "parameter": "GAIN",
                "effectstartvalue": 0.5308844442309884,
                "effectstartvalue_visual": -5.5,
                "effectstartlocation": 1,
                "effectendvalue": 0.5308844442309884,
                "effectendlocation": 0
            },
            {
                "belongingtrack": 6,
                "effectname": "DISTORTION",
                "parameter": "DISTO_GAIN",
                "effectstartvalue": 0.24,
                "effectstartvalue_visual": 12,
                "effectstartlocation": 1,
                "effectendvalue": 0.24,
                "effectendlocation": 0
            }
        ]
    },
    {
        "audioclips": [
            {
                "bufferkey": "EIGHT_BIT_VIDEO_SPEAKNSPELL_BEAT_007",
                "belongingtrack": 7,
                "startLocation": 17,
                "mediaStartLocation": 1,
                "mediaEndLocation": 2,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 35,
                "parentId": null,
                "noloop": false
            },
            {
                "bufferkey": "EIGHT_BIT_VIDEO_SPEAKNSPELL_BEAT_007",
                "belongingtrack": 7,
                "startLocation": 19,
                "mediaStartLocation": 1,
                "mediaEndLocation": 2,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 36,
                "parentId": null,
                "noloop": false
            },
            {
                "bufferkey": "EIGHT_BIT_VIDEO_SPEAKNSPELL_BEAT_007",
                "belongingtrack": 7,
                "startLocation": 21,
                "mediaStartLocation": 1,
                "mediaEndLocation": 2,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 37,
                "parentId": null,
                "noloop": false
            },
            {
                "bufferkey": "EIGHT_BIT_VIDEO_SPEAKNSPELL_BEAT_007",
                "belongingtrack": 7,
                "startLocation": 23,
                "mediaStartLocation": 1,
                "mediaEndLocation": 2.9375,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 51,
                "parentId": null,
                "noloop": false
            }
        ],
        "effects": [
            {
                "belongingtrack": 7,
                "effectname": "VOLUME",
                "parameter": "GAIN",
                "effectstartvalue": 0.5011872336272722,
                "effectstartvalue_visual": -6,
                "effectstartlocation": 1,
                "effectendvalue": 0.5011872336272722,
                "effectendlocation": 0
            }
        ]
    },
    {
        "audioclips": [
            {
                "bufferkey": "HOUSE_MAIN_BEAT_001",
                "belongingtrack": 8,
                "startLocation": 1,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 80,
                "parentId": 80
            },
            {
                "bufferkey": "HOUSE_MAIN_BEAT_001",
                "belongingtrack": 8,
                "startLocation": 3,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 81,
                "parentId": 80
            }
        ],
        "effects": [
            {
                "belongingtrack": 8,
                "effectname": "VOLUME",
                "parameter": "GAIN",
                "effectstartvalue": 0.7079457843841379,
                "effectstartvalue_visual": -3,
                "effectstartlocation": 1,
                "effectendvalue": 0.7079457843841379,
                "effectendlocation": 0
            }
        ]
    },
    {
        "audioclips": [
            {
                "bufferkey": "TECHNO_SYNTHPLUCK_001",
                "belongingtrack": 9,
                "startLocation": 3,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 2,
                "parentId": null,
                "noloop": false
            },
            {
                "bufferkey": "TECHNO_SYNTHPLUCK_001",
                "belongingtrack": 9,
                "startLocation": 13,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 82,
                "parentId": 82
            },
            {
                "bufferkey": "TECHNO_SYNTHPLUCK_001",
                "belongingtrack": 9,
                "startLocation": 15,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 83,
                "parentId": 82
            }
        ],
        "effects": [
            {
                "belongingtrack": 9,
                "effectname": "VOLUME",
                "parameter": "GAIN",
                "effectstartvalue": 0.5956621435290105,
                "effectstartvalue_visual": -4.5,
                "effectstartlocation": 1,
                "effectendvalue": 0.5956621435290105,
                "effectendlocation": 0
            }
        ]
    },
    {
        "audioclips": [
            {
                "bufferkey": "TECHNO_WHITENOISESFX_006",
                "belongingtrack": 10,
                "startLocation": 1.75,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 84,
                "parentId": 84
            },
            {
                "bufferkey": "TECHNO_WHITENOISESFX_006",
                "belongingtrack": 10,
                "startLocation": 3.75,
                "mediaStartLocation": 1,
                "mediaEndLocation": 2.25,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 85,
                "parentId": 84
            }
        ],
        "effects": [
            {
                "belongingtrack": 10,
                "effectname": "VOLUME",
                "parameter": "GAIN",
                "effectstartvalue": 0.07943282347242814,
                "effectstartvalue_visual": -22,
                "effectstartlocation": 1,
                "effectendvalue": 0.07943282347242814,
                "effectendlocation": 0
            }
        ]
    },
    {
        "audioclips": [
            {
                "bufferkey": "ELECTRO_ANALOGUE_LEAD_013",
                "belongingtrack": 11,
                "startLocation": 5,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 86,
                "parentId": 86
            },
            {
                "bufferkey": "ELECTRO_ANALOGUE_LEAD_013",
                "belongingtrack": 11,
                "startLocation": 7,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 87,
                "parentId": 86
            },
            {
                "bufferkey": "ELECTRO_ANALOGUE_LEAD_013",
                "belongingtrack": 11,
                "startLocation": 9,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 88,
                "parentId": 88
            },
            {
                "bufferkey": "ELECTRO_ANALOGUE_LEAD_013",
                "belongingtrack": 11,
                "startLocation": 11,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 89,
                "parentId": 88
            },
            {
                "bufferkey": "ELECTRO_ANALOGUE_LEAD_013",
                "belongingtrack": 11,
                "startLocation": 17,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 90,
                "parentId": 90
            },
            {
                "bufferkey": "ELECTRO_ANALOGUE_LEAD_013",
                "belongingtrack": 11,
                "startLocation": 19,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 91,
                "parentId": 90
            },
            {
                "bufferkey": "ELECTRO_ANALOGUE_LEAD_013",
                "belongingtrack": 11,
                "startLocation": 21,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 92,
                "parentId": 90
            }
        ],
        "effects": [
            {
                "belongingtrack": 11,
                "effectname": "VOLUME",
                "parameter": "GAIN",
                "effectstartvalue": 0.28183829312644537,
                "effectstartvalue_visual": -11,
                "effectstartlocation": 1,
                "effectendvalue": 0.28183829312644537,
                "effectendlocation": 0
            }
        ]
    },
    {
        "audioclips": [
            {
                "bufferkey": "TECHNO_ACIDBASS_008",
                "belongingtrack": 12,
                "startLocation": 9.125,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 93,
                "parentId": 93
            },
            {
                "bufferkey": "TECHNO_ACIDBASS_008",
                "belongingtrack": 12,
                "startLocation": 11.125,
                "mediaStartLocation": 1,
                "mediaEndLocation": 2.875,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 94,
                "parentId": 93
            },
            {
                "bufferkey": "TECHNO_ACIDBASS_008",
                "belongingtrack": 12,
                "startLocation": 17.125,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 95,
                "parentId": 95
            },
            {
                "bufferkey": "TECHNO_ACIDBASS_008",
                "belongingtrack": 12,
                "startLocation": 19.125,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 96,
                "parentId": 95
            },
            {
                "bufferkey": "TECHNO_ACIDBASS_008",
                "belongingtrack": 12,
                "startLocation": 21.125,
                "mediaStartLocation": 1,
                "mediaEndLocation": 2.875,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 97,
                "parentId": 95
            }
        ],
        "effects": [
            {
                "belongingtrack": 12,
                "effectname": "VOLUME",
                "parameter": "GAIN",
                "effectstartvalue": 0.6309573444801932,
                "effectstartvalue_visual": -4,
                "effectstartlocation": 1,
                "effectendvalue": 0.6309573444801932,
                "effectendlocation": 0
            }
        ]
    },
    {
        "audioclips": [
            {
                "bufferkey": "TECHNO_ACIDBASS_006",
                "belongingtrack": 13,
                "startLocation": 13,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 98,
                "parentId": 98
            },
            {
                "bufferkey": "TECHNO_ACIDBASS_006",
                "belongingtrack": 13,
                "startLocation": 15,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 99,
                "parentId": 98
            }
        ],
        "effects": [
            {
                "belongingtrack": 13,
                "effectname": "VOLUME",
                "parameter": "GAIN",
                "effectstartvalue": 0.6309573444801932,
                "effectstartvalue_visual": -4,
                "effectstartlocation": 1,
                "effectendvalue": 0.6309573444801932,
                "effectendlocation": 0
            }
        ]
    }
];

var hotdays_src ="from earsketch import * \n\ninit() \nsetTempo(120) \n\nfitMedia(EIGHT_BIT_ATARI_LEAD_001, 1, 1, 5)\nsetEffect(1, VOLUME, GAIN, -60, 1, 0, 5)\n\nfinish() \n";
var hotdays_data = [
    {
        "audioclips": [],
        "effects": []
    },
    {
        "audioclips": [
            {
                "bufferkey": "EIGHT_BIT_ATARI_LEAD_001",
                "belongingtrack": 1,
                "startLocation": 1,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 1,
                "parentId": 1
            },
            {
                "bufferkey": "EIGHT_BIT_ATARI_LEAD_001",
                "belongingtrack": 1,
                "startLocation": 3,
                "mediaStartLocation": 1,
                "mediaEndLocation": 3,
                "scale": true,
                "src": null,
                "isStarted": false,
                "id": 2,
                "parentId": 1
            }
        ],
        "effects": [
            {
                "belongingtrack": 1,
                "effectname": "VOLUME",
                "parameter": "GAIN",
                "effectstartvalue": 0.001,
                "effectstartvalue_visual": -60,
                "effectstartlocation": 1,
                "effectendvalue": 1,
                "effectendvalue_visual": 0,
                "effectendlocation": 5
            }
        ]
    }
];

var Unit1_2_src = "#\n#\n# script_name:\n#\n# author:\n#\n# description:\n#\n#\n#\n\nfrom earsketch import *\n\ninit()\nsetTempo(120)\n\nsynth1 = TECHNO_SYNTHPLUCK_001\n\n#melody\nfitMedia(synth1, 1, 1, 2)\nfitMedia(synth1, 1, 3, 4)\nfitMedia(synth1, 1, 5, 6)\nfitMedia(synth1, 1, 7, 8)\n\nfinish()";
var Unit1_2_data =
    [
        {
            "audioclips": [],
            "effects": []
        },
        {
            "audioclips": [
                {
                    "bufferkey": "TECHNO_SYNTHPLUCK_001",
                    "belongingtrack": 1,
                    "startLocation": 1,
                    "mediaStartLocation": 1,
                    "mediaEndLocation": 2,
                    "scale": true,
                    "src": null,
                    "isStarted": false,
                    "id": 0,
                    "parentId": null,
                    "noloop": false
                },
                {
                    "bufferkey": "TECHNO_SYNTHPLUCK_001",
                    "belongingtrack": 1,
                    "startLocation": 3,
                    "mediaStartLocation": 1,
                    "mediaEndLocation": 2,
                    "scale": true,
                    "src": null,
                    "isStarted": false,
                    "id": 1,
                    "parentId": null,
                    "noloop": false
                },
                {
                    "bufferkey": "TECHNO_SYNTHPLUCK_001",
                    "belongingtrack": 1,
                    "startLocation": 5,
                    "mediaStartLocation": 1,
                    "mediaEndLocation": 2,
                    "scale": true,
                    "src": null,
                    "isStarted": false,
                    "id": 2,
                    "parentId": null,
                    "noloop": false
                },
                {
                    "bufferkey": "TECHNO_SYNTHPLUCK_001",
                    "belongingtrack": 1,
                    "startLocation": 7,
                    "mediaStartLocation": 1,
                    "mediaEndLocation": 2,
                    "scale": true,
                    "src": null,
                    "isStarted": false,
                    "id": 3,
                    "parentId": null,
                    "noloop": false
                }
            ],
            "effects": []
        }
    ];