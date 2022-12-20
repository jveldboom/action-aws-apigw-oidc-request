const axios = require('axios')
const aws4 = require('aws4')
const core = require('@actions/core')

/**
 * Send HTTP request
 * @param {Object} request object
 * @param {string} request.url full request url
 * @param {string} request.method request method eg GET, POST, PUT
 * @param {Array.<string>} request.headers array of request headers
 * @param {Object} request.body request body object
 * @param {String} request.region aws region name
 * @returns {Object} { body, headers, statusCode }
 */
const request = async ({ url, method, headers, payload, region }) => {
  const signed = signRequest({
    url,
    method,
    headers,
    body: payload,
    region
  })

  const res = await axios.request({
    ...signed,
    url,
    data: payload,
    timeout: 3000
  })

  return {
    body: res.data,
    headers: res.headers,
    statusCode: res.status
  }
}

/**
 * SigV4 signs a request object
 * @param {Object.} request object
 * @param {string} request.url full request url
 * @param {string} request.method request method eg GET, POST, PUT
 * @param {Array.<string>} request.headers array of request headers
 * @param {Object} request.body request body object
 * @param {String} request.region aws region name
 * @param {String} request.service aws service name
 * @returns {Object} signed request object
 */
const signRequest = ({ url, method, headers, body, region, service = 'execute-api' }) => {
  const { host, pathname } = new URL(url)
  return aws4.sign({
    body: JSON.stringify(body),
    headers,
    host,
    method,
    path: pathname,
    region,
    service
  })
}

/**
 * Send HTTP request with retries
 * @param {Object.} request object
 * @param {string} request.url full request url
 * @param {string} request.method request method eg GET, POST, PUT
 * @param {Array.<string>} request.headers array of request headers
 * @param {Object} request.payload request body object
 * @param {String} request.region aws region name
 * @param {Number} request.maxRetries max number of times to retry request
 * @param {Number} request.baseDelay milliseconds to base delay calculation
 * @returns response object | throws error
 */
const requestWithRetries = async ({ url, method, headers, payload, region, maxRetries = 3, baseDelay = 1000, retryCount = 0 }) => {
  try {
    return await request({ url, method, headers, payload, region })
  } catch (err) {
    ++retryCount
    if (retryCount > maxRetries) throw err

    core.info(`request failed with "${err.message}" - retry ${retryCount} / ${maxRetries}...`)
    core.info(`response: ${JSON.stringify(err?.response?.data)}`)
    await backoff(retryCount, baseDelay)
    return await requestWithRetries({ url, method, headers, payload, region, maxRetries, baseDelay, retryCount })
  }
}

/**
 * Set a promise to resolve at set time to allow for a backoff sleep
 * @param {number} retryCount count of current retry
 * @param {number} baseDelay milliseconds to base delay calculation (retryCount * baseDelay = backoff)
 * @returns promise
 */
const backoff = (retryCount = 0, baseDelay = 500) => new Promise((resolve) => {
  const time = (1 + retryCount) * 2 * baseDelay
  setTimeout(() => resolve(time), time)
})

/**
 * Get event labels property object
 * @param {Array.<string>} headersInput array of colon separated key/value strings ['key: value']
 * @returns object || undefined
 */
const getHeadersFromInput = (headersInput = []) => {
  if (!Array.isArray(headersInput)) return

  const headers = {}

  // loop through array of labels in [ 'key: value', 'key: value' ] format
  // split each array item to get the key and value to add to "labels" object
  for (const item of headersInput) {
    const prop = item.split(':')
    if (prop.length !== 2) continue

    const key = prop[0].trim()
    const value = prop[1].trim()
    if (key.length > 0 && value.length > 0) headers[key] = value
  }

  if (Object.keys(headers).length === 0) return // return undefined if no label properties
  return headers
}

const handleMainError = (err) => {
  if (err.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    core.info('body', err.response.data)
    core.info('status', err.response.status)
    core.info('headers', err.response.headers)
    core.setFailed('request failed')
  } else if (err.request) {
    // The request was made but no response was received
    // `error.request` is an instance of http.ClientRequest in node.js
    core.setFailed(err.request)
  } else {
    // Something happened in setting up the request that triggered an Error
    core.setFailed(err.stack)
    core.setFailed(err.message)
  }
}

module.exports = {
  request,
  requestWithRetries,
  signRequest,
  backoff,
  getHeadersFromInput,
  handleMainError
}
