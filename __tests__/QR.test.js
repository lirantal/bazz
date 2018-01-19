'use strict'

const qr = require('qrcode-terminal')
const QR = require('../src/QR')

jest.mock('qrcode-terminal', () => {
  return {
    setErrorLevel: jest.fn(),
    generate: jest.fn()
  }
})

test('QR calls ', () => {
  const url = 'http://www.myurl.com'
  QR.draw(url)

  expect(qr.setErrorLevel).toHaveBeenCalledWith('L')
  expect(qr.generate).toHaveBeenCalledWith(url, {
    small: true
  })
})
