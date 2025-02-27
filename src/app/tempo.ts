// Tempo mapping.
import type { Envelope, DAWData } from "common"

// Like all other envelopes, tempo is a piecewise linear function.
interface Point {
    measure: number
    tempo: number
}

/** Convert tempo (beats / minute) to delta time (seconds / measure). */
function tempoToDeltaTime(tempo: number, beatsPerMeasure: number) {
    return 60 * beatsPerMeasure / tempo
}

/** Compute seconds elapsed along the linear segment from `start` to `end` by `currentMeasure`. */
function measureToDeltaTime(start: Point, end: Point, currentMeasure: number, beatsPerMeasure: number) {
    // Arrived at by integrating this expression, which computes the instantaneous time slope in seconds per measure:
    // (60 * beatsPerMeasure) / (tempoStart + (tempoEnd - tempoStart)/(measureEnd - measureStart) * measure)
    // by d_measure, from measureStart to currentMeasure
    if (start.measure === end.measure) {
        // After the end point, the tempo is held constant.
        return (currentMeasure - end.measure) * tempoToDeltaTime(end.tempo, beatsPerMeasure)
    } else if (start.tempo === end.tempo) {
        // Special case: constant tempo; avoid dividing by tempoSlope (which would be 0) below.
        return 60 * beatsPerMeasure / start.tempo * (currentMeasure - start.measure)
    }
    const tempoSlope = (end.tempo - start.tempo) / (end.measure - start.measure)
    const currentTempo = start.tempo + tempoSlope * (currentMeasure - start.measure)
    return 60 * beatsPerMeasure / tempoSlope * Math.log(currentTempo / start.tempo)
}

/** Same deal as `measureToDeltaTime`, but we know `deltaTime` and solve for `currentMeasure`. */
function deltaTimeToMeasure(start: Point, end: Point, deltaTime: number, beatsPerMeasure: number) {
    if (start.measure === end.measure) {
        // After the end point, the tempo is held constant.
        return end.measure + deltaTime / tempoToDeltaTime(end.tempo, beatsPerMeasure)
    } else if (start.tempo === end.tempo) {
        // Special case: constant tempo; avoid dividing by tempoSlope (which would be 0) below.
        return start.measure + deltaTime / beatsPerMeasure / 60 * start.tempo
    }
    const tempoSlope = (end.tempo - start.tempo) / (end.measure - start.measure)
    return start.measure + (Math.exp(deltaTime / beatsPerMeasure / 60 * tempoSlope) * start.tempo - start.tempo) / tempoSlope
}

// TODO: Consider moving elsewhere.
export function getLinearPoints(envelope: Envelope) {
    const points = []
    for (const [index, point] of envelope.entries()) {
        points.push({ measure: point.measure, value: point.value })
        if (point.shape === "square" && index < envelope.length - 1) {
            points.push({ measure: envelope[index + 1].measure, value: point.value })
        }
    }
    return points
}

export class TempoMap {
    points: Point[] = []

    constructor()
    constructor(points: Point[])
    constructor(points: Envelope)
    constructor(result: DAWData)
    constructor(thing?: Point[] | Envelope | DAWData) {
        if (thing === undefined) return
        let points = Array.isArray(thing) ? thing : thing.tracks[0].effects.TEMPO.TEMPO
        if (points && "shape" in points[0]) {
            points = getLinearPoints(points as Envelope).map(({ measure, value }) => ({ measure, tempo: value }))
        }
        this.points = points as Point[]

        // Canonicalize representation: remove initial points that have no effect on the tempo curve.
        while (this.points.length > 1 && this.points[0].measure === this.points[1].measure) {
            this.points.shift()
        }
        // TODO: May want to do additional canonicalization, like removing points that already fit on lines between neighbors,
        //       or dealing with overlapping effect ranges (probably recency should determine precedence).
    }

    /** Extract a TempoMap that describes the curve from `startMeasure` to `endMeasure`, starting from measure 1. */
    slice(startMeasure: number, endMeasure: number) {
        const startTempo = this.getTempoAtMeasure(startMeasure)
        const endTempo = this.getTempoAtMeasure(endMeasure)
        const startIndex = this.points.findIndex(point => point.measure >= startMeasure)
        const endIndex = this.points.findIndex(point => point.measure >= endMeasure)
        const slice = this.points.slice(startIndex === -1 ? this.points.length : -1, endIndex === -1 ? this.points.length : -1)
        const transformed = slice.map(({ measure, tempo }) => ({ measure: measure - startMeasure + 1, tempo }))
        return new TempoMap([{ measure: 1, tempo: startTempo }, ...transformed, { measure: endMeasure - startMeasure + 1, tempo: endTempo }])
    }

    getPointAtMeasure(measure: number, timeSignature = 4) {
        let time = 0 // in seconds
        let prevPoint = { measure: 1, tempo: 120 }
        let point = prevPoint
        for (point of this.points) {
            if (measure < point.measure) {
                break
            }
            // Integrate delta time between last point and this one to get time offset.
            time += measureToDeltaTime(prevPoint, point, point.measure, timeSignature)
            prevPoint = point
        }
        time += measureToDeltaTime(prevPoint, point, measure, timeSignature)
        // At this point, lastMeasure is the location of the last tempo marking before the given measure.
        if (point.measure === prevPoint.measure) {
            // No more tempo markings: the last tempo is held constant.
            return { time, tempo: point.tempo }
        }
        // The point in question is somewhere on the line between that tempo marking and the next tempo marking.
        const slope = (point.tempo - prevPoint.tempo) / (point.measure - prevPoint.measure)
        const tempo = prevPoint.tempo + slope * (measure - prevPoint.measure)
        return { time, tempo }
    }

    measureToTime(measure: number, timeSignature = 4) {
        return this.getPointAtMeasure(measure, timeSignature).time
    }

    getTempoAtMeasure(measure: number, timeSignature = 4) {
        return this.getPointAtMeasure(measure, timeSignature).tempo
    }

    getPointAtTime(time: number, timeSignature = 4) {
        let prevTime = 0 // in seconds
        let nextTime = prevTime
        let prevPoint = { measure: 1, tempo: 120 }
        let point = prevPoint
        for (point of this.points) {
            // Integrate delta time between last point and this one to get time offset.
            nextTime += measureToDeltaTime(prevPoint, point, point.measure, timeSignature)
            if (time < nextTime) {
                break
            }
            prevTime = nextTime
            prevPoint = point
        }
        // At this point, lastMeasure is the location of the last tempo marking before the given measure.
        const measure = deltaTimeToMeasure(prevPoint, point, time - prevTime, timeSignature)
        if (point.measure === prevPoint.measure) {
            // No more tempo markings: the last tempo is held constant.
            return { measure, tempo: point.tempo }
        }
        // The point in question is somewhere on the line between that tempo marking and the next tempo marking.
        const slope = (point.tempo - prevPoint.tempo) / (point.measure - prevPoint.measure)
        const tempo = prevPoint.tempo + slope * (measure - prevPoint.measure)
        return { measure, tempo }
    }

    timeToMeasure(time: number, timeSignature = 4) {
        return this.getPointAtTime(time, timeSignature).measure
    }

    getTempoAtTime(time: number, timeSignature = 4) {
        return this.getPointAtTime(time, timeSignature).tempo
    }
}
