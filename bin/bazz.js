#!/usr/bin/env node
'use strict'

/**
 * exit code number for bazz shutting down on failure
 *
 * @const
 * @type {number}
 */
const EXIT_CODE_ERROR = -1

/**
 * flag to enable/disable verbose spinner status print to STDOUT
 *
 * @const
 * @type {number}
 */
const VERBOSE = !process.env.BAZZ_SILENT

const debug = require('debug')('bazz')
const childProcess = require('child_process')
const ora = require('ora')

const BazzManager = require('../src/BazzManager')

const bazzManager = new BazzManager()
const spinner = ora()

VERBOSE && spinner.start('Bazz initializing...')

Promise.resolve()
  .then(() => {
    spinner.text = 'Bazz login'
    return bazzManager.login().then(() => {
      VERBOSE && spinner.stop()
    })
  })
  .then(() => {
    executeProgram()
  })
  .catch(error => {
    exitError(error)
  })

/**
 * spawn the program process with any command provided arguments
 */
function executeProgram () {
  debug('executing program')

  const program = process.argv[2]
  const args = process.argv.slice(3)

  debug('parsed command: %s', JSON.stringify(program))
  debug('parsed command arguments: %s', JSON.stringify(args))

  const child = childProcess.spawn(program, args, {
    stdio: 'inherit',
    shell: true
  })

  child.on('close', exitCode => {
    debug('program finished with exit code: %s', exitCode)
    return notify()
  })

  child.on('error', error => {
    debug('program errored with %s', JSON.stringify(error))
    return notify()
  })
}

/**
 * notify bazz
 */
function notify () {
  return bazzManager
    .triggerNotification()
    .then(success => {
      debug('successful execution')
      VERBOSE && spinner.succeed('bazz successful execution')
    })
    .catch(error => {
      exitError(error)
    })
}

/**
 * error handling for CLI
 *
 * @param {object} error
 */
function exitError (error) {
  VERBOSE && spinner.fail(`Bazz error: ${error && error.message}`)
  debug(error && error.stack)
  debug(error.response && error.response.message)
  debug(error.response && error.response.config)
  process.exit(EXIT_CODE_ERROR)
}
