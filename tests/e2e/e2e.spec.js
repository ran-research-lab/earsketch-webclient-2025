var EC = protractor.ExpectedConditions;

function selectItemByScriptName(name) {
  return $('#script-browser [uib-tooltip="' + name + '"]');
}

function closeTabByScriptName(name) {
  return $('#coder').element(by.cssContainingText('.nav-item', name)).$('.tab-close').click();
}

beforeAll(function () {
  browser.get('https://earsketch-dev.lmc.gatech.edu/earsketch2/');

  // close curriculum
  $('#sidenav-curriculum').click();
});

describe('General', function () {
  it('should have a title', function() {
    expect(browser.getTitle()).toEqual('EarSketch');
  });

  it('should let me login', function () {
    element(by.model('username')).sendKeys('earsketch');
    element(by.model('password')).sendKeys('earsketch');
    $('#not-logged-in .icon-arrow-right').click();
    expect($('#logged-in').getText()).toBe('earsketch');
  });

  xit('should let me change password', function () {});
  xit('should let me forget password', function () {});
  xdescribe('create a new account', function () {});
});

describe('Layout', function () {
  describe('toggle panes', function () {
    it('should open the sound browser', function () {
      // click the script-browser icon to initialize
      $('#sidenav-scriptbrowser').click().then(function () {
        // click the sound-browser icon
        $('#sidenav-filebrowser').click().then(function () {
          expect($('#sound-browser').isDisplayed()).toBeTruthy();
        });
      });
    });

    it('should open the script browser', function () {
      $('#sidenav-filebrowser').click().then(function () {
        $('#sidenav-scriptbrowser').click().then(function () {
          expect($('#script-browser').isDisplayed()).toBeTruthy();
        });
      });
    });

    it('should open the shared-script browser', function () {
      $('#sidenav-filebrowser').click().then(function () {
        $('#sidenav-sharebrowser').click().then(function () {
          expect($('#share-browser').isDisplayed()).toBeTruthy();
        });
      });
    });

    it('should open the API browser', function () {
      $('#sidenav-filebrowser').click().then(function () {
        $('#sidenav-apibrowser').click().then(function () {
          expect($('#api-browser').isDisplayed()).toBeTruthy();
        });
      });
    });

    xit('should open the curriculum pane', function () {});
  });
});

describe('Sound Browser', function () {
  function getFirstItem() {
    return element.all(by.repeater('sound in filteredSounds')).first().$('.sb-files');
  }

  beforeAll(function () {
    $('#sidenav-scriptbrowser').click();
    $('#sidenav-filebrowser').click();
  });

  it('should preview a sound', function () {
    // click the first element that has ng-click="play()" binding
    let firstItem = getFirstItem();
    firstItem.$('[ng-click="play()"]').click().then(function () {
      expect(firstItem.$('[ng-click="stop()"').isDisplayed()).toBeTruthy();
    });

    // wait
    browser.sleep(1000);
  });

  it('should show the sound tags', function () {
    // browser.ignoreSynchronization = false;

    getFirstItem().click().then(function () {
      // check tooltip element is visible
      browser.sleep(1000);
      expect($('.tooltip').isDisplayed()).toBeTruthy();
    });
  });

  it('should pagenate', function () {
    // go to next page
    $('.pagination-next').click().then(function () {
      getFirstItem().getText().then(function (text) {
        // this famous sound should not be appearing at the top anymore
        expect(text.indexOf('DUBSTEP_BASS_WOBBLE_001') === -1).toBeTruthy();
      });
    });
  });

  xit('should filter sounds', function () {});

  it('should let me search sounds', function () {
    let keyword = 'guitar';

    // search sound
    $('#sound-search').element(by.tagName('input')).sendKeys(keyword);

    // play the top result
    getFirstItem().getText().then(function (text) {
      expect(text.toLowerCase().indexOf(keyword) !== -1).toBeTruthy();
      $('#sound-search').element(by.tagName('input')).clear();
    });
  });

  xit('should let me upload sounds', function () {});

  // browser mic access permission may not be automated
  it('should let me record sounds', function () {
    let name = 'rectest';

    element(by.buttonText("ADD YOUR OWN SOUND")).click();
    $('[index="menus.record"]').click();
    $('[placeholder="e.g. MYRECORDING_01"]').sendKeys(name);
    element(by.model('recorder.properties.countoff')).clear();
    element(by.model('recorder.properties.countoff')).sendKeys(0);
    element(by.model('recorder.properties.numMeasures')).clear();
    element(by.model('recorder.properties.numMeasures')).sendKeys(1);
    $('#record-button').click();
    browser.wait(EC.visibilityOf(element(by.linkText('UPLOAD RECORDED FILE'))), 10000);
    element(by.linkText('UPLOAD RECORDED FILE')).click();
    browser.sleep(1000).then(function () {
      $('#sound-search').element(by.tagName('input')).sendKeys(name);
      getFirstItem().$('[title="Delete Sound Clip"]').click();
      element(by.buttonText('Delete')).click();
      $('#sound-search').element(by.tagName('input')).clear();
    });
  });

  it('should let me mark favorite sounds', function () {
    let allItems = element.all(by.repeater('sound in filteredSounds'));
    let numFavorites = 3;

    for (let i = 0; i < numFavorites; i++) {
      allItems.get(i).$('[title="Add to Favorites"]').click();
    }

    $('.btn-show-fav').click().then(function () {
      expect(element.all(by.repeater('sound in filteredSounds')).count()).toBe(numFavorites);

      $('.btn-show-fav').click().then(function () {
        for (let i = 0; i < numFavorites; i++) {
          allItems.get(i).$('[title="Remove from Favorites"]').click();
        }
      });
    });
  });

  // disabling: browser.waitForAngularEnabled(true) seems to be buggy
  xit('should let me paste a sound constant into a script', function () {
    $('#sidenav-scriptbrowser').click();
    selectItemByScriptName('soundBrowserTest.py').click();
    $('#sidenav-filebrowser').click();

    element.all(by.repeater('sound in filteredSounds')).first().$('[ng-click="pasteName()"]').click()
      .then(function () {
        // angular synchronization does not work well with ace editor
        browser.waitForAngularEnabled(false);

        browser.driver.findElement(by.css('#editor')).getText().then(function (text) {
          // editor content should contain the famous first audio clip
          expect(text.indexOf('DUBSTEP_BASS_WOBBLE_001') !== -1).toBeTruthy();
          $('#editor-options').click();
          $('[ng-click="editor.undo()"]').click();
          closeTabByScriptName('soundBrowserTest.py').then(function () {
            browser.waitForAngularEnabled(true);
          });
        });
      });
  });
});

describe('Scripts Browser', function () {
  function selectContextByScriptName(name) {
    return selectItemByScriptName(name).element(by.xpath('../../..')).$('.controls');
  }

  beforeAll(function () {
    $('#sidenav-filebrowser').click();
    $('#sidenav-scriptbrowser').click();

    // this does not reset protractor properly (Dec 3, 2017)
    // browser.waitForAngularEnabled(true);
  });

  describe('opening script', function () {
    it('should open the top script and then close', function () {
      $$('#script-browser .item').first().click();
      // check

      // close the first tab
      $$('.tab-close').first().click();

      //check
    });

    it('should open the top script from context menu and then close', function () {
      $$('#script-browser .controls .dropdown').first().click();
      $$('.sb-control-dropdown [ng-click="selectScript(script)"]').first().click();
      $$('.tab-close').first().click();
    });

    it('should open the script "test.py" and then close', function () {
      selectItemByScriptName('test.py').click();
      closeTabByScriptName('test.py');
    });
  });

  describe('renaming script', function () {
    it('should open the context menu for "renameMe.py" and rename to "renamed.py', function () {
      element.all(by.repeater('script in filteredScriptsList')).each(function (e, i) {
        e.$('.name').getText().then(function (text) {
          if (text === 'renameMe.py') {
            e.$('.controls').click();
            $$('.sb-control-dropdown').get(i).element(by.linkText('Rename')).click();
            $$('.input-group input').first().sendKeys('renamed');
            element(by.buttonText('Rename')).click();
            // check
          }
        });
      });

      browser.sleep(1000);
    });

    it('should rename "renamed.py" back to "renameMe.py"', function () {
      element.all(by.repeater('script in filteredScriptsList')).each(function (e, i) {
        e.$('.name').getText().then(function (text) {
          if (text === 'renamed.py') {
            e.$('.controls').click();
            $$('.sb-control-dropdown').get(i).element(by.linkText('Rename')).click();
            $$('.input-group input').first().sendKeys('renameMe');
            element(by.buttonText('Rename')).click();
            // check
          }
        });
      });
      browser.sleep(1000);
    });
  });

  describe('deleting script', function () {
    it('should delete "deleteMe.py"', function () {
      element.all(by.repeater('script in filteredScriptsList')).each(function (e, i) {
        e.$('.name').getText().then(function (text) {
          if (text === 'deleteMe.py') {
            e.$('.controls').click();
            $$('.sb-control-dropdown').get(i).element(by.linkText('Delete')).click();
            element(by.buttonText('Delete')).click();
            // check if "SHOW DELETED SCRIPTS" button appears
            // check
          }
        });
      });

      browser.sleep(2000);
    });

    it('should undelete "deleteMe.py"', function () {
      // click the "SHOW DELETED SCRIPTS" button
      $('.btn-show-deleted-scripts').click();

      selectContextByScriptName('deleteMe.py').click();
      element(by.buttonText('Yes')).click();
      closeTabByScriptName('deleteMe.py');
    });
  });

  describe('viewing script complexity', function () {
    it('should view complexity of "complexityTest.py"', function () {
      element.all(by.repeater('script in filteredScriptsList')).each(function (e, i) {
        e.$('.name').getText().then(function (text) {
          if (text === 'complexityTest.py') {
            e.$('.controls').click();
            $$('.sb-control-dropdown').get(i).element(by.linkText('Code Indicator')).click();
            // Check if we have the correct complexity
            expect(element(by.id('totalScriptScore')).getText()).toBe('30');
            element(by.buttonText('Exit')).click();
          }
        });
      });
    });
  });

  xdescribe('sharing script', function () {});

  describe('search scripts', function () {
    it('should only list "searchMe.js"', function () {
      let keyword = 'searchMe';
      $('#script-search').element(by.tagName('input')).sendKeys(keyword).then(function () {
        let items = element.all(by.repeater('script in filteredScripts'));
        expect(items.count()).toBe(1);

        items.first().getText().then(function (text) {
          expect(text.indexOf(keyword) !== -1).toBeTruthy();
          $('#script-search').element(by.tagName('input')).clear();
        });
      });
    });
  });

  xdescribe('filter scripts', function () {});

  xdescribe('sort scripts', function () {});
});

describe('API Browser', function () {
  beforeAll(function () {
    $('#sidenav-filebrowser').click();
    $('#sidenav-apibrowser').click();    
  });

  it('should search', function () {
    element(by.model('apisearch')).sendKeys('fit');

    // the first result should contain "fitMedia" in text
    element.all(by.repeater('(key, obj) in apiList')).first().getText().then(function (text) {
      expect(text.indexOf('fitMedia') !== -1).toBeTruthy();
      element(by.model('apisearch')).clear();
    });
  });

  it('should show the details', function () {
    let firstItem = element.all(by.repeater('(key, obj) in apiList')).first();
    firstItem.$('.api-browser .name').click()
      .then(function () {
        expect(firstItem.$('.api-browser .details-container').isDisplayed()).toBeTruthy();
      });
  });

  xit('should show hints', function () {});

  xit('should paste into code', function () {});

  xit('should listen to the language mode', function () {});
});

xdescribe('Code Editor', function () {});

describe('DAW', function () {
  beforeAll(function () {
    $('#sidenav-filebrowser').click();
    $('#sidenav-scriptbrowser').click();
    selectItemByScriptName('dawTest.py').click();
    $('#run-button').click();
  });

  it('should play', function () {
    $('#dawHeader [title="Play"]').click().then(function () {
      expect($('#dawHeader [title="Pause"]').isDisplayed()).toBeTruthy();
      browser.sleep(1000);
    });
  });

  it('should change volume', function () {
    let slider = $('#dawVolumeSlider');
    browser.actions().dragAndDrop(slider, {x:-20, y:0}).perform();
    browser.sleep(1000);
  });

  it('should toggle metronome', function () {
    $('#dawMetronomeButton').click();
    browser.sleep(1000);
  });

  it('should let me zoom', function () {
    let hSlider = $('#horz-zoom-slider-container .rz-pointer-min');
    let vSlider = $('#vert-zoom-slider-container .rz-pointer-min');

    browser.actions().dragAndDrop(hSlider, {x:100, y:0}).perform();
    browser.sleep(1000);
    browser.actions().dragAndDrop(vSlider, {x:0, y:50}).perform();
    browser.sleep(1000);
  });

  it('should pause', function () {
    $('#dawHeader [title="Pause"]').click().then(function () {
      expect($('#dawHeader [title="Play"]').isDisplayed()).toBeTruthy();   
    });
  });

  xit('should toggle looping', function () {});
});

describe('Curriculum', function () {
  it('should open the curriculum pane', function () {
    // click the script-browser icon
    $('#sidenav-curriculum').click().then(function () {
      expect($('#curriculum').isDisplayed()).toBeTruthy();
    });
  });

  it('should paste curriculum code', function () {
    // click unit 1
    $('#toc').$$('.toc-items').get(1).click();

    // click chapter 2
    $$('.toc-chapters').get(2).click();

    // click the paste-code button
    $('.copy-btn-python').click();

    // the editor tabs should now include "Beats.py"
    expect($('#coder').element(by.cssContainingText('.nav-item', 'Beats.py')).isDisplayed()).toBeTruthy();
    closeTabByScriptName('Beats.py');
  });

  it('should pagenate', function () {
    $('#curriculum-footer').$('#right-button').click();
    $('#curriculum-footer').$('#current-section').getText().then(function (text) {
      expect(text.indexOf('2.2') !== -1).toBeTruthy();
    });
  });

  it('should show slides', function () {
    $('#curriculum-header').$('.btn-slides').click().then(function () {
      expect($('.slide-container').isDisplayed()).toBeTruthy();
      $('#curriculum-header').$('.btn-slides').click();
    });
  });

  xit('should play inline audio', function () {});

  xit('should play inline video', function () {
    $('#curriculum-search').element(by.tagName('input')).sendKeys('Getting Started').then(function () {
      $('.curriculum-search-results').$$('.search-item').first().click();
      // video playback cannot be triggered natively by element locators
    });
  });

  xit('should search curriculum', function () {});

  xit('should toggle full screen', function () {});
});

afterAll(function () {
  browser.explore();
});