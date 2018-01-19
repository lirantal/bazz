'use strict'

/**
 * specify time in seconds to wait until finding a subscription
 *
 * @const
 * @type {string}
 */
const WAIT_THRESHOLD = 90

const debug = require('debug')('bazz:manager')
const Configstore = require('configstore')
const pkg = require('../package.json')

const QR = require('../src/QR')
const Logger = require('../src/Logger')
const BazzClient = require('../src/BazzClient')

class BazzManager {
  constructor ({ waitThreshold } = {}) {
    this.waitThreshold = waitThreshold || WAIT_THRESHOLD

    debug('initialized with waitThreshold: %d', this.waitThreshold)

    // initialize configuration store
    this.conf = new Configstore(pkg.name)

    // get token and initialize bazz client API
    this.token = this.getToken()
    this.bazzClient = new BazzClient({ token: this.token })

    debug('initialized with token: %s', this.token)
  }

  /**
   * Get a token from the persistent configuration store
   * @return {string} token
   */
  getToken () {
    const token = this.conf.get('token')
    debug('get token: %s', token)
    return token
  }

  /**
   * Save a token to the persistent configuration store
   * @param {string} token
   * @return {boolean}
   */
  saveToken (token) {
    debug('save token: %s', token)
    return this.conf.set('token', token)
  }

  /**
   * return {Promise} resolve with an already existing token or kickstart
   * the registration process for a new token
   */
  login () {
    if (this.token) {
      debug('login')
      return Promise.resolve(this.token)
    }

    // if no token available we begin the signup process
    debug('registering for new token...')
    return Promise.resolve()
      .then(() => this.registerForToken())
      .then(registrationDetails =>
        this.printRegistrationDetails(registrationDetails)
      )
      .then(registrationDetails =>
        this.pollForSubscription(registrationDetails)
      )
      .then(registrationDetails =>
        this.confirmSubscription(registrationDetails)
      )
  }

  /**
   * register for a new token
   *
   * @return {object} registration details: token, sub_id, nonce and subscriptionPageUrl
   */
  registerForToken () {
    // Register for a valid token
    return this.bazzClient.registerForToken()
  }

  /**
   * Prints the registration URL to stdout as both a plain-text link and a
   * scannable QR code
   *
   * @param {object} registration details: token, sub_id, nonce and subscriptionPageUrl
   */
  printRegistrationDetails (registrationDetails) {
    // Print subscription registration URL to the console as plain link and QR code
    Logger.info()
    Logger.info(
      `Scan the below QR code with your camera or open the page at: ${registrationDetails.subscribePageUrl}`
    )

    QR.draw(registrationDetails.subscribePageUrl)
    return registrationDetails
  }

  /**
   * Poll bazz service until it detects a subscription is made by the user,
   * waiting a specified amount of seconds to query for available subscription.
   *
   * @return {boolean} subscription status
   */
  pollForSubscription (registrationDetails) {
    debug('polling for device subscription...')
    return this.bazzClient
      .waitForSubscription(this.waitThreshold)
      .then(subscriptionStatus => {
        if (subscriptionStatus !== true) {
          throw new Error('couldnt find subscription')
        }

        return registrationDetails
      })
  }

  /**
   * Confirm subscription
   */
  confirmSubscription (registrationDetails) {
    debug('confirming device subscription')
    return this.bazzClient.confirmSubscription().then(() => {
      this.saveToken(registrationDetails.token)
    })
  }

  /**
   * Trigger devices notification for a token
   */
  triggerNotification () {
    debug('triggering notification for all devices')
    return this.bazzClient.triggerNotification()
  }
}

module.exports = BazzManager
