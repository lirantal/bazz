'use strict'

const nock = require('nock')
const BazzManager = require('../src/BazzManager')

// mocks
const QR = require('../src/QR')
jest.mock('../src/QR', () => {
  return {
    draw: jest.fn()
  }
})
let Configstore = require('configstore')

jest.dontMock('nock')

beforeEach(() => {
  nock.cleanAll()
})

describe('Token handling', () => {
  it('BazzManager successully gets a token from the store', () => {
    const mockToken = 1234
    Configstore.prototype.get = jest.fn(token => mockToken)

    const bazzManager = new BazzManager()
    const token = bazzManager.getToken()

    expect(Configstore.prototype.get).toHaveBeenCalledWith('token')
    expect(token).toEqual(mockToken)
  })

  it('BazzManager successully initializes BazzClient with a correct token', () => {
    const mockToken = 1234
    Configstore.prototype.get = jest.fn(token => mockToken)

    const bazzManager = new BazzManager()

    // expect(Configstore.prototype.get).toHaveBeenCalledWith('token')
    expect(bazzManager.bazzClient.subscriptionPreferences).toEqual({
      token: mockToken
    })
  })

  it('BazzManager successfully sets a token', () => {
    const mockToken = 12345

    // Configstore.prototype.get = jest.fn(() => null)
    Configstore.prototype.set = jest.fn(() => true)

    const bazzManager = new BazzManager()
    bazzManager.saveToken(mockToken)

    expect(Configstore.prototype.set).toHaveBeenCalledWith('token', mockToken)
  })
})

describe('Login with a token', () => {
  it('If a token already exists a login should simply return it', async () => {
    const mockToken = 12345
    Configstore.prototype.get = jest.fn(token => mockToken)

    const bazzManager = new BazzManager()
    const token = await bazzManager.login()

    expect(token).toBe(mockToken)
  })
})

describe('Login without a token', () => {
  it('Login without a token should fail if no token provided', async () => {
    Configstore.prototype.get = jest.fn(token => null)

    // mock response for registering for a token
    nock(/.*/, {})
      .post('/api/tokens')
      .reply(500)

    const options = {
      waitThreshold: 1
    }
    const bazzManager = new BazzManager(options)
    try {
      await bazzManager.login()
    } catch (error) {
      expect(error.message).toEqual('Unable to register for token')
    }
  })

  it('Login without a token should perform a registration workflow', async () => {
    Configstore.prototype.get = jest.fn(token => null)

    const mockTokenData = {
      token: 12345,
      sub_id: 'abc',
      nonce: 'xyz'
    }

    // mock response for registering for a token
    nock(/.*/, {})
      .post('/api/tokens')
      .reply(200, {
        data: mockTokenData
      })

    // mock response that confirms a subscription was made
    nock(/.*/, {
      reqheaders: {
        authorization: mockTokenData.token
      }
    })
      .get('/api/subscriptions/pending')
      .query({ sub_id: mockTokenData.sub_id, nonce: mockTokenData.nonce })
      .reply(200, {
        data: {
          id: mockTokenData.sub_id,
          valid: true
        }
      })

    // mock for confirming subscription
    nock(/.*/, {
      reqheaders: {
        authorization: mockTokenData.token
      }
    })
      .post(`/api/subscriptions/${mockTokenData.sub_id}/confirmations`, {
        nonce: mockTokenData.nonce
      })
      .reply(200, {
        data: {
          success: true
        }
      })

    const options = {
      waitThreshold: 1
    }
    const bazzManager = new BazzManager(options)
    await bazzManager.login()

    expect(QR.draw.mock.calls[0][0]).toEqual(
      `https://bazz.enginx.com/?sub_id=${mockTokenData.sub_id}&nonce=${mockTokenData.nonce}`
    )
  })

  it('Login without a token should register for token and show an error with no subscription', async () => {
    Configstore.prototype.get = jest.fn(token => null)

    const mockTokenData = {
      token: 12345,
      sub_id: 'abc',
      nonce: 'xyz'
    }

    // mock response for registering for a token
    nock(/.*/, {})
      .post('/api/tokens')
      .reply(200, {
        data: mockTokenData
      })

    // mock response that polls for subscriptions
    nock(/.*/, {
      reqheaders: {
        authorization: mockTokenData.token
      }
    })
      .get('/api/subscriptions/pending')
      .query({ sub_id: mockTokenData.sub_id, nonce: mockTokenData.nonce })
      .reply(500)

    const options = {
      waitThreshold: 1
    }
    const bazzManager = new BazzManager(options)
    try {
      await bazzManager.login()
    } catch (error) {
      expect(error.message).toEqual('couldnt find subscription')
    }

    expect(QR.draw.mock.calls[0][0]).toEqual(
      `https://bazz.enginx.com/?sub_id=${mockTokenData.sub_id}&nonce=${mockTokenData.nonce}`
    )
  })

  it('Login without a token should register for token and display the QR code and poll for subscription', async () => {
    Configstore.prototype.get = jest.fn(token => null)

    const mockTokenData = {
      token: 12345,
      sub_id: 'abc',
      nonce: 'xyz'
    }

    // mock response for registering for a token
    nock(/.*/, {})
      .post('/api/tokens')
      .reply(200, {
        data: mockTokenData
      })

    // mock response that polls for subscriptions
    nock(/.*/, {
      reqheaders: {
        authorization: mockTokenData.token
      }
    })
      .get('/api/subscriptions/pending')
      .query({ sub_id: mockTokenData.sub_id, nonce: mockTokenData.nonce })
      .reply(200, {
        data: {
          id: mockTokenData.sub_id,
          valid: true
        }
      })

    const options = {
      waitThreshold: 1
    }
    const bazzManager = new BazzManager(options)
    try {
      await bazzManager.login()
    } catch (error) {
      expect(error.message).toEqual('Unable to confirm subscription')
    }

    expect(QR.draw.mock.calls[0][0]).toEqual(
      `https://bazz.enginx.com/?sub_id=${mockTokenData.sub_id}&nonce=${mockTokenData.nonce}`
    )
  })

  it('Login without a token should attempt to register, but fail if no token in the response', async () => {
    Configstore.prototype.get = jest.fn(token => null)

    nock(/.*/, {})
      .post('/api/tokens')
      .reply(200, {
        data: {}
      })

    const bazzManager = new BazzManager()
    try {
      await bazzManager.login()
    } catch (error) {
      expect(error.message).toEqual('Unable to register for token')
    }
  })

  it('Trigger a notification is unsuccessful and catch an error', async () => {
    const mockToken = 12345
    Configstore.prototype.get = jest.fn(token => mockToken)

    nock(/.*/, {
      reqheaders: {
        authorization: mockToken
      }
    })
      .post('/api/tokens/notifications')
      .reply(500)

    const bazzManager = new BazzManager()
    try {
      await bazzManager.triggerNotification()
    } catch (error) {
      expect(error.message).toEqual('Unable to trigger notification')
    }
  })
})

describe('Notification handling', () => {
  it('Trigger a notification is successful', async () => {
    const mockToken = 12345
    Configstore.prototype.get = jest.fn(token => mockToken)

    nock(/.*/, {
      reqheaders: {
        authorization: mockToken
      }
    })
      .post('/api/tokens/notifications')
      .reply(200, {
        data: {
          success: true
        }
      })

    const bazzManager = new BazzManager()
    const status = await bazzManager.triggerNotification()

    expect(status).toBe(true)
  })

  it('Trigger a notification is unsuccessful and catch an error', async () => {
    const mockToken = 12345
    Configstore.prototype.get = jest.fn(token => mockToken)

    nock(/.*/, {
      reqheaders: {
        authorization: mockToken
      }
    })
      .post('/api/tokens/notifications')
      .reply(500)

    const bazzManager = new BazzManager()
    try {
      await bazzManager.triggerNotification()
    } catch (error) {
      expect(error.message).toEqual('Unable to trigger notification')
    }
  })
})
