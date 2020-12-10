const N = 50;

const compareResults = false;
const thresh = 0.1;

const initTempo = 80;
const tempoRange = [45,220];
const fileKey = 'HIPHOP_FUNKPAD_001';
const origTempo = 98;

const actx = new (window.AudioContext || window.webkitAudioContext)();
const lmcDevHost = 'https://earsketch-dev.lmc.gatech.edu';
const getStretchedSample = lmcDevHost + '/EarSketchWS/services/audio/getaudiosample';
const getUnstretchedSample = lmcDevHost + '/EarSketchWS/services/audio/getunstretchedsample';

const headers = {
  Accept: '*/*'
};

let soxDeltas = [];
let noSoxDeltas = [];
let kaliDeltas = [];
let soxRes = [];
let kaliRes = [];

function requestSoxTS(tempo) {
  const requestTime = new Date();

  return m.request({
    method: 'GET',
    url: getStretchedSample,
    params: {
      key: fileKey,
      tempo: tempo,
      audioquality: 0
    },
    headers: headers,
    responseType: 'arraybuffer'
  }).then(result => {
    const responseTime = new Date();
    const delta = responseTime-requestTime;
    soxDeltas.push(delta);
    console.log(`WS (Sox TS) delta: ${delta} ms`);

    if (compareResults) {
      actx.decodeAudioData(result, buffer => {
        soxRes.push(buffer.getChannelData(0));
      });
    }
  });
}

function requestKaliTS(tempo) {
  const requestTime = new Date();

  return m.request({
    method: 'GET',
    url: getUnstretchedSample,
    params: {
      key: fileKey
    },
    headers: headers,
    responseType: 'arraybuffer'
  }).then(result => {
    const responseTime = new Date();
    const delta = responseTime-requestTime;
    noSoxDeltas.push(delta);
    console.log(`WS (No TS) delta: ${delta} ms`);
    return callKali(result, tempo);
  });
}

function callKali(arrayBuffer, tempo) {
  return actx.decodeAudioData(arrayBuffer, buffer => {
    const kali = new Kali(1);
    const sr = 44100;
    const ratio = tempo/origTempo;
    const quickSearch = false;
    kali.setup(sr, ratio, quickSearch);
    kali.input(buffer.getChannelData(0));

    const startTime = new Date();
    kali.process();
    const endTime = new Date();

    if (compareResults) {
      // Note: This calculation somehow matches the Sox output lengths.
      let outputLen = Math.round((buffer.length+1)*origTempo/tempo);
      let output = new Float32Array(outputLen);
      kali.output(output);
      kaliRes.push(output);
    }

    kali.flush();

    const delta = endTime-startTime;
    kaliDeltas.push(delta);
    console.log(`Kali delta: ${delta} ms`);
  });
}

function recursiveRequest(method, repeat, tempo) {
  const requester = method==='sox' ? requestSoxTS : requestKaliTS;
  return requester(tempo).then(() => {
    if (repeat > 1) {
      return recursiveRequest(method,--repeat,++tempo);
      // return recursiveRequest(method,--repeat,tempo);
    } else {
      return Promise.resolve();
    }
  });
}

function median(array) {
  let medIdx = Math.floor(array.length/2);
  array.sort((a,b) => a-b);
  return array[medIdx];
}

function compareSamples(left, right, tempo) {
  const checkLengths = false;
  const leftLen = left.length;
  const rightLen = right.length;

  let samples = [];
  let bigErrors = [];

  console.log('==============');
  console.log(`At tempo: ${tempo} BPM`);

  const compLen = checkLengths ? Math.min(leftLen,rightLen) : leftLen;

  if (checkLengths) {
    const sampsPerBeat = 44100 * 60/tempo;
    console.log(`Sox beat length: ${leftLen/sampsPerBeat}`);
    console.log(`Kali beat length: ${rightLen/sampsPerBeat}`);

    if (leftLen > rightLen) {
      console.log(`Sox sample is longer by ${leftLen-rightLen} samples.`);
    } else if (leftLen < rightLen) {
      console.log(`Kali sample is longer by ${rightLen-leftLen} samples.`);
    } else {
      console.log(`Sox and Kali sample lengths match.`);
    }    
  }

  const rotateBy = 0;
  for (let i = 0; i < compLen; i++) {
    const diff = left[i] - right[(i+rotateBy)%compLen];

    if (Math.abs(diff) > thresh) {
      bigErrors.push([i,diff]);
    }
    samples.push([left[i],right[(i+rotateBy)%compLen],diff]);
  }
  console.log('Samples (Sox, Kali, error):', samples);
  console.log('Big erros (at, amount):', bigErrors);
  console.log(`Big error ratio: ${bigErrors.length/samples.length}`);
}

(async () => {
  let noSoxDelta, kaliDelta;
  await recursiveRequest('sox',N,initTempo);
  await recursiveRequest('kali',N,initTempo);
  console.log(`WS (SOX TS) delta: ${soxDeltas}`);
  console.log(`WS (No TS) delta: ${noSoxDeltas}`);
  console.log(`Kali delta: ${kaliDeltas}`);
  console.log(`WS (Sox TS) median: ${median(soxDeltas)} ms`);
  console.log(`WS (No TS) median: ${noSoxDelta = median(noSoxDeltas)} ms`);
  console.log(`Kali median: ${kaliDelta = median(kaliDeltas)} ms`);
  console.log(`WS (No TS) + Kali median: ${noSoxDelta+kaliDelta} ms`);

  if (compareResults) {
    // console.log(soxRes, kaliRes);
    for (let i = 0; i < N; i++) {
      compareSamples(soxRes[i],kaliRes[i],initTempo+i);
    }
  }
})();


