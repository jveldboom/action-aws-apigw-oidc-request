/* eslint-env jest */
const axios = require('axios')
const core = require('@actions/core')
const utils = require('./utils')

jest.mock('axios')
jest.spyOn(core, 'info')
jest.spyOn(core, 'setFailed')

const exampleRequest = {
  url: 'https://example.com/foo',
  method: 'GET',
  headers: {
    'x-test': 'bar'
  },
  region: 'us-east-99',
  body: { foo: 'bar' },
  payload: { foo: 'bar-payload' }
}

describe('requests', () => {
  beforeEach(() => {
    process.env.AWS_ACCESS_KEY_ID = 'test-key-id'
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-access-key'
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('request()', () => {
    it('should return request response in expect format', async () => {
      axios.request.mockResolvedValueOnce({
        data: 'test',
        headers: {
          'content-type': 'application/json'
        },
        status: 200
      })

      const res = await utils.request(exampleRequest)

      const expected = {
        body: 'test',
        headers: {
          'content-type': 'application/json'
        },
        statusCode: 200
      }

      expect(res).toStrictEqual(expected)
    })

    it('should call axios with a signed request', async () => {
      axios.request.mockResolvedValueOnce({
        data: 'test',
        headers: {
          'content-type': 'application/json'
        },
        status: 200
      })

      await utils.request(exampleRequest)

      // check if axios was passed a signed request
      const mockedResponse = axios.request.mock.calls[0][0]
      expect(mockedResponse.headers.Authorization).toContain('AWS4-HMAC-SHA256')
      expect(mockedResponse.headers.Authorization).toContain('Credential=test-key-id')
      expect(mockedResponse.headers['X-Amz-Date']).toBeDefined()
      expect(mockedResponse.service).toBe('execute-api')
    })
  })

  describe('signRequest()', () => {
    beforeEach(() => {
      process.env.AWS_ACCESS_KEY_ID = 'test-key-id'
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-access-key'
    })

    afterEach(() => {
      delete process.env.AWS_ACCESS_KEY_ID
      delete process.env.AWS_SECRET_ACCESS_KEY
      delete process.env.AWS_DEFAULT_REGION
    })

    it('should return a signed request', () => {
      const signed = utils.signRequest(exampleRequest)

      // test expected values
      expect(signed.body).toBe(JSON.stringify(exampleRequest.body))
      expect(signed.method).toBe(exampleRequest.method)
      expect(signed.service).toBe('execute-api') // default service
      expect(signed.region).toBe(exampleRequest.region) // default service
      expect(signed.headers['x-test']).toBe(exampleRequest.headers['x-test'])
      expect(signed.headers.Host).toBe('example.com')
      expect(signed.headers['X-Amz-Date'].length).toBe(16) // 20221218T163805Z

      // check authorization header for expected values
      const authorization = signed.headers.Authorization.split(', ')
      expect(authorization[0].length).toBeGreaterThan(0)
      expect(authorization[1]).toContain('SignedHeaders=')
      expect(authorization[2]).toContain('Signature=')

      // test signature length
      expect(signed.headers.Authorization.split('Signature')[1].length).toBeGreaterThan(0)
    })
  })

  describe('requestWithRetries()', () => {
    it('should successfully make request without retries', async () => {
      axios.request.mockResolvedValueOnce({
        data: 'test',
        headers: { },
        status: 200
      })

      await utils.requestWithRetries({ url: 'https://example.com' })
      expect(axios.request).toBeCalledTimes(1)
    })

    it('should retry 2 times and return successfully', async () => {
      axios.request
        .mockRejectedValueOnce('failure 1')
        .mockRejectedValueOnce('failure 2')
        .mockResolvedValueOnce({ data: 'test', headers: {}, status: 200 })

      const res = await utils.requestWithRetries({ url: 'https://example.com', baseDelay: 10 })
      expect(res).toStrictEqual({ body: 'test', headers: {}, statusCode: 200 })

      expect(axios.request).toBeCalledTimes(3) // called 3 times total (initial + 2 retries)
    })

    it('should retry 3 times and throw error', async () => {
      axios.request.mockRejectedValue('test retry error')

      try {
        await utils.requestWithRetries({ url: 'https://example.com', baseDelay: 10 })
      } catch (err) {
        expect(err).toBe('test retry error')
      }

      expect(axios.request).toBeCalledTimes(4) // called 4 times total (initial + 3 retries)
    })
  })

  describe('backoff()', () => {
    it('should return default backoff time', async () => {
      const time = await utils.backoff()
      expect(time).toBe(1000)
    })

    it('should return calculated backoff time', async () => {
      const time = await utils.backoff(3, 5)
      expect(time).toBe(40)
    })
  })

  describe('getHeadersFromInput()', () => {
    it('should return undefine with no input', () => {
      const headers = utils.getHeadersFromInput()
      expect(headers).toStrictEqual(undefined)
    })

    it('should return undefine when passed non-array argument', () => {
      const testArguments = ['', 'foo', {}, true]

      testArguments.forEach(arg => {
        expect(utils.getHeadersFromInput(arg)).toStrictEqual(undefined)
      })
    })

    it('should return undefine with invalid array items', () => {
      const testArguments = ['foo', ':', 'foo:', ':bar']
      expect(utils.getHeadersFromInput(testArguments)).toStrictEqual(undefined)
    })

    it('should return object of header key/values', () => {
      const testArguments = ['foo:bar', 'x-cache-age: 10', ' padding : padding']
      const expected = { foo: 'bar', 'x-cache-age': '10', padding: 'padding' }
      expect(utils.getHeadersFromInput(testArguments)).toStrictEqual(expected)
    })
  })

  describe('handleMainError()', () => {
    it('should set failed and output response failure', () => {
      utils.handleMainError({ response: {} })
      expect(core.setFailed).toBeCalledWith('request failed')
    })

    it('should set failed and output request failure', () => {
      utils.handleMainError({ request: { failed: true } })
      expect(core.setFailed).toBeCalledWith({ failed: true })
    })

    it('should set failed and output error', () => {
      utils.handleMainError(new Error('unknown error'))
      expect(core.setFailed).toBeCalledTimes(2)
      expect(core.setFailed).toHaveBeenNthCalledWith(2, 'unknown error')
    })
  })
})
