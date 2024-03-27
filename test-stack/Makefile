.PHONY: deploy-stack get-function-name get-function-url destroy-stack

STACK_NAME=aws-signed-fetch-js-test-stack

deploy-stack:
	@aws cloudformation deploy \
		--stack-name $(STACK_NAME) \
		--template-file ./cfn.yml \
		--capabilities CAPABILITY_NAMED_IAM

get-function-name:
	@aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) \
		--query "Stacks[0].Outputs[?OutputKey=='HelloWorldFunctionName'].OutputValue" \
		--output text

get-function-url:
	@aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) \
		--query "Stacks[0].Outputs[?OutputKey=='HelloWorldFunctionUrl'].OutputValue" \
		--output text

destroy-stack:
	@aws cloudformation delete-stack \
		--stack-name $(STACK_NAME)
	@aws cloudformation wait stack-delete-complete \
		--stack-name $(STACK_NAME)
