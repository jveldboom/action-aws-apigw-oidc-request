# GitHub Action for AWS API Gateway Requests with OIDC
This GitHub action allows you to make AWS SigV4 signed requests to API Gateway using your GitHub OIDC identity. This action uses GitHub's OIDC provider to assume temporary AWS credentials which is used to create an [AWS signed request](https://docs.aws.amazon.com/general/latest/gr/signing-aws-api-requests.html) to API Gateway with [IAM authentication](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-access-control-iam.html).

Use-case:
- **Publish workflow metrics**: Publish metrics from within your GitHub Actions workflows such as workflow/step duration, pass/fail, unit-test coverage, etc.
- **Sending data to a backend service**: You can use this action to send data to a backend service that is protected by IAM authorization by calling the appropriate API Gateway endpoint with a `POST` or `PUT` request.
- **Retrieving data from a backend service**: You can use this action to retrieve data from a backend service that is protected by IAM authorization by calling the appropriate API Gateway endpoint.
- **Automating the deployment of API Gateway APIs**: You can use this action to automate the deployment of API Gateway APIs by calling the `CreateDeployment` or `UpdateDeployment` API.
- Really any application that can be fronted by AWS API Gateway can be accessible

Requirements:
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

# Scenarios
Here is an example of how to use the action in a workflow:

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
- [ ] finish unit tests while learning jest
- [ ] add cfn-lint to CloudFormation files in PR workflow
- [ ] update docs to include all inputs. Good example https://github.com/actions/checkout#usage
- [ ] check for API responses in integration tests to validate both the action outputs and API infra is returning correct values
- [ ] list action in marketplace

# License
This action is licensed under the MIT License. See the LICENSE file for more information.

