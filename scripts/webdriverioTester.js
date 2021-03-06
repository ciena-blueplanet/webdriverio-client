#! /usr/bin/env node

/**
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2015 Ciena Corporation. All rights reserved
 */

'use strict'

/**
 * @typedef Result
 * @property {Number} code - the exit code of the command
 * @property {String} stdout - the standard output from command
 */

const _ = require('lodash')
const Q = require('q')
const path = require('path')
const exec = require('child_process').exec
const sleep = require('sleep')
const argv = require('minimist')(process.argv.slice(2), {
  'boolean': 'app'
})

/**
 * Helper for creating a promise (so I don't need to disable new-cap everywhere)
 * @param {*} resolution - what to resolve the promise with
 * @returns {Promise} the promise
 */
function makePromise (resolution) {
  return Q(resolution) // eslint-disable-line new-cap
}

/** @alias tester */
const ns = {
  /**
   * Initialize the module
   * @returns {tester} the tester instance
   */
  init () {
    // this is on the object for eaiser mocking
    this.exec = Q.denodeify(exec)
    return this
  },

  /**
   * obvious
   * @param {String} filename - the filename to remove
   * @returns {Promise} resolved with result of exec
   */
  remove (filename) {
    return this.exec('rm -rf ' + filename)
  },

  /**
   * obvious
   * @param {String[]} extras - extra files/directories to include in tarball
   * @returns {Promise} resolved when done
   */
  tarUpAppAndTestsDirectory (extras) {
    let cmd = [
      'tar', '--exclude="*.map"', '-czf', 'test.tar.gz',
      process.env['E2E_TESTS_DIR'], process.env['BUILD_OUTPUT_DIR']
    ]
    cmd = cmd.concat(extras)

    return this.exec(cmd.join(' '))
  },

  /**
   * Create a tarball of the resources to submit
   * @param {Boolean} isApp - true if we need to fake the demo directory
   * @param {String[]} extras - optional extra files/directories to include in tarball
   * @returns {Promise} resolved when done
   */
  createTarball (isApp, extras) {
    return this.tarUpAppAndTestsDirectory(extras)
  },

  /**
   * Submit the tarball for test
   * @param {String} server - the protocol/host/port of the server
   * @returns {Promise} resolved when done
   */
  submitTarball (server) {
    console.log('Submitting bundle to ' + server + ' for test...')

    const cmd = [
      'curl',
      '-s',
      '-F',
      '"tarball=@test.tar.gz"',
      '-F',
      '"entry-point=' + process.env['BUILD_OUTPUT_DIR'] + '/"',
      '-F',
      '"tests-folder=' + process.env['E2E_TESTS_DIR'] + '"',
      server + '/'
    ]

    console.log('Running command: ' + cmd.join(' '))

    return this.exec(cmd.join(' ')).then((res) => {
      const stdout = res[0]
      const timestamp = stdout.toString()
      console.log('TIMESTAMP: ' + timestamp)
      return timestamp
    })
  },

  /**
   * Wait till the server is done with our tests
   * @param {String} cmd - the command to execute to check for results
   * @param {Number} pollInterval - the poll interval in seconds
   * @returns {Promise} resolved when done
   */
  checkForResults (cmd, pollInterval) {
    console.log('Checking for results...')
    return this.exec(cmd).then((res) => {
      const stdout = res[0]
      if (stdout.toString().toLowerCase() === 'not found') {
        sleep.sleep(pollInterval)
        return this.checkForResults(cmd, pollInterval)
      } else {
        return makePromise()
      }
    })
  },

  /**
   * Wait till the server is done with our tests
   * @param {Object} params - object for named parameters
   * @param {String} params.timestamp - the timestamp of the results we're waiting for
   * @param {String} params.server - the protocol/host/port of the server
   * @param {Number} params.initialSleep - the initial sleep time in seconds
   * @param {Number} params.pollInterval - the poll interval in seconds
   * @returns {Promise} resolved when done
   */
  waitForResults (params) {
    console.log('Waiting ' + params.initialSleep + 's before checking')
    sleep.sleep(params.initialSleep)

    const cmd = 'curl -s ' + params.server + '/status/' + params.timestamp
    return this.checkForResults(cmd, params.pollInterval)
  },

  /**
   * Fetch the results from the server
   * @param {String} url - the url to fetch results from
   * @returns {Promise} resolved when done
   */
  getResults (url) {
    return this.exec('curl -s ' + url).then((res) => {
      const stdout = res[0]
      console.log('Parsing results...')
      const obj = JSON.parse(stdout.toString())
      return obj
    })
  },

  /**
   * obvious
   * @param {String} url - the URL to get the tarball from
   * @returns {Promise} resolved when done
   */
  getTarball (url) {
    return this.exec('curl -s -O ' + url)
  },

  /**
   * Obvious
   * @param {WebdriverioServerTestResults} results - details of the test results
   * @returns {Promise} resolved when done
   */
  extractTarball (results) {
    const filename = path.basename(results.output)
    return this.exec('tar -xf ' + filename).then(() => {
      return {
        filename: filename,
        results: results
      }
    })
  },

  /**
   * Parse and output the results
   * @param {String} timestamp - the timestamp of the results we're processing
   * @param {String} server - the protocol/host/port of the server
   * @returns {Promise} resolved when done
   */
  processResults (timestamp, server) {
    const url = server + '/screenshots/output-' + timestamp + '.json'

    return this.getResults(url)
      .then((results) => {
        const url = server + '/' + results.output
        return this.getTarball(url).then(() => {
          return results
        })
      })
      .then((results) => {
        return this.extractTarball(results)
      })
      .then((params) => {
        return this.remove(params.filename).then(() => {
          return params.results
        })
      })
      .then((results) => {
        console.log(results.info)

        console.log('----------------------------------------------------------------------')
        console.log('Screenshots directory updated with results from server.')

        if (results.exitCode === 0) {
          console.log('Tests Pass.')
        } else {
          console.log('Tests FAILED')
          process.exit(1)
        }
      })
      .catch((err) => {
        throw new Error(err)
      })
  },

  /**
   * Actual functionality of the 'webdriverio-test' command
   * @param {MinimistArgv} argv - the minimist arguments object
   * @throws CliError
   */
  command (argv) {
    _.defaults(argv, {
      initialSleep: 10,
      pollInterval: 3,
      server: 'http://localhost:3000'
    })

    const extras = argv._.slice(1)
    console.log('isApp is :' + argv.app)

    this.createTarball(argv.app, extras)
      .then(() => {
        return this.submitTarball(argv.server)
      })
      .then((timestamp) => {
        return this.remove('test.tar.gz').then(() => {
          return timestamp
        })
      })
      .then((timestamp) => {
        const params = {
          timestamp: timestamp,
          server: argv.server,
          pollInterval: argv.pollInterval,
          initialSleep: argv.initialSleep
        }

        return this.waitForResults(params).then(() => {
          return timestamp
        })
      })
      .then((timestamp) => {
        return this.processResults(timestamp, argv.server)
      })
      .done()
  }
}

function factory () {
  return Object.create(ns).init()
}

factory.proto = ns

factory().command(argv)
