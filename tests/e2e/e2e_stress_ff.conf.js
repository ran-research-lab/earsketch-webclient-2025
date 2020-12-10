var numInstances = 10;

exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  capabilities: {
      browserName: 'firefox',
      'moz:firefoxOptions': {
          args: ["--headless"]
      },
      maxInstances: numInstances,
      count: numInstances
  },
  specs: ['e2e_stress.spec.js'],
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 10 * 60 * 1000 // default 25000
  },
  allScriptsTimeout: 2147483647
};
