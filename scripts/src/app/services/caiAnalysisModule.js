/**
 * Analysis module for CAI (Co-creative Artificial Intelligence) Project.
 *
 * @author Jason Smith
 */
app.factory('caiAnalysisModule', ['esconsole', 'complexityCalculator', 'recommender', 'ESUtils', function (esconsole, complexityCalculator, recommender, ESUtils) {

  /**
   * Report the code complexity analysis of a script.
   *
   * @param language {string} The language python or javascript
   * @param script {string} The script source code
   */
  function analyzeCode(language, script) {
    if (language == "python") {
      return complexityCalculator.analyzePython(script);
    } else if (language == "javascript") {
      return complexityCalculator.analyzeJavascript(script);
    } else {
      return;
    }
  }

  /**
   * Report the music analysis of a script.
   *
   * @param trackListing {dict} Compiler output
   * @param apiCalls {list} EarSketch functions used in script
   */
  function analyzeMusic(trackListing, apiCalls = null) {
    return timelineToEval(trackToTimeline(trackListing, apiCalls));
  }

  /**
   * Report the code complexity and music analysis of a script.
   *
   * @param language {string} The language python or javascript
   * @param script {string} The script source code
   * @param trackListing {dict} Compiler output
   */
   function analyzeCodeAndMusic(language, script, trackListing) {

    var codeComplexity = analyzeCode(language, script);

    var musicAnalysis = analyzeMusic(trackListing, complexityCalculator.apiCalls());
    return Object.assign({}, {'Code':codeComplexity}, {'Music':musicAnalysis});
   }


  /*
  * Convert compiler output to timeline representation.
  */
  function trackToTimeline(output, apiCalls = null) {

      var report = {};

      // basic music information
      report["OVERVIEW"] = {"tempo": output.tempo, "measures": output.length, "length (seconds)": (60.0 / output.tempo * output.length)};
      report["EFFECTS"] = {};

      var apiCalls = complexityCalculator.apiCalls();

      if(apiCalls)
        report["APICALLS"] = apiCalls;

      var measureView = {};

      // report sounds used in each track
      for (var i = 0; i < output.tracks.length - 1; i++) {

        for (var j = 0; j < output.tracks[i].clips.length; j++) {
          var sample = output.tracks[i].clips[j];
          // report sound for every measure it is used in.
          for (var k = sample.measure; k < (sample.measure + sample.end - sample.start); k++) {
            if(measureView[k] == null){
              measureView[k] = [];
            }
            if(measureView[k]) {
              measureView[k].push({type: "sound", track: i, name: sample.filekey});
            }
          }
        }

        // report effects used in each track
        Object.keys(output.tracks[i].effects).forEach(function(effectName) {
          var arr = output.tracks[i].effects[effectName]

          for (var m = 0; m < arr.length; m++) {
            var sample = arr[m];
            for (var n = sample.startMeasure; n <= (sample.endMeasure); n++) {
              // If effect appears at all (level 1)
              if(measureView[n] == null){
                measureView[n] = [];
              }
              if (report["EFFECTS"][sample.name] < 1) {
                report["EFFECTS"][sample.name] = 1;
              }
              if(measureView[n]) {
                var interpValue = sample.startValue;

                // If effect isn't (level 2)/is modified (level 3)
                if (sample.endValue == sample.startValue) {
                  if (report["EFFECTS"][sample.name] < 2) {
                    report["EFFECTS"][sample.name] = 2;
                  }
                }
                else {
                  // effect is modified (level 3)
                  var interpStep = (n - sample.startMeasure) / (sample.endMeasure - sample.startMeasure);
                  var interpValue = (sample.endValue - sample.startValue) * interpStep;
                  report["EFFECTS"][sample.name] = 3;
                }
                measureView[n].push({type: "effect", track: i, name: sample.name, param: sample.parameter, value: interpValue});
              }
            }
          }
        });
      }

      // convert to measure-by-measure self-similarity matrix
      measureKeys = Object.keys(measureView); //store original keys
      measureDict = {};
      var count = 0;
      for (key in measureView) {
        measureDict[count] = measureView[key];
        count += 1;
      }

      measureView = measureDict;
      report["MEASUREVIEW"] = measureView;

      var relations = Array(Object.keys(measureView).length).fill().map(function () {
        return Array(Object.keys(measureView).length).fill(0)
      });
      for (overkey in measureView) {
        for (iterkey in measureView) {
          var i = new Set(measureView[iterkey].map(({ name }) => name));
          var o = new Set(measureView[overkey].map(({ name }) => name));
          var intersect = new Set([...o].filter(x => i.has(x)));
          var merge = new Set([...o, ...i]);
          relations[overkey][iterkey] = intersect.size / merge.size;
        }
      }

      var soundProfile = {};

      var sectionNames = ["A", "B", "C", "D", "E", "F", "G"];
      var sectionDepth = 0;

      var thresholds = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];

      report["SOUNDPROFILE"] = {};
      numberOfDivisions = 1;

      thresholds.forEach(function(thresh) {

        var span = findSections(relations[0], thresh);
        var section_measures = convertToMeasures(span, measureKeys);

        if (section_measures.length > numberOfDivisions) {

          var sectionPairs = {};
          var sectionUse = 0;

          section_measures.forEach(function(section) {
            if(!(section.value in sectionPairs)) {
              sectionPairs[section.value] = sectionNames[sectionUse];
              sectionUse = sectionUse + 1;
            }
            section.value = sectionPairs[section.value];

            if (sectionDepth > 0) {
              section.value = section.value + sectionDepth;
            }

            // if (!soundProfile[section.value]) {
              var filled = false;
              Object.keys(soundProfile).forEach(function(profileSection) {
                if (Number(section.measure[0]) >= Number(soundProfile[profileSection].measure[0]) && Number(section.measure[1]) <= Number(soundProfile[profileSection].measure[1])) {
                  if (Number(section.measure[0]) > Number(soundProfile[profileSection].measure[0]) || Number(section.measure[1]) < Number(soundProfile[profileSection].measure[1])) {
                    
                    section.sound = {};
                    section.effect = {};

                    for (var i = section.measure[0]; i <= section.measure[1]; i++) {
                      for (var j in measureView[i]) {
                        var item = measureView[i][j];
                        var itemType = item.type;
                        if (!section[itemType][item.name])
                          section[itemType][item.name] = {measure:[], line: []};
                        section[itemType][item.name].measure.push(i);

                        apiCalls.forEach(function(codeLine) {
                          if (codeLine.args.includes(item.name))
                            if (!section[itemType][item.name].line.includes(codeLine.line))
                              section[itemType][item.name].line.push(codeLine.line);
                        });
                      }
                    }

                    soundProfile[profileSection].numberOfSubsections += 1;
                    section.value = soundProfile[profileSection].value + soundProfile[profileSection].numberOfSubsections;
                    soundProfile[profileSection].subsections[section.value] = section;

                  }
                  filled = true;
                }
              });
              if (!filled) {

                section.sound = {};
                section.effect = {};

                for (var i = section.measure[0]; i <= section.measure[1]; i++) {
                  for (var j in measureView[i]) {
                    var item = measureView[i][j];
                    var itemType = item.type;
                    if (!section[itemType][item.name])
                      section[itemType][item.name] = {measure: [], line: []};
                    section[itemType][item.name].measure.push(i);

                    apiCalls.forEach(function(codeLine) {
                      if (codeLine.args.includes(item.name))
                        if (!section[itemType][item.name].line.includes(codeLine.line))
                          section[itemType][item.name].line.push(codeLine.line);
                    });
                  }
                }

                soundProfile[section.value] = section;
                soundProfile[section.value].subsections = {};
                soundProfile[section.value].numberOfSubsections = 0;
              }
            // }

          });

          sectionDepth = sectionDepth + 1;

          report["SOUNDPROFILE"][thresh] = section_measures;
          numberOfDivisions = section_measures.length;
        }

      });

      report["SOUNDPROFILE"] = soundProfile;

      return report;
  }

  /*
  * Convert timeline representation to evaluation checklist.
  */
  function timelineToEval(output) {
    var report = {};

    report["OVERVIEW"] = output["OVERVIEW"];
    report["APICALLS"] = output["APICALLS"];

    var effectsGrade = ["Does Not Use", "Uses", "Uses Parameter", "Modifies Parameters"];
    var effectsList = ["VOLUME", "GAIN", "FILTER", "DELAY", "REVERB"];
    report["EFFECTS"] = {};

    report["EFFECTS"]["BPM"] = 'Sets BPM';
    if(output["OVERVIEW"]["tempo"] != 120) {
      report["EFFECTS"]["BPM"] = 'Sets nonstandard BPM';
    }

    effectsList.forEach(function(effectName) {
      report["EFFECTS"][effectName] = effectsGrade[0];
      if (output["EFFECTS"][effectName] != null) {
        report["EFFECTS"][effectName] = effectsGrade[output["EFFECTS"][effectName]];
      }
    });

    report["MEASUREVIEW"] = output["MEASUREVIEW"];
    report["SOUNDPROFILE"] = output["SOUNDPROFILE"];

    // Audio Recommendations per measure
    report["RECOMMENDATIONS"] = [];

    // Volume Mixing - simultaneous varying gain adjustments in separate tracks.
    report["MIXING"] = {grade: 0};

    for (i in Object.keys(report["MEASUREVIEW"]))
    {
      var recInput = [];
      var recommendedSounds = [];

      var volumeMixing = {};

      report["MEASUREVIEW"][i].forEach(function(item) {
        if (item.type === "sound") {
          recInput.push(item.name);
        }
        else if (item.type === "effect") {
          if (item.param === "GAIN" && !volumeMixing.hasOwnProperty(item.track)) {
            if (!Object.values(volumeMixing).includes(item.value)) {
              volumeMixing[item.track] = item.value;
            }
          }
        }
      });

      recommendedSounds = recommender.recommend(recommendedSounds,recInput,1,1);
      report["RECOMMENDATIONS"].push(recommendedSounds);

      report["MIXING"][i] = Object.keys(volumeMixing).length;

      if (report["MIXING"].grade < report["MIXING"][i]) {
        report["MIXING"].grade = report["MIXING"][i];
      }
    }

    report["MIXING"].grade = report["MIXING"].grade + " simultaneous unique gains."

    // temporarily disable mixing measureView for csv formatting
    // report["MIXING"] = {grade: report["MIXING"].grade};

    return report;
  }

  /*
  * Form Analysis: return list of consecutive lists of numbers from vals (number list).
  */
  function findSections(vals, threshold, step) {
    if (typeof(threshold) === 'undefined') threshold = 0.25;
    if (typeof(step) === 'undefined') step = 0;
    var run = [];
    var result = [];
    var span = [];
    var track = 0;
    var expect = null;

    for (var v in vals) {
      if (((expect + threshold) >= vals[v] && vals[v] >= (expect - threshold)) || expect == null) {
        run.push(vals[v]);
      }
      else {
        result.push(run);
        run = [vals[v]];
      }
      expect = vals[v] + step;
    }
    result.push(run);
    for (var l in result) {
      lis = result[l];
      if (lis.length != 1) {
        span.push({value: lis[0], measure: [track, track + lis.length - 1]});
        track += lis.length;
      }
      else {
        track += lis.length;
      }
    }
    return span;
  }

  /*
  * Form Analysis: convert section number to original measure number.
  */
  function convertToMeasures(span, int_rep) {
    var measure_span = [];
    for (i in span) {
      var tup = span[i].measure;
      newtup = [Number(int_rep[tup[0]]), Number(int_rep[tup[1]])];
      measure_span.push({value: span[i].value, measure: newtup});
    }
    return measure_span;
  }

  /*
  * Genre Analysis: return measure-by-measure list of closest genre.
  */
  function findGenre() {
    return 0;
  }

  /*
  * Utility Functions: parse SoundProfile.
  */
  function soundProfileLookup(soundProfile, inputType, inputValue, outputType) {

    if (inputType === "section")
      inputType = "value";

    var ret = [];
    Object.keys(soundProfile).forEach(function(sectionKey) {
      var section = soundProfile[sectionKey];

      var returnValue = soundProfileReturn(section, inputType, inputValue, outputType);

      if (returnValue !== undefined)
        returnValue.forEach(function(value) {
          if (value != [] && value != undefined && !ret.includes(value))
            ret.push(value);
        });

      if (section.subsections) {
        Object.keys(section.subsections).forEach(function(subsectionKey) {
          var subsection = section.subsections[subsectionKey];

          var returnValue = soundProfileReturn(subsection, inputType, inputValue, outputType);

          if (returnValue !== undefined)
            returnValue.forEach(function(value) {
              if (value != [] && value != undefined && !ret.includes(value))
                ret.push(value);
            });
        });
      }   

    });

    return ret;
  }

  function soundProfileReturn(section, inputType, inputValue, outputType) {
    switch(inputType) {

      case "value":
        if (section[inputType] === inputValue) {
          switch (outputType) {
            case "line":
              return linesForItem(section,"sound",-1).concat(linesForItem(section,"effect",-1));
              break;
            case "sound":
            case "effect":
              return Object.keys(section[outputType]);
              break;
            default:
              return section[outputType];
            }
        }
        break;

      case "sound":
      case "effect":
        if (Object.keys(section[inputType]).includes(inputValue)) {
          switch (outputType) {
            case "line":
              return linesForItem(section, inputType, inputValue);
              break;
            case "measure":
              return section[inputType][inputValue][outputType];
              break;
            case "sound":
            case "effect":
              return Object.keys(section[outputType]);
              break;
            default:
              return section[outputType];
          }
        }
        break;

      case "measure":
        if (section[inputType][0] < inputValue < section[inputType][1]) {
          switch (outputType) {
            case "line":
              return linesForItem(section,inputType,inputValue);
              break;
            case "sound":
            case "effect":
              return Object.keys(section[outputType]);
              break;
            default:
              return section[outputType];
          }
        }
        break;

      case "line":

        var soundAtLine = itemAtLine(section, inputValue, "sound");
        var effectAtLine = itemAtLine(section, inputValue, "effect");

        switch (outputType) {
          case "value":
          case "measure":
            if(Object.keys(soundAtLine).length > 0 || Object.keys(effectAtLine). length > 0)
              return section[outputType]; 
            else
              return [];
            break;
          case "sound":
            return soundAtLine;
            break;
          case "effect":
            return effectAtLine;
            break;
        }

      default:
        return [];

    }
  }

  function itemAtLine(section, inputValue, outputType) {
    var ret = [];
    Object.keys(section[outputType]).forEach(function(item) {
      if (section[outputType][item].line.includes(Number(inputValue))) {
        ret.push(item);
      }
    });
    return ret;
  }

  function linesForItem(section, inputType, inputValue) {
    var ret = [];

    if (inputType === "measure"){
      Object.keys(section["sound"]).forEach(function(sound) {
        if(section["sound"][sound].measure.includes(inputValue))
          ret = ret.concat(section["sound"][sound].line);
      });
      Object.keys(section["effect"]).forEach(function(effect) {
        if(section["effect"][effect].measure.includes(inputValue))
          ret = ret.concat(section["effect"][effect].line);
      });
    }
    else {
      Object.keys(section[inputType]).forEach(function(item) {
        if (item === inputValue || inputValue === -1)
          ret = ret.concat(section[inputType][item].line);
      });
    }
    return ret;
  }

  return {
      analyzeCode: analyzeCode,
      analyzeMusic: analyzeMusic,
      analyzeCodeAndMusic: analyzeCodeAndMusic,
      soundProfileLookup: soundProfileLookup,
  };

}]);



