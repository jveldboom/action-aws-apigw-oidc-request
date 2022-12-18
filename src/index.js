const core = require('@actions/core')
const { requestWithRetries, getHeadersFromInput } = require('./domain/request')

async function run () {
  try {
    const res = await requestWithRetries({
      region: core.getInput('aws-region'),
      url: core.getInput('url'),
      method: core.getInput('method'),
      headers: getHeadersFromInput(core.getMultilineInput('headers')),
      payload: core.getInput('payload') || undefined,
      maxRetries: core.getInput('max-retries')
    })

    core.setOutput('status-code', res.statusCode)
    core.setOutput('headers', res.headers)
    core.setOutput('body', res.body)
  } catch (err) {
    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      core.info('body', err.response.data)
      core.info('status', err.response.status)
      core.info('headers', err.response.headers)
      core.setFailed('request failed')
    } else if (err.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      core.setFailed(err.request)
    } else {
      // Something happened in setting up the request that triggered an Error
      core.setFailed(err.stack)
      core.setFailed(err.message)
    }
  }
}

run()
