# GitHub Actions AWS API Gateway Requests
GitHub Action to make AWS SigV4 requests to to an AWS API Gateway using IAM authentication. This action uses GitHub's OIDC provider to assume temporary credentials to create a [AWS signed request](https://docs.aws.amazon.com/general/latest/gr/signing-aws-api-requests.html)

Use-case:
- Publish metrics from within your GitHub Actions workflows such as workflow/step duration, pass/fail, unit-test coverage, etc.
- Notify external systems of a workflow completing such as a deployment or successful tests
- Query data from backend to pull into the workflow
- Really any application that can be fronted by AWS API Gateway can be accessible

Requirements:
- [GitHub OIDC provider](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services) configured within AWS - [example CloudFormation](./examples/iam-oidc-provider.yaml)
- AWS IAM role with trust policy - [example CloudFormation](./examples//iam-oidc-role.yaml)
- AWS API Gateway endpoint with IAM authentication
  - If this is the first time setting up an API Gateway with logging, you may also need to create an IAM role to [grant API Gateway the permission to write to CloudWatch Logs](https://aws.amazon.com/premiumsupport/knowledge-center/api-gateway-cloudwatch-logs/)