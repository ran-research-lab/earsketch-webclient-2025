exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  capabilities: {
      browserName: 'chrome',
      chromeOptions: {
        args: [
        // '--headless',
        'use-fake-device-for-media-stream',
        'use-fake-ui-for-media-stream'],
      }
  },
  specs: ['e2e.spec.js'],
  jasmineNodeOpts: {
    showColors: true,
      defaultTimeoutInterval: 10 * 60 * 1000 // default 25000
  }
};
