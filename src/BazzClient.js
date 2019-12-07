'use strict'

const axios = require('axios')
const debug = require('debug')('bazz')

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

    debug(`remote configuration API URL: ${this.bazzApiUrl}`)
    debug(`remote configuration Website URL: ${this.bazzUrl}`)

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
  registerForToken () {
    const url = `${this.bazzApiUrl}/tokens`

    return axios
      .post(url)
      .then(response => {
        const responseData = response.data.data
        if (
          !responseData.sub_id ||
          !responseData.token ||
          !responseData.nonce
        ) {
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
      })
      .catch(error => {
        const myError = new Error('Unable to register for token')

        myError.response = {}
        myError.response.message = error.message
        myError.response.config = error.config

        throw myError
      })
  }

  /**
   * Wait until a subscription is found available for a given token, sub_id and nonce
   *
   * @param {number} timeoutThreshold in seconds
   * @return {Promise}
   */
  waitForSubscription (timeoutThreshold) {
    return new Promise(resolve => {
      let counter = 1
      const loopForSubscription = () => {
        setTimeout(() => {
          if (counter > timeoutThreshold) {
            return resolve(false)
          }

          this.isSubscriptionAvailable().then(subscriptionAvailable => {
            if (subscriptionAvailable === true) {
              return resolve(true)
            } else {
              return loopForSubscription()
            }
          })

          counter++
        }, 1000)
      }

      loopForSubscription()
    })
  }

  /**
   * Check whether a subscription is available
   *
   * @return {boolean} status
   */
  isSubscriptionAvailable () {
    const url = `${this.bazzApiUrl}/subscriptions/pending`

    debug(`pinging URL: ${url}`)

    return axios
      .get(url, {
        headers: {
          Authorization: this.subscriptionPreferences.token
        },
        params: {
          sub_id: this.subscriptionPreferences.sub_id,
          nonce: this.subscriptionPreferences.nonce
        }
      })
      .then(response => {
        const responseData = response.data.data

        return !!(responseData.id === this.subscriptionPreferences.sub_id &&
          responseData.valid === true)
      })
      .catch(() => {
        return false
      })
  }

  /**
   * Confirm a subscription for token
   *
   * @return {boolean} status
   */
  confirmSubscription () {
    const url = `${this.bazzApiUrl}/subscriptions/${this.subscriptionPreferences.sub_id}/confirmations`

    return axios
      .post(
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
      .then(response => {
        const responseData = response.data.data
        return !!(responseData.success === true)
      })
      .catch(error => {
        const myError = new Error('Unable to confirm subscription')

        myError.response = {}
        myError.response.message = error.message
        myError.response.config = error.config

        throw myError
      })
  }

  /**
   * Trigger a notification for token
   *
   * @return {boolean} status
   */
  triggerNotification () {
    const url = `${this.bazzApiUrl}/tokens/notifications`

    return axios
      .post(url, null, {
        headers: {
          Authorization: this.subscriptionPreferences.token
        }
      })
      .then(response => {
        return !!(response.status === 200)
      })
      .catch(error => {
        const myError = new Error('Unable to trigger notification')

        myError.response = {}
        myError.response.message = error.message
        myError.response.config = error.config

        throw myError
      })
  }
}

module.exports = BazzClient
