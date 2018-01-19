'use strict'

/**
 * Abtraction layer for logging
 */
class Logger {
  static info (str = '') {
    console.log(str)
  }

  // static error (str = '') {
  //   console.error(str)
  // }
}

module.exports = Logger
