/* eslint-env jest */
const axios = require('axios')
const core = require('@actions/core')
const utils = require('./utils')

jest.mock('axios')
jest.spyOn(utils, 'requestWithRetries')
jest.spyOn(core, 'getInput')
jest.spyOn(core, 'getMultilineInput')
jest.spyOn(core, 'setOutput')
jest.spyOn(core, 'setFailed')

const index = require('./index')

describe('index', () => {
  beforeEach(() => {
    process.env.INPUT_URL = 'https://localhost'
    process.env.INPUT_METHOD = 'PUT'
    // process.env.INPUT_HEADERS = 'x-foo: var'
    // process.env.INPUT_PAYLOAD = '{"foo": "bar"}'
    process.env['INPUT_AWS-REGION'] = 'us-east-99'
    process.env['INPUT_MAX-RETRIES'] = 4
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should receive expected input and outputs', async () => {
    axios.request.mockResolvedValueOnce({
      data: 'test 123',
      headers: { 'content-type': 'application/json' },
      status: 200
    })

    await index()

    expect(utils.requestWithRetries).toBeCalledTimes(1)

    // TODO: figure why does this test does not work properly to passing in headers
    // The spy pulls in the signed request which includes the auth headers :shrug:
    expect(utils.requestWithRetries).toBeCalledWith({
      url: process.env.INPUT_URL,
      method: process.env.INPUT_METHOD,
      headers: undefined,
      payload: process.env.INPUT_PAYLOAD,
      region: process.env['INPUT_AWS-REGION'],
      maxRetries: process.env['INPUT_MAX-RETRIES']
    })

    // check all inputs were called
    expect(core.getInput).toHaveBeenNthCalledWith(1, 'url')
    expect(core.getInput).toHaveBeenNthCalledWith(2, 'method')
    expect(core.getInput).toHaveBeenNthCalledWith(3, 'payload')
    expect(core.getInput).toHaveBeenNthCalledWith(4, 'aws-region')
    expect(core.getInput).toHaveBeenNthCalledWith(5, 'max-retries')
    expect(core.getMultilineInput).toHaveBeenCalledWith('headers')

    // check all outputs were called
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'status-code', 200)
    expect(core.setOutput).toHaveBeenNthCalledWith(2, 'headers', { 'content-type': 'application/json' })
    expect(core.setOutput).toHaveBeenNthCalledWith(3, 'body', 'test 123')
  })

  it('should fail and output response error', async () => {
    axios.request.mockRejectedValue({ response: {} })

    process.env.INPUT_URL = 'https://localhost'
    process.env.INPUT_METHOD = 'PUT'
    // process.env.INPUT_HEADERS = 'x-foo: var'
    // process.env.INPUT_PAYLOAD = '{"foo": "bar"}'
    process.env['INPUT_AWS-REGION'] = 'us-east-99'
    process.env['INPUT_MAX-RETRIES'] = 1

    await index()

    expect(utils.requestWithRetries).toBeCalledTimes(1)
  })
})
