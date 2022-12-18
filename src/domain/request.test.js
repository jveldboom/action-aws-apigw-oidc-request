/* eslint-env jest */

const request = require('./request')

describe('domain/requests', () => {
  describe('backoff()', () => {
    it('should return default backoff time', async () => {
      const time = await request.backoff()
      expect(time).toBe(2000)
    })

    it('should return calculated backoff time', async () => {
      const time = await request.backoff(3, 5)
      expect(time).toBe(40)
    })
  })
})
