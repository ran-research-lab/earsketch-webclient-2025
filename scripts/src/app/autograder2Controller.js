/**
 * @module autograderController
 */

app.controller("autograder2Controller",
['$scope','compiler', 'Upload','userConsole','esconsole','ESUtils', 'userProject', '$http',
function($scope, compiler, Upload, userConsole, esconsole, ESUtils, userProject, $http) {

    $scope.load = function(scriptname) {
      $scope.testScript = 'Fetching sample script. One second...';
      $http.get(SITE_BASE_URI + '/autograder2/' + scriptname).then(function(result) {
        $scope.testScript = result.data;
      });
    }

    // Loading ogg by default for browsers other than Safari
    // setting default to wav for chrome 58 (May 22, 2017)
    if (ESUtils.whichBrowser().match('Opera|Firefox|Msie|Trident') !== null) {
        $scope.quality = true;//false wav, true ogg
    } else {
        $scope.quality = false;//false wav, true ogg
    }

    $scope.results = [];
    $scope.processing = null;

    /**
     * Compile a script as python or javascript based on the extension and
     * return the compilation promise.
     */
    $scope.compile = function(script) {
      return $scope.compileTest($scope.testScript, script, $scope.quality);
    };

    /**
     * Read all script urls, parse their shareid, and then load and run
     * every script adding the results to the results list.
     */
    $scope.run = function() {
      $scope.results = [];
      $scope.processing = null;

      esconsole("Running autograder.", ['DEBUG']);
      var shareUrls = $scope.urls.split('\n');
      var re = /\?sharing=([^\s.,;])+/g
      var matches = $scope.urls.match(re);

      // start with a promise that resolves immediately
      var p = new Promise(function(resolve) { resolve(); });

      //for (var i = 0; i < shareUrls.length; i++) {
      angular.forEach(matches, function(match) {
        esconsole("Grading: " + match, ['DEBUG']);
        //var shareId = ESUtils.parseShareId(url);
        var shareId = match.substring(9);
        esconsole("ShareId: " + shareId, ['DEBUG']);
        p = p.then(function() {
          $scope.processing = shareId;
          return userProject.loadScript(shareId).then($scope.runScript);
        });
      });
    };

    /**
     * Run a single script and add the result to the results list.
     */
    $scope.runScript = function(script) {
      console.log("run script", script.name);
      return $scope.compile(script).then(function(reports) {
          console.log(reports)
          esconsole(reports, ['DEBUG']);
          $scope.results.push({
            script: script,
            reports: reports,
          });
          $scope.$apply();
          $scope.processing = null;
        }).catch(function(err) {
          esconsole(err, ['ERROR']);
          $scope.results.push({
            script: script,
            error: err,
          });
          $scope.$apply();
          $scope.processing = null;
      });
    };

    /**
     * Function to pipe Skulpt's stdout to the EarSketch console.
     *
     * @private
     */
    function outf(text) {
        // For some reason, skulpt prints a newline character after every
        // call to print(), so let's ignore those
        // TODO: users can't print newline characters...ugh
        if (text == '\n') {
            return;
        }
        console.log(text);
        esconsole('outf text is ' + text, ['INFO', 'IDE']);
        userConsole.log(text);
    }

    /**
     *
     * @private
     */
    function builtinRead(x) {
        if (Sk.builtinFiles === undefined ||
            Sk.builtinFiles["files"][x] === undefined) {
            throw "File not found: '" + x + "'";
        }
        return Sk.builtinFiles["files"][x];
    }

    Sk.pre = "output";
    Sk.configure({output:outf,read: builtinRead});

    Sk.onAfterImport = function(library) {
      switch(library) {
        case 'random':
          break;
      }
    };

    /**
     * Compile the test script.
     *
     * @param {string} reference The test script to run on each input script.
     * @param {object} target The student code to evaluate.
     * @param {int} quality Numeric value for the audio quality to load.
     * @returns {Promise} A promise that resolves to the compiled result object.
     */
    $scope.compileTest = function(reference, target, quality) {

        esconsole('Loading EarSketch library from: '+ SITE_BASE_URI+
                  '/scripts/src/api/autograder.py.js');
        Sk.externalLibraries = {
            // import EarSketch library into skulpt
            autograder : {
                path: SITE_BASE_URI + '/scripts/src/api/autograder.py.js'
                //path: SITE_BASE_URI + '/scripts/src/api/earsketch.py.js'
            }
        };

        var lines = reference.match(/\n/g).length + 1;
        esconsole(
            'Compiling ' + lines + ' lines of Python', ['DEBUG','COMPILER']
        );

        // STEP 1: get a list of constants from the server and inject them into
        // the skulpt list of builtins
        return new Promise(function(resolve) {
            Sk.builtins['__AUDIO_QUALITY'] = quality;
            Sk.builtins['__SCRIPT'] = target;
            resolve();
        }).catch(function(err) {
            esconsole(err, ['ERROR','COMPILER']);
        // STEP 2: compile python code using Skulpt
        }).then(function() {
            esconsole('Compiling script using Skulpt.', ['DEBUG','COMPILER']);
            return Sk.misceval.asyncToPromise(function() {
                try {
                    return Sk.importMainWithBody("<autograder>", false, reference, true);
                } catch(err) {
                    esconsole(err, ['ERROR','COMPILER']);
                    throw err;
                }
            });
        }).catch(function(err) {
            throw err; // catch Skulpt errors

        // STEP 3: Extract the result object from within the EarSketch module.
        }).then(function(mod) {
            esconsole('Compiling finished. Extracting result.',
                      ['DEBUG','COMPILER']);
            if (mod.$d.autograder && mod.$d.autograder.$d._getReports) {
                // case: import autograder
                return Sk.ffi.remapToJs(
                    Sk.misceval.call(mod.$d.autograder.$d._getReports)
                ); // result
            } else if (mod.$d._getReports) {
                // case: from autograder import *
                return Sk.ffi.remapToJs(
                    Sk.misceval.call(mod.$d._getReports)
                ); // result
            } else {
                throw new ReferenceError(
                    "Something went wrong. Skulpt did not provide the " +
                    "expected output.");
            }
        }).catch(function(err) {
            throw err;
        });
    };

    $scope.generateCSV = function() {
      var headers = ['username', 'script_name', 'shareid', 'error'];
      var rows = [];
      var col_map = {};

      for (var i = 0; i < $scope.results.length; i++) {
        var result = $scope.results[i];
        if (result.reports) {
          for (var j = 0; j < Object.keys(result.reports).length; j++) {
            var name = Object.keys(result.reports)[j];
            var report = result.reports[name];
            if (col_map[name] === undefined) {
              col_map[name] = {};
            }
            for (var k = 0; k < Object.keys(report).length; k++) {
              var key = Object.keys(report)[k];
              var colname = name + '_' + key;
              if (headers.indexOf(colname) === -1) {
                headers.push(colname);
                col_map[name][key] = headers.length - 1;
              }
            }
          }
        }
      }
      angular.forEach($scope.results, function(result) {
        row = [];
        for (var i = 0; i < headers.length; i++) {
          row[i] = '';
        }
        if (result.script) {
          row[0] = result.script.username;
          row[1] = result.script.name;
          row[2] = result.script.shareid;
        }
        if (result.error) {
          console.log(result.error)
          if (result.error.nativeError) {
            row[3] = result.error.nativeError.v + ' on line ' + result.error.traceback[0].lineno;
          } else {
            row[3] = result.error;
          }
        } else if (result.reports) {
          angular.forEach(result.reports, function(report, name) {
            angular.forEach(Object.keys(report), function(key) {
              row[col_map[name][key]] = report[key];
            });
          });
        }

        rows.push(row.join(','));
      });

      return headers.join(',') + '\n' + rows.join('\n');
    };

    $scope.download = function() {
      var file = $scope.generateCSV();
      var a = document.createElement("a");
      document.body.appendChild(a);
      a.style = "display: none";

      var aFileParts = [file];
      var blob = new Blob(aFileParts, {type: 'text/plain'});
      var url = window.URL.createObjectURL(blob);
      // download the script
      a.href = url;
      a.download = 'autograder_report.csv';
      a.target = '_blank';
      esconsole('File location: ' + a.href, ['debug','exporter']);
      a.click();
      //window.URL.revokeObjectURL(url);
    };

}]);

app.directive("codeWrite", [function() {
  return {
    scope: {
      language: "=",
      ngModel: "=",
    },
    require: '?ngModel',
    transclude: true,
    link: function (scope, element, attributes, ngModel) {
      var editor = ace.edit(element[0]);
      editor.setOptions({
          mode: 'ace/mode/python',// + scope.language,
          theme: 'ace/theme/github',
          showPrintMargin: false,
          wrap: true
      });
      editor.on('change', function () {
        scope.ngModel = editor.getValue();
      });
      ngModel.$render = function() {
        editor.setValue(ngModel.$viewValue, -1);
      };
    }
  };
}]);

