#!/bin/bash

# Lambda Deployment Script (Python)
# AWS Lambda 함수를 배포하는 자동화 스크립트

set -e

# Configuration
REGION="ap-northeast-2"
ROLE_NAME="lambda-cognito-sync-role"
POST_CONFIRMATION_FUNCTION="CognitoPostConfirmation"
POST_AUTHENTICATION_FUNCTION="CognitoPostAuthentication"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Lambda Deployment Script (Python) ===${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

# Check environment variables
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}Warning: Database environment variables not set${NC}"
    echo "Please set: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 1: Install dependencies
echo -e "${GREEN}Step 1: Installing Python dependencies...${NC}"

mkdir -p package/postConfirmation
mkdir -p package/postAuthentication

pip install psycopg2-binary -t package/postConfirmation/ --quiet
pip install psycopg2-binary -t package/postAuthentication/ --quiet

# Step 2: Copy Lambda functions
echo -e "${GREEN}Step 2: Copying Lambda functions...${NC}"

cp postConfirmation.py package/postConfirmation/
cp postAuthentication.py package/postAuthentication/

# Step 3: Create ZIP files
echo -e "${GREEN}Step 3: Creating deployment packages...${NC}"

cd package/postConfirmation
zip -r ../../postConfirmation.zip . -q
cd ../..

cd package/postAuthentication
zip -r ../../postAuthentication.zip . -q
cd ../..

# Clean up
rm -rf package

echo "Package sizes:"
ls -lh postConfirmation.zip postAuthentication.zip

# Step 4: Check IAM role
echo -e "${GREEN}Step 4: Checking IAM role...${NC}"

if aws iam get-role --role-name $ROLE_NAME 2>/dev/null; then
    echo "Role $ROLE_NAME exists"
    ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
else
    echo -e "${YELLOW}Role $ROLE_NAME does not exist${NC}"
    echo "Please create the role first. See AWS_LAMBDA_DEPLOYMENT_GUIDE.md"
    exit 1
fi

echo "Role ARN: $ROLE_ARN"

# Step 5: Deploy PostConfirmation
echo -e "${GREEN}Step 5: Deploying PostConfirmation function...${NC}"

if aws lambda get-function --function-name $POST_CONFIRMATION_FUNCTION --region $REGION 2>/dev/null; then
    echo "Updating existing function..."
    aws lambda update-function-code \
        --function-name $POST_CONFIRMATION_FUNCTION \
        --zip-file fileb://postConfirmation.zip \
        --region $REGION
    
    echo "Updating configuration..."
    aws lambda update-function-configuration \
        --function-name $POST_CONFIRMATION_FUNCTION \
        --runtime python3.11 \
        --handler postConfirmation.handler \
        --timeout 30 \
        --memory-size 256 \
        --environment Variables="{DB_HOST=$DB_HOST,DB_PORT=5432,DB_NAME=$DB_NAME,DB_USER=$DB_USER,DB_PASSWORD=$DB_PASSWORD}" \
        --region $REGION
else
    echo "Creating new function..."
    aws lambda create-function \
        --function-name $POST_CONFIRMATION_FUNCTION \
        --runtime python3.11 \
        --role $ROLE_ARN \
        --handler postConfirmation.handler \
        --zip-file fileb://postConfirmation.zip \
        --timeout 30 \
        --memory-size 256 \
        --environment Variables="{DB_HOST=$DB_HOST,DB_PORT=5432,DB_NAME=$DB_NAME,DB_USER=$DB_USER,DB_PASSWORD=$DB_PASSWORD}" \
        --region $REGION
fi

# Step 6: Deploy PostAuthentication
echo -e "${GREEN}Step 6: Deploying PostAuthentication function...${NC}"

if aws lambda get-function --function-name $POST_AUTHENTICATION_FUNCTION --region $REGION 2>/dev/null; then
    echo "Updating existing function..."
    aws lambda update-function-code \
        --function-name $POST_AUTHENTICATION_FUNCTION \
        --zip-file fileb://postAuthentication.zip \
        --region $REGION
    
    echo "Updating configuration..."
    aws lambda update-function-configuration \
        --function-name $POST_AUTHENTICATION_FUNCTION \
        --runtime python3.11 \
        --handler postAuthentication.handler \
        --timeout 10 \
        --memory-size 128 \
        --environment Variables="{DB_HOST=$DB_HOST,DB_PORT=5432,DB_NAME=$DB_NAME,DB_USER=$DB_USER,DB_PASSWORD=$DB_PASSWORD}" \
        --region $REGION
else
    echo "Creating new function..."
    aws lambda create-function \
        --function-name $POST_AUTHENTICATION_FUNCTION \
        --runtime python3.11 \
        --role $ROLE_ARN \
        --handler postAuthentication.handler \
        --zip-file fileb://postAuthentication.zip \
        --timeout 10 \
        --memory-size 128 \
        --environment Variables="{DB_HOST=$DB_HOST,DB_PORT=5432,DB_NAME=$DB_NAME,DB_USER=$DB_USER,DB_PASSWORD=$DB_PASSWORD}" \
        --region $REGION
fi

echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Lambda functions deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Test the functions with test events"
echo "2. Check CloudWatch Logs for any errors"
echo "3. Verify Cognito triggers are working"
echo ""
echo "To attach to Cognito User Pool, run:"
echo ""
echo "aws cognito-idp update-user-pool \\"
echo "  --user-pool-id YOUR_USER_POOL_ID \\"
echo "  --lambda-config PostConfirmation=\$(aws lambda get-function --function-name $POST_CONFIRMATION_FUNCTION --query 'Configuration.FunctionArn' --output text),PostAuthentication=\$(aws lambda get-function --function-name $POST_AUTHENTICATION_FUNCTION --query 'Configuration.FunctionArn' --output text) \\"
echo "  --region $REGION"

