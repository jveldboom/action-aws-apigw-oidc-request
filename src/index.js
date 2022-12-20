const core = require('@actions/core')
const utils = require('./utils')

const run = async () => {
  try {
    const res = await utils.requestWithRetries({
      url: core.getInput('url'),
      method: core.getInput('method'),
      headers: utils.getHeadersFromInput(core.getMultilineInput('headers')),
      payload: core.getInput('payload') || undefined,
      region: core.getInput('aws-region'),
      maxRetries: core.getInput('max-retries')
    })

    core.setOutput('status-code', res.statusCode)
    core.setOutput('headers', res.headers)
    core.setOutput('body', res.body)
  } catch (err) {
    utils.handleMainError(err)
  }
}

if (process.env.NODE_ENV !== 'test') run()
module.exports = run
