
# AWS Infrastructure
deploy-oidc-provider:
	aws cloudformation deploy \
		--template-file examples/iam-oidc-provider.yaml \
		--stack-name github-oidc-provider

deploy-api:
	aws cloudformation deploy \
		--template-file examples/api-gateway.yaml \
		--stack-name github-oidc-example-api \
		--capabilities CAPABILITY_NAMED_IAM \
		--parameter-overrides \
			  OidcProviderArn=${AWS_OIDC_PROVIDER_ARN}

	# get stack outputs
	aws cloudformation describe-stacks \
		--stack-name github-oidc-example-api \
		--query 'Stacks[*].Outputs' --output table