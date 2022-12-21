// Used for local testing
// > node local.js

process.env['INPUT_AWS-REGION'] = 'us-east-1'
process.env.INPUT_URL = process.env.AWS_APIGW_URL || 'https://example.com'
process.env.INPUT_METHOD = 'GET'
process.env['INPUT_MAX-RETRIES'] = '2'
// process.env.INPUT_PAYLOAD = '{"foo": "bar"}'
process.env.INPUT_HEADERS = `
  x-test: my-value
  x-test-2: test
`

require('./index')
