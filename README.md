[ci-img]: https://img.shields.io/travis/ciena-blueplanet/webdriverio-client.svg "Travis CI Build Status"
[ci-url]: https://travis-ci.org/ciena-blueplanet/webdriverio-client

[cov-img]: https://img.shields.io/coveralls/ciena-blueplanet/webdriverio-client.svg "Coveralls Code Coverage"
[cov-url]: https://coveralls.io/github/ciena-blueplanet/webdriverio-client

[npm-img]: https://img.shields.io/npm/v/webdriverio-client.svg "NPM Version"
[npm-url]: https://www.npmjs.com/package/webdriverio-client


# webdriverio-client

This is a client for [webdriverio-server](https://github.com/ciena-blueplanet/webdriverio-server).
If you don't have a server to test against. Go figure that out first.

## Setting up your project for e2e testing

1. Install `webdriverio-client` in your project:

    ```bash
    npm install webdriverio-client --save-dev
    ```

1. Create the directory structure required for the e2e tests, screenshots and jasmine config file.

    ```bash
    mkdir -p tests/e2e/screenshots
    ```

1. Create `tests/e2e/jasmine.json` and add the following...

    ```json
    {
        "spec_dir": "tests",
        "spec_files": [
            "e2e/**/*-spec.js"
        ]
    }
    ```

1. Create a test. Now, we are ready to create an e2e test. Create `tests/e2e/main-spec.js` and paste the following...

    ```javascript
    var webdriverio = require('webdriverio');
    var webdrivercss = require('webdrivercss');
    var testUtils = require('../../testUtils/utils').e2e
    var testConfig = require('./test-config.json');

    var url = testUtils.getUrl(testConfig);

    var NORMAL_VIEWPORT_WIDTH = 1280;
    var NORMAL_VIEWPORT_HEIGHT = 800;

    describe('myapp e2e tests using ' + url, function () {
        var client, commonScreenshots;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 9999999;

        beforeEach(function () {
            commonScreenshots = {
                name: 'content',
                elem: 'html',
            };

            client = testUtils.init(webdriverio, webdrivercss, testConfig);

            client
                .setViewportSize({width: NORMAL_VIEWPORT_WIDTH, height: NORMAL_VIEWPORT_HEIGHT})
                .url(url);
        });

        afterEach(function (done) {
        client.end(done);
        });

        it('main-page renders appropriately', function (done) {
            client
                .pause(1000)
                .verifyScreenshots('main-page', [commonScreenshots], function () {
                client.call(done);
                });
        });

    });
    ```

1. Build your app into the `dist/` directory. Your app should build all its assets into a single directory. You should be able to run an http server in this directory and see the entire app. Perhaps your app builds into a different directory. If so, copy all the build artifacts into `dist/` for now. If your application has a mode in which it can run using test data only, build the app in this mode.

1. Test it out:

    ```bash
    $ webdriverio-client local_e2e_test dist tests/e2e
    DOCKER_CONTAINER: 15d2c2312f0e
    DOCKER_PORT: 32782
    Removing everything but *.baseline.png files from tests/e2e/screenshots
    webdriver server : localhost:32782
    isApp is :false
    Submitting bundle to localhost:32782 for test...
    Running command: curl -s -F "tarball=@test.tar.gz" -F "entry-point=dist/" -F "tests-folder=tests/e2e" localhost:32782/
    TIMESTAMP: 1482282334
    Waiting 10s before checking
    Checking for results...
    Checking for results...
    Parsing results...
    -INPUT VARIABLES---------------
    tarball: test.tar.1482282333713.gz
    entry-point: dist/
    timestamp: 1482282334
    -------------------------------
    Processing test.tar.1482282333713.gz...
    + set -e
    + set -u
    + TARBALL=test.tar.1482282333713.gz
    + ENTRY_POINT=dist/
    + TIMESTAMP=1482282334
    + TESTS_FOLDER=tests/e2e
    + TEST_CONFIG=tests/e2e/test-config.json
    + NODE_SPECS=tests/e2e
    + echo '-INPUT VARIABLES---------------'
    + echo tarball: test.tar.1482282333713.gz
    + echo entry-point: dist/
    + echo timestamp: 1482282334
    + echo -------------------------------
    + cd /opt/node-envs/6.9.2/lib/node_modules/webdriverio-server/src/..
    + echo Processing test.tar.1482282333713.gz...
    + mkdir build-1482282334
    + ln -s ../build/node_modules build-1482282334/node_modules
    + ln -s ../testUtils build-1482282334/testUtils
    + cd build-1482282334
    + tar -xzf ../uploads/test.tar.1482282333713.gz
    + testIt
    + echo Testing...
    Testing...
    ++ getOpenPort
    ++ perl -MSocket -le 'socket S, PF_INET, SOCK_STREAM,getprotobyname("tcp"); $$port = int(rand(1080))+1080; ++$$port until bind S, sockaddr_in($$port,inet_aton("127.1")); print $$port'
    + HTTP_PORT=1383
    ++ lsof -t -i:1383
    + kill
    + echo ''

    ++ pwd
    + CURRENT_DIR=/opt/node-envs/6.9.2/lib/node_modules/webdriverio-server/build-1482282334
    + cd dist/
    + waitForPort 1383
    + grep -v 1383
    + /opt/node-envs/6.9.2/lib/node_modules/webdriverio-server/build-1482282334/node_modules/.bin/http-server -s -c-1 -p 1383
    ++ lsof -iTCP -sTCP:LISTEN -P
    COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME node 42 root 10u IPv6 96480 0t0 TCP *:3001 (LISTEN)
    + sleep 1
    + grep -v 1383
    ++ lsof -iTCP -sTCP:LISTEN -P
    + cd /opt/node-envs/6.9.2/lib/node_modules/webdriverio-server/build-1482282334
    ++ getOpenPort
    ++ perl -MSocket -le 'socket S, PF_INET, SOCK_STREAM,getprotobyname("tcp"); $$port = int(rand(1080))+1080; ++$$port until bind S, sockaddr_in($$port,inet_aton("127.1")); print $$port'
    + SELENIUM_PORT=2133
    ++ lsof -t -i:2133
    + kill
    + echo ''

    + waitForPort 2133
    + grep -v 2133
    + ./node_modules/.bin/webdriver-manager start --seleniumPort 2133
    ++ lsof -iTCP -sTCP:LISTEN -P
    COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME node 42 root 10u IPv6 96480 0t0 TCP *:3001 (LISTEN) node 65 root 10u IPv4 97447 0t0 TCP *:1383 (LISTEN)
    + sleep 1
    + grep -v 2133
    ++ lsof -iTCP -sTCP:LISTEN -P
    + ../bin/replace.js tests/e2e/test-config.json selenium.host:localhost selenium.port:2133 http.host:localhost http.port:1383 http.entryPoint:/
    + echo 'Running jasmine tests with http port 1383 and selenium port 2133'
    + echo
    + TEST_STATUS=0
    + ./node_modules/.bin/jasmine JASMINE_CONFIG_PATH=tests/e2e/jasmine.json
    Running jasmine tests with http port 1383 and selenium port 2133

    Started
    (node:120) DeprecationWarning: 'GLOBAL' is deprecated, use 'global'
    .


    1 spec, 0 failures
    Finished in 8.64 seconds

    ++ lsof -t -i:1383
    + kill 65
    ++ lsof -t -i:2133
    + kill 88
    + tar -cf ../screenshots/1482282334.tar tests/e2e/screenshots
    + cd /opt/node-envs/6.9.2/lib/node_modules/webdriverio-server/src/..
    + rm -rf build-1482282334
    + exit 0

    ----------------------------------------------------------------------
    Screenshots directory updated with results from server.
    Tests Pass.
    Reverting any changes in tests/e2e/screenshots
    error: pathspec 'tests/e2e/screenshots' did not match any file(s) known to git.
    Not using git
    ```

    The first argument to `webdriverio-server`, `local_e2e_test` runs tests on a docker container attached 
    to this system (the other option is `remote_e2e_test`; if you choose this option, the next argument needs to be `name:port` of the 
    server to send your  `dist` and `tests/e2e` directories to). The last arguments tell where the built files are and where the
    test files are, respectively.

1. Take a look at the screenshot file that was created in the `tests/e2e/screenshots` directory.

1. Add some script shortcuts for e2e testing. Edit `package.json` and add the following  two commands to the scripts section (create the `scripts` sections if its missing):

    ```json
    "scripts": {
        "local-e2e-test": "wdio-client local_e2e_test dist tests/e2e",
        "update-screenshots": "wdio-client update_screenshots"
    }
    ```



Also, add the following to `.gitignore`...

```
test.tar.gz
tests/e2e/test-config.json
tests/e2e/screenshots/diff
```


Since this test executes on the `webdriverio-server`, the dependencies only need to be installed on the server machine (they are, when using the webdriverio-server). So we don't need to worry about all the requires at the top.


### Running the tests

To execute e2e tests...

```bash
npm run e2e-test
```

If tests fail because of a mismatch in screenshots, you can inspect the differences by checking out the images in `tests/e2e/screenshots/diff`.

If the new screenshots are accurate, you can update your reference screenshots by running

```bash
npm run update-screenshots
```
