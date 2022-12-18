const axios = require('axios')
const aws4 = require('aws4')

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
    timeout: 1000
  })

  return {
    body: res.data,
    headers: res.headers,
    statusCode: res.status
  }
}

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

const requestWithRetries = async ({ url, method, headers, payload, region, maxRetries = 3, baseDelay = 1000, retryCount = 0 }) => {
  try {
    return await request({ url, method, headers, payload, region })
  } catch (err) {
    ++retryCount
    if (retryCount <= maxRetries) {
      console.log(`request failed with "${err.message}" - retry ${retryCount} / ${maxRetries}...`)
      console.log(`response: ${JSON.stringify(err?.response?.data)}`)
      await backoff(baseDelay, retryCount)
      await requestWithRetries({ url, payload, maxRetries, baseDelay, retryCount })
    }
    throw new Error(err)
  }
}

/**
 * Set a promise to resolve at set time to allow for a backoff sleep
 * @param {number} retryCount count of current retry
 * @param {number} intervalMs interval in milliseconds
 * @returns promise
 */
const backoff = (retryCount = 0, baseDelay = 1000) => new Promise((resolve) => {
  const time = (1 + retryCount) * 2 * baseDelay
  setTimeout(() => resolve(time), time)
})

/**
 * Get event labels property object
 * @param {object} { labelsInput: array of key-value strings ['key: value'], startTimeInput: unix epoch time }
 * @returns object || undefined
 */
const getHeadersFromInput = (headersInput) => {
  const headers = {}

  // loop through array of labels in [ 'key: value', 'key: value' ] format
  // split each array item to get the key and value to add to "labels" object
  headersInput.forEach(item => {
    const prop = item.split(':')
    if (prop.length === 2) headers[prop[0].trim()] = prop[1].trim()
  })

  if (Object.keys(headers).length === 0) return // return undefined if no label properties
  return headers
}

module.exports = {
  request,
  requestWithRetries,
  backoff,
  getHeadersFromInput
}
