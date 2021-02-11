 "use strict";

module.exports = function(config) {
  config.set({
    frameworks: [ 'mocha' ],
    files: [
        "./packages/ethers/dist/ethers-all.umd.min.js",
        "./packages/tests/dist/tests.umd.js",
    ],
    reporters: [ 'karma' ],
    plugins: [
      'karma-mocha',
      'karma-chrome-launcher',
      require('./packages/tests/karma-reporter')
    ],
    port: 9876,
    logLevel: config.LOG_INFO,
    browsers: [ 'ChromeHeadless', "HeadlessLittleLiar" ],
    autoWatch: false,
    singleRun: true,
    browserNoActivityTimeout: 600000,

    customLaunchers: {
      HeadlessLittleLiar: {
        base: 'ChromeHeadless',
        // https://peter.sh/experiments/chromium-command-line-switches/
        flags: [
            '--disable-extensions',

            // Enable this to help debug CORS issues (otherwise fetch throws a useless TypeError)
            //'--disable-web-security',

            '--enable-automation',

            // Cloudflare will block (on the testnet endpoints) any traffic
            // from a headless chome (based on the user agent), so we lie
            // This was take from Safari, because that is what I had on-hand
            '--user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15']
      }
    },
    /*
    client: {
      mocha: {
        grep: 'Etherscan',
      }
    }
    */
  })
}
