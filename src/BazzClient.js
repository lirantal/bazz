'use strict'

const axios = require('axios')

class BazzClient {
  /**
   * constructor
   *
   * @param {object.token} token string
   */
  constructor ({ token } = {}) {
    this.bazzApiUrl = process.env.BAZZ_API_URL || 'https://bazz-api.enginx.com'
    this.bazzUrl = process.env.BAZZ_WEB_URL || 'https://bazz.enginx.com'
    this.subscriptionPreferences = {}

    if (token) {
      this.subscriptionPreferences.token = token
    }
  }

  /**
   * get subscription preferences
   * @return {object} subscription preferences composed of token, sub_id,
   * nonce and subcriptionPageUrl
   */
  getSubscriptionPreferences () {
    return this.subscriptionPreferences
  }

  /**
   * Sets a token on the class
   *
   * @param {string} token
   */
  setToken (token) {
    this.subscriptionPreferences.token = token
  }

  /**
   * Register for a token
   *
   * @return {object} registration details
   */
  async registerForToken () {
    const url = `${this.bazzApiUrl}/tokens`
    let response

    try {
      response = await axios.post(url)
    } catch (error) {
      const myError = new Error('Unable to register for token')

      myError.response = {}
      myError.response.message = error.message
      myError.response.config = error.config

      throw myError
    }

    const responseData = response.data.data
    if (!responseData.sub_id || !responseData.token || !responseData.nonce) {
      throw new Error('No token information in registration response')
    }

    this.subscriptionPreferences.sub_id = responseData.sub_id
    this.subscriptionPreferences.token = responseData.token
    this.subscriptionPreferences.nonce = responseData.nonce

    return {
      token: responseData.token,
      sub_id: responseData.sub_id,
      nonce: responseData.nonce,
      subscribePageUrl: `${this.bazzUrl}/?sub_id=${responseData.sub_id}&nonce=${responseData.nonce}`
    }
  }

  /**
   * Wait until a subscription is found available for a given token, sub_id and nonce
   *
   * @param {number} timeout
   * @return {Promise}
   */
  async waitForSubscription (timeout) {
    let subscriptionStatus = false
    let i = 0
    while (i < timeout) {
      await new Promise(resolve => setTimeout(() => resolve(), 1000))

      const subscriptionAvailable = await this.isSubscriptionAvailable()

      if (subscriptionAvailable === true) {
        subscriptionStatus = true
        break
      }

      i++
    }

    return subscriptionStatus
  }

  /**
   * Check whether a subscription is available
   *
   * @return {boolean} status
   */
  async isSubscriptionAvailable () {
    const url = `${this.bazzApiUrl}/subscriptions/pending`

    let response
    try {
      response = await axios.get(url, {
        headers: {
          Authorization: this.subscriptionPreferences.token
        },
        params: {
          sub_id: this.subscriptionPreferences.sub_id,
          nonce: this.subscriptionPreferences.nonce
        }
      })
    } catch (error) {
      return false
    }

    const responseData = response.data.data

    return !!(responseData.id === this.subscriptionPreferences.sub_id &&
      responseData.valid === true)
  }

  /**
   * Confirm a subscription for token
   *
   * @return {boolean} status
   */
  async confirmSubscription () {
    const url = `${this.bazzApiUrl}/subscriptions/${this.subscriptionPreferences.sub_id}/confirmations`

    let response
    try {
      response = await axios.post(
        url,
        {
          nonce: this.subscriptionPreferences.nonce
        },
        {
          headers: {
            Authorization: this.subscriptionPreferences.token
          }
        }
      )
    } catch (error) {
      const myError = new Error('Unable to confirm subscription')

      myError.response = {}
      myError.response.message = error.message
      myError.response.config = error.config

      throw myError
    }

    const responseData = response.data.data
    return !!(responseData.success === true)
  }

  /**
   * Trigger a notification for token
   *
   * @return {boolean} status
   */
  async triggerNotification () {
    const url = `${this.bazzApiUrl}/tokens/notifications`
    let response

    try {
      response = await axios.post(url, null, {
        headers: {
          Authorization: this.subscriptionPreferences.token
        }
      })
    } catch (error) {
      const myError = new Error('Unable to trigger notification')

      myError.response = {}
      myError.response.message = error.message
      myError.response.config = error.config

      throw myError
    }

    return !!(response.status === 200)
  }
}

module.exports = BazzClient
