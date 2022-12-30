# GitHub Action for AWS API Gateway Requests with OIDC
This GitHub Action allows you to use your GitHub OIDC identity to make [AWS SigV4 signed requests](https://docs.aws.amazon.com/general/latest/gr/signing-aws-api-requests.html) to API Gateway with [IAM authentication](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-access-control-iam.html).

### Use Cases:
- Publish workflow metrics, such as workflow/step duration, pass/fail, unit-test coverage, etc., from within your GitHub Actions workflows.
- Send data to a backend service protected by IAM authorization by calling the appropriate API Gateway endpoint with a `POST` or `PUT` request.
- Retrieve data from a backend service protected by IAM authorization by calling the appropriate API Gateway endpoint.
- Proxy data directly to an AWS service like [SQS](https://aws.amazon.com/premiumsupport/knowledge-center/api-gateway-proxy-integrate-service/), [SNS](https://docs.aws.amazon.com/apigateway/latest/developerguide/getting-started-aws-proxy.html), or [Kinesis](https://docs.aws.amazon.com/apigateway/latest/developerguide/integrating-api-with-aws-services-kinesis.html) with an endpoint method `AWS Service` integration type.

In general, this action can be used to access any application that is fronted by AWS API Gateway and protected by IAM authorization.

### Requirements:
- [GitHub OIDC provider](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services) configured within AWS - [example CloudFormation](./examples/iam-oidc-provider.yaml)
- AWS IAM role with trust policy - [example CloudFormation](./examples/iam-oidc-role.yaml)
- AWS API Gateway endpoint with IAM authentication - [example CloudFormation](./examples/api-gateway.yaml)
  - If this is the first time setting up an API Gateway with logging, you may also need to create an IAM role to [grant API Gateway the permission to write to CloudWatch Logs](https://aws.amazon.com/premiumsupport/knowledge-center/api-gateway-cloudwatch-logs/)

# Usage
```yaml
- uses: jveldboom/action-aws-apigw-oidc-request@v1
  with:
    # AWS IAM role arn to assume via OIDC
    # [Learn more about Github OIDC with AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
    aws-role-to-assume: ''

    # AWS region name (eg: us-east-2, us-west-2)
    # Note: the region must be the set to the region your API Gateway is hosted
    aws-region: ''

    # API Gateway URL
    url: ''

    # Request method (eg GET, POST, PUT)
    # Default: GET
    method: ''

    # Request headers in multi-line key: value format
    # headers: |
    #   content-type: application/json
    #   cache-control: max-age=0
    headers: ''

    # Request body payload in JSON string format
    # Example: '{"foo": "bar"}'
    payload: ''

    # Max number of request retries
    # Default: 0
    max-retries: ''
```

# Outputs
- `status-code` response status code
- `headers` response headers
- `body` response body

# Example Usage

```yaml
name: API Gateway Request

on: [ push ]

jobs:
  api-request:
    runs-on: ubuntu-latest

    permissions:
      id-token: write # NOTE: required for OIDC
      contents: read

    steps:
      - uses: actions/checkout@v3

      - name: Call API Gateway
        id: call-api
        uses: jveldboom/action-aws-apigw-oidc-request@v1
        with:
          aws-role-to-assume: arn:aws:iam::123456789012:role/example-oidc-role
          aws-region: us-east-2
          url: http://example.com/auth/iam
          method: POST
          payload: '{"foo": "bar"}'
          max-retries: 3

      - name: Print response
        run: |
          echo "Status code: ${{ steps.api-request.outputs.status-code }}"
          echo "Headers: ${{ steps.api-request.outputs.headers }}"
          echo "Body: ${{ steps.api-request.outputs.body }}"
```

# TODO
- [ ] setup release process - maybe manually initially?
- [x] <strike>finish unit tests while learning jest</strike>
- [ ] add cfn-lint to CloudFormation files in PR workflow
- [x] <strike>update docs to include all inputs. Good example https://github.com/actions/checkout#usage</strike>
- [x] <strike>check for API responses in integration tests to validate both the action outputs and API infra is returning correct values</strike>
- [x] <strike>list action in marketplace</strike> https://github.com/marketplace/actions/aws-api-gateway-request-with-oidc
- [ ] deploy example infrastructure on pushes to main

# License
This action is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more information.
