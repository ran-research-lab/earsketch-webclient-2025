// Play sounds from the JSON object output of scripts.
import esconsole from '../esconsole'

// Preliminary type declarations
// TODO: Move some to compiler?
export interface Pitchshift {
    audio: AudioBuffer
    start: number
    end: number
}

export interface Clip {
    filekey: string
    loopChild: boolean
    measure: number
    start: number
    end: number
    audio: AudioBuffer
    pitchshift?: Pitchshift
    playing?: boolean
    source?: AudioBufferSourceNode
    gain?: GainNode
}

export interface EffectRange {
    name: string
    parameter: string
    startMeasure: number
    endMeasure: number
    inputStartValue: number
    inputEndValue: number
}

export type Effect = EffectRange[] & {bypass?: boolean}

export interface Track {
    clips: Clip[]
    effects: {[key: string]: Effect}
    analyser: AnalyserNode
    label?: string | number
    visible?: boolean
    buttons?: boolean
    mute?: boolean
}

export interface DAWData {
    tempo: number
    length: number
    tracks: Track[]
    master: GainNode
}

export const Player = (context: AudioContext & {master: GainNode}, applyEffects: any, ESUtils: any) => {
    let isPlaying = false

    let waTimeStarted = 0

    let playStartTimer = 0
    let playEndTimer = 0
    let loopSchedTimer = 0

    let playbackData = {
        startMeasure: 1,
        endMeasure: 1,
        playheadPos: 1,
        startOffset: 0
    }

    let loop = {
        on: false,
        start: 0,
        end: 0,
        selection: false,
    }
    let loopScheduledWhilePaused = false

    let renderingDataQueue: (DAWData | null)[] = [null, null]
    let mutedTracks: number[] = []
    let bypassedEffects: {[key: number]: string[]} = {}

    const reset = () => {
        esconsole('resetting', ['player', 'debug'])

        clearAllAudioGraphs()
        clearAllTimers()

        playbackData = {
            startMeasure: 1,
            endMeasure: 1,
            playheadPos: 1,
            startOffset: 0
        }
    }

    const clearAllTimers = () => {
        clearTimeout(playStartTimer)
        clearTimeout(playEndTimer)
        clearTimeout(loopSchedTimer)
    }

    const playClip = (clip: Clip, trackGain: GainNode, pitchShift: any, tempo: number, startTime: number, endTime: number, waStartTime: number, manualOffset: number) => {
        const clipStartTime = ESUtils.measureToTime(clip.measure, tempo)
        let startTimeInClip, endTimeInClip // start/end locations within clip
        const clipSource = context.createBufferSource()

        // set buffer & start/end time within clip
        if (pitchShift && !pitchShift.bypass) {
            esconsole('Using pitchshifted audio for ' + clip.filekey, ['player', 'debug'])
            clipSource.buffer = clip.pitchshift!.audio
            startTimeInClip = ESUtils.measureToTime(clip.pitchshift!.start, tempo)
            endTimeInClip = ESUtils.measureToTime(clip.pitchshift!.end, tempo)
        } else {
            clipSource.buffer = clip.audio
            startTimeInClip = ESUtils.measureToTime(clip.start, tempo)
            endTimeInClip = ESUtils.measureToTime(clip.end, tempo)
        }

        // the clip duration may be shorter than the buffer duration
        let clipDuration = endTimeInClip - startTimeInClip
        const clipEndTime = clipStartTime + clipDuration

        if (startTime >= clipEndTime) {
            // case: clip is in the past: skip the clip
            return
        } else if (startTime >= clipStartTime && startTime < clipEndTime) {
            // case: clip is playing from the middle
            const clipStartOffset = startTime - clipStartTime
            // if the loop end is set before the clip end
            if (clipEndTime > endTime) {
                clipDuration = endTime - clipStartTime
            }
            // clips -> track gain -> effect tree
            clipSource.connect(trackGain)
            clipSource.start(waStartTime, startTimeInClip+clipStartOffset, clipDuration-clipStartOffset)

            // keep this flag so we only stop clips that are playing (otherwise we get an exception raised)
            setTimeout(() => clip.playing = true, manualOffset * 1000)
        } else {
            // case: clip is in the future
            const untilClipStart = clipStartTime - startTime
            // if the loop end is set before the clip
            if (clipStartTime > endTime) {
                return // skip this clip
            }
            // if the loop end is set before the clip end
            if (clipEndTime > endTime) {
                clipDuration = endTime - clipStartTime
            }
            clipSource.connect(trackGain)
            clipSource.start(waStartTime+untilClipStart, startTimeInClip, clipDuration)
            setTimeout(() => clip.playing = true, (manualOffset + untilClipStart) * 1000)
        }

        // keep a reference to this audio source so we can pause it
        clip.source = clipSource
        clip.gain = trackGain // used to mute the track/clip

        if (ESUtils.whichBrowser().indexOf('Chrome') === -1) {
            clipSource.onended = () => clipSource.disconnect()
        }
    }

    const play = (startMes: number, endMes: number, manualOffset=0) => {
        esconsole('starting playback',  ['player', 'debug'])

        // init / convert
        if (loop.on && loop.selection) {
            // startMes = loop.start
            endMes = loop.end
        }

        if (renderingDataQueue[1] === null) {
            esconsole('null in render queue', ['player', 'error'])
            return
        }

        const renderingData = renderingDataQueue[1]

        const tempo = renderingData.tempo
        const startTime = ESUtils.measureToTime(startMes, tempo)
        const endTime = ESUtils.measureToTime(endMes, tempo)

        const waStartTime = context.currentTime + manualOffset

        // construct webaudio graph
        if (renderingData.master) {
            renderingData.master.disconnect()
        }
        renderingData.master = context.createGain()
        renderingData.master.gain.setValueAtTime(1, context.currentTime)

        for (let t = 0; t < renderingData.tracks.length; t++) {
            const track = renderingData.tracks[t]

            // skip muted tracks
            if (mutedTracks.indexOf(t) > -1) continue

            // get the list of bypassed effects for this track
            const trackBypass = bypassedEffects[t] ?? []
            esconsole('Bypassing effects: ' + JSON.stringify(trackBypass), ['DEBUG','PLAYER'])

            // construct the effect graph
            applyEffects.resetAudioNodeFlags()
            const startNode = applyEffects.buildAudioNodeGraph(context, track, t, tempo, startTime, renderingData.master, trackBypass, 0)

            const trackGain = context.createGain()
            trackGain.gain.setValueAtTime(1.0, context.currentTime)

            // process each clip in the track
            const pitchShift = track.effects['PITCHSHIFT-PITCHSHIFT_SHIFT']
            for (const clipData of track.clips) {
                playClip(clipData, trackGain, pitchShift, tempo, startTime, endTime, waStartTime, manualOffset)
            }

            // connect the track output to the effect tree
            if (t === 0) {
                // if master track
                renderingData.master.connect(trackGain)
                // if there is at least one effect set in master track
                if (typeof(startNode) !== "undefined") {
                    // TODO: master not connected to the analyzer?
                    trackGain.connect(startNode.input)
                    // effect tree connects to the context.master internally
                } else {
                    // if no effect set
                    trackGain.connect(track.analyser)
                    track.analyser.connect(context.master)
                }
                context.master.connect(context.destination)
            } else {
                if (typeof(startNode) !== "undefined") {
                    // track gain -> effect tree
                    trackGain.connect(startNode.input)
                } else {
                    // track gain -> (bypass effect tree) -> analyzer & master
                    trackGain.connect(track.analyser)
                    track.analyser.connect(renderingData.master)
                }
            }

            // for setValueAtTime bug in chrome v52
            // TODO: Chrome is now at version 90. Is this safe to remove?
            if (ESUtils.whichBrowser().indexOf('Chrome') > -1 && typeof(startNode) !== 'undefined') {
                const dummyOsc = context.createOscillator()
                const dummyGain = context.createGain()
                dummyGain.gain.value = 0
                dummyOsc.connect(dummyGain).connect(startNode.input)
                dummyOsc.start(startTime)
                dummyOsc.stop(startTime+0.001)
            }
        }

        // set flags
        clearTimeout(playStartTimer)
        playStartTimer = window.setTimeout(() => {
            if (loop.on) {
                if (loop.selection) {
                    playbackData.startOffset = 0
                    if (startMes > loop.start) {
                        playbackData.startOffset = startMes - loop.start
                    }

                    startMes = loop.start
                    endMes = loop.end
                } else {
                    playbackData.startOffset = startMes - 1
                    startMes = 1
                    endMes = renderingDataQueue[1]!.length + 1
                }

                playbackData.startMeasure = startMes
                playbackData.endMeasure = endMes
            } else {
                playbackData.startOffset = 0
                playbackData.startMeasure = startMes
                playbackData.endMeasure = endMes
            }

            esconsole('recording playback data: ' + [startMes,endMes].toString(), ['player', 'debug'])

            waTimeStarted = waStartTime
            isPlaying = true
            self.onStartedCallback()
        }, manualOffset * 1000)

        // check the loop state and schedule loop near the end also cancel the onFinished callback
        if (loop.on && loopScheduledWhilePaused) {
            clearTimeout(loopSchedTimer)
            loopSchedTimer = window.setTimeout(() => {
                esconsole('scheduling loop', ['player', 'debug'])
                clearTimeout(loopSchedTimer)
                clearTimeout(playEndTimer)
                const offset = (endTime-startTime)-(context.currentTime-waTimeStarted)
                clearAllAudioGraphs(offset)
                loopScheduledWhilePaused = true
                play(startMes, endMes, offset)
            }, (endTime-startTime+manualOffset) * 1000 * .95)
        }

        // schedule to call the onFinished callback
        clearTimeout(playEndTimer)
        playEndTimer = window.setTimeout(() => {
            esconsole('playbackTimer ended', 'player')
            pause()
            reset()
            self.onFinishedCallback()
        }, (endTime-startTime+manualOffset) * 1000)
    }

    const pause = () => {
        esconsole('pausing',  ['player', 'debug'])
        clearAllAudioGraphs()
        isPlaying = false
        playbackData.playheadPos = playbackData.startMeasure
        clearTimeout(playEndTimer)
        clearTimeout(loopSchedTimer)
    }

    const stopAllClips = (renderingData: DAWData | null, delay: number) => {
        if (!renderingData) {
            return
        }

        for (const track of renderingData.tracks) {
            for (const clip of track.clips) {
                const source = clip.source
                if (source !== undefined) {
                    try {
                        source.stop(context.currentTime + delay)
                    } catch (e) {
                        // TODO: Why does Safari throw an InvalidStateError?
                        esconsole(e.toString(), ['WARNING','PLAYER'])
                    }
                    setTimeout(() => source.disconnect(), delay * 999)
                    clip.playing = false
                }
            }
        }
    }

    const clearAudioGraph = (idx: number, delay=0) => {
        if (ESUtils.whichBrowser().indexOf('Chrome') !== -1) {
            stopAllClips(renderingDataQueue[idx], delay)
        } else {
            if (!delay) {
                stopAllClips(renderingDataQueue[idx], delay)
            } else {
                const renderData = renderingDataQueue[idx]
                if (renderData === null) {
                    return
                }

                for (const track of renderData.tracks) {
                    for (const clip of track.clips) {
                        if (clip.source !== undefined) {
                            try {
                                clip.source.stop(context.currentTime + delay)
                                clip.gain!.gain.setValueAtTime(0, context.currentTime + delay)
                            } catch (e) {
                                esconsole(e.toString(), ['player', 'warning'])
                            }
                            clip.playing = false
                        }
                    }
                }

                if (renderData.master !== undefined) {
                    renderData.master.gain.setValueAtTime(0, context.currentTime + delay)
                }
            }
        }
    }

    const clearAllAudioGraphs = (delay=0) => {
        esconsole('clearing the audio graphs',  ['player', 'debug'])
        clearAudioGraph(0, delay)
        clearAudioGraph(1, delay)
    }

    const refresh = (clearAllGraphs=false) => {
        if (isPlaying) {
            esconsole('refreshing the rendering data', ['player', 'debug'])
            const currentMeasure = getPosition()
            const nextMeasure = Math.ceil(currentMeasure)
            const timeTillNextBar = ESUtils.measureToTime(nextMeasure-currentMeasure+1, renderingDataQueue[1]!.tempo)

            if (clearAllGraphs) {
                clearAllAudioGraphs(timeTillNextBar)
            } else {
                clearAudioGraph(0, timeTillNextBar)
            }

            const startMeasure = nextMeasure === playbackData.endMeasure ? playbackData.startMeasure : nextMeasure
            play(startMeasure, playbackData.endMeasure, timeTillNextBar)
        }
    }

    // Set playback volume in decibels.
    const setVolume = (gain: number) => {
        esconsole('Setting context volume to ' + gain + 'dB', ['DEBUG','PLAYER'])
        if (context.master !== undefined) {
            context.master.gain.setValueAtTime(applyEffects.dbToFloat(gain), context.currentTime)
        }
    }

    const setLoop = (loopObj: typeof loop) => {
        if (loopObj && loopObj.hasOwnProperty('on')) {
            loop = loopObj
        } else {
            loop.on = !!loopObj

            // use max range
            playbackData.startMeasure = 1
            playbackData.endMeasure = renderingDataQueue[1]!.length + 1
        }
        esconsole('setting loop: ' + loop.on, ['player', 'debug'])

        clearAllTimers()

        let currentMeasure, startMes: number, endMes: number

        if (loop.on) {
            if (isPlaying) {
                esconsole('loop switched on while playing', ['player', 'debug'])
                loopScheduledWhilePaused = false

                currentMeasure = getPosition()
                let timeTillLoopingBack = 0

                if (loop.selection) {
                    startMes = loop.start
                    endMes = loop.end

                    if (currentMeasure >= startMes && currentMeasure < endMes) {
                        if (currentMeasure < endMes - 1) {
                            startMes = Math.ceil(currentMeasure)
                            timeTillLoopingBack = ESUtils.measureToTime(2-(currentMeasure%1), renderingDataQueue[1]!.tempo)
                        } else {
                            timeTillLoopingBack = ESUtils.measureToTime(endMes-currentMeasure+1, renderingDataQueue[1]!.tempo)
                        }
                    } else {
                        timeTillLoopingBack = ESUtils.measureToTime(2-(currentMeasure%1), renderingDataQueue[1]!.tempo)
                    }
                } else {
                    timeTillLoopingBack = ESUtils.measureToTime(renderingDataQueue[1]!.length-currentMeasure+2, renderingDataQueue[1]!.tempo)
                    startMes = 1
                    endMes = renderingDataQueue[1]!.length + 1
                }

                esconsole(`timeTillLoopingBack = ${timeTillLoopingBack}, startMes = ${startMes}, endMes = ${endMes}`, ['player', 'debug'])

                // Schedule the next loop.
                // This is analagous to what play() does when loopScheduledWhilePaused = true.
                const waStartTime = context.currentTime
                clearTimeout(loopSchedTimer)
                loopSchedTimer = window.setTimeout(() => {
                    esconsole('scheduling loop', ['player', 'debug'])
                    clearTimeout(loopSchedTimer)
                    clearTimeout(playEndTimer)
                    const offset = timeTillLoopingBack - (context.currentTime - waStartTime)
                    clearAllAudioGraphs(offset)
                    loopScheduledWhilePaused = true
                    play(startMes, endMes, offset)
                }, timeTillLoopingBack * 1000 * .95)
            } else {
                loopScheduledWhilePaused = true
            }
        } else {
            clearTimeout(loopSchedTimer)
            loopScheduledWhilePaused = false

            if (isPlaying) {
                esconsole('loop switched off while playing', ['player', 'debug'])
                currentMeasure = getPosition()

                esconsole(`currentMeasure = ${currentMeasure}, playbackData.endMeasure = ${playbackData.endMeasure}, renderingDataQueue[1].length = ${renderingDataQueue[1]!.length}`, ['player', 'debug'])
                if (currentMeasure < playbackData.endMeasure && playbackData.endMeasure <= (renderingDataQueue[1]!.length+1)) {
                    clearTimeout(playStartTimer)
                    clearTimeout(playEndTimer)

                    const timeTillContinuedPoint = ESUtils.measureToTime(playbackData.endMeasure-currentMeasure+1, renderingDataQueue[1]!.tempo)

                    startMes = playbackData.endMeasure
                    endMes = renderingDataQueue[1]!.length+1

                    clearAllAudioGraphs(timeTillContinuedPoint)
                    play(startMes, endMes, timeTillContinuedPoint)
                }
            }
        }
    }

    const setRenderingData = (result: DAWData) => {
        esconsole('setting new rendering data', ['player', 'debug'])

        clearAudioGraph(0)
        renderingDataQueue.shift()
        renderingDataQueue.push(result)

        if (isPlaying) {
            refresh()
        } else {
            clearAllAudioGraphs()
        }
    }

    const setPosition = (position: number) => {
        esconsole('setting position: ' + position, ['player', 'debug'])

        clearAllTimers()

        if (isPlaying) {
            const currentMeasure = getPosition()

            if (loop.on) {
                loopScheduledWhilePaused = true

                if (loop.selection) {
                    // playbackData.startMeasure = loop.start
                    // playbackData.endMeasure = loop.end
                } else {
                    playbackData.endMeasure = renderingDataQueue[1]!.length+1
                }
            }

            const timeTillNextBar = ESUtils.measureToTime(2-(currentMeasure%1), renderingDataQueue[1]!.tempo)

            clearAllAudioGraphs(timeTillNextBar)
            play(position, playbackData.endMeasure, timeTillNextBar)
        } else {
            playbackData.playheadPos = position
        }
    }

    const getPosition = () => {
        if (isPlaying) {
            playbackData.playheadPos = (context.currentTime-waTimeStarted) * renderingDataQueue[1]!.tempo/60/4 + playbackData.startMeasure + playbackData.startOffset
        }
        return playbackData.playheadPos
    }

    const setMutedTracks = (_mutedTracks: number[]) => {
        mutedTracks = _mutedTracks

        if (isPlaying) {
            refresh(true)
        }
    }

    const setBypassedEffects = (_bypassedEffects: {[key: number]: string[]}) => {
        bypassedEffects = _bypassedEffects

        if (isPlaying) {
            refresh(true)
        }
    }

    const self = {
        play,
        pause,
        setMutedTracks,
        setBypassedEffects,
        setVolume,
        setRenderingData,
        setLoop,
        setPosition,
        getPosition,

        onStartedCallback: () => {},
        onFinishedCallback: () => {},
    }

    return self
}