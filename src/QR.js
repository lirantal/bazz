'use strict'

const qr = require('qrcode-terminal')

/**
 * QR Util
 */
class QR {
  /**
   * draw a QR code on the screen for a given text
   *
   * @param {string} url
   */
  static draw (url) {
    qr.setErrorLevel('L')
    qr.generate(url, {
      small: true
    })
  }
}

module.exports = QR
