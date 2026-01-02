#!/bin/bash

# Security Check Script
# Git Push 전 보안 검사를 수행합니다

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Security Check ===${NC}"
echo ""

ERRORS=0
WARNINGS=0

# 1. .env 파일이 Git에 포함되지 않는지 확인
echo "1. Checking .env files..."
if git ls-files | grep -q "^\.env$\|^FProject-web/\.env$\|^FProject-web/\.env\.client$\|^FProject-web/\.env\.server$"; then
    echo -e "${RED}❌ ERROR: .env file is tracked by Git!${NC}"
    echo "   Run: git rm --cached .env FProject-web/.env FProject-web/.env.client FProject-web/.env.server"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ .env files are not tracked${NC}"
fi

# 2. .env.example에 실제 Secret이 없는지 확인
echo ""
echo "2. Checking .env examples for secrets..."
if grep -r "GOCSPX-\|test123\|43\.201\.51\.200" FProject-web/.env.*.example 2>/dev/null; then
    echo -e "${RED}❌ ERROR: Secrets found in .env.example files!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ No secrets in .env.example files${NC}"
fi

# 3. 실제 IP 주소가 문서에 없는지 확인
echo ""
echo "3. Checking for exposed IP addresses..."
if git diff --cached --name-only | xargs grep -l "43\.201\.51\.200" 2>/dev/null; then
    echo -e "${YELLOW}⚠ WARNING: IP address found in staged files${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ No IP addresses in staged files${NC}"
fi

# 4. 비밀번호가 하드코딩되지 않았는지 확인
echo ""
echo "4. Checking for hardcoded passwords..."
if git diff --cached | grep -i "password.*=.*['\"].*['\"]" | grep -v "your_.*_password\|placeholder\|example"; then
    echo -e "${RED}❌ ERROR: Hardcoded password found!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ No hardcoded passwords${NC}"
fi

# 5. AWS Access Key가 없는지 확인
echo ""
echo "5. Checking for AWS credentials..."
if git diff --cached | grep -E "AKIA[0-9A-Z]{16}"; then
    echo -e "${RED}❌ ERROR: AWS Access Key found!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ No AWS credentials${NC}"
fi

# 6. Private Key가 없는지 확인
echo ""
echo "6. Checking for private keys..."
if git diff --cached | grep -i "BEGIN.*PRIVATE KEY"; then
    echo -e "${RED}❌ ERROR: Private key found!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ No private keys${NC}"
fi

# 결과 출력
echo ""
echo "================================"
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Security check FAILED${NC}"
    echo -e "${RED}   Errors: $ERRORS${NC}"
    echo -e "${YELLOW}   Warnings: $WARNINGS${NC}"
    echo ""
    echo "Please fix the errors before pushing!"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Security check passed with warnings${NC}"
    echo -e "${YELLOW}   Warnings: $WARNINGS${NC}"
    echo ""
    echo "Review the warnings before pushing."
    exit 0
else
    echo -e "${GREEN}✅ Security check PASSED${NC}"
    echo ""
    echo "Safe to push!"
    exit 0
fi

