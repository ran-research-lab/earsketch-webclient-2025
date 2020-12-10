// reference: https://github.com/angular/protractor/blob/master/docs/browser-setup.md

browser.get('https://earsketch-dev.lmc.gatech.edu/earsketch2/');

var browser2 = browser.forkNewDriverInstance(true);
var element2 = browser2.element;
var $2 = browser2.$;
var $$2 = browser2.$$;

beforeAll(function () {
  // close curriculum
  $('#sidenav-curriculum').click();
  $2('#sidenav-curriculum').click();

  // log in to the browser 1
	element(by.model('username')).sendKeys('earsketch');
  element(by.model('password')).sendKeys('earsketch');
  $('#not-logged-in .icon-arrow-right').click();
  expect($('#logged-in').getText()).toBe('earsketch');

  // log in to the browser 2
	element2(by.model('username')).sendKeys('earsketch2');
  element2(by.model('password')).sendKeys('earsketch2');
  $2('#not-logged-in .icon-arrow-right').click();
  expect($2('#logged-in').getText()).toBe('earsketch2');

  $('#sidenav-scriptbrowser').click();
  $2('#sidenav-sharebrowser').click();
});

describe('Collaboration', function () {
	it('should open the collaborative scripts', function () {
		let name = 'collabTest.py';
		$('#script-browser [uib-tooltip="' + name + '"]').click();
		$$2('.share-browser').first().$('[uib-tooltip="' + name + '"]').click();
	});
});

describe('Notification', function () {});

afterAll(function () {
  browser.explore();
  browser2.explore();
});