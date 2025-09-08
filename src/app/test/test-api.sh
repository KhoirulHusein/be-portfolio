#!/bin/bash

# Test Script for Authentication API
# Run this script to test all endpoints

BASE_URL="http://localhost:4000/api/v1"

echo "🚀 Testing Authentication API at $BASE_URL"
echo "=============================================="

# Function to pretty print JSON (basic, no jq needed)
pretty_json() {
  echo "$1" | python3 -m json.tool 2>/dev/null || echo "$1"
}

# Test Health Check
echo "1. Testing Health Check..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
pretty_json "$HEALTH_RESPONSE"
echo ""

# Test Registration
echo "2. Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser@example.com", "username": "testuser", "password": "password123"}')
pretty_json "$REGISTER_RESPONSE"
echo ""

# Test Login
echo "3. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername": "testuser@example.com", "password": "password123"}')
pretty_json "$LOGIN_RESPONSE"

# Extract tokens (simple grep approach)
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
echo ""

# Test Me endpoint
echo "4. Testing /me endpoint..."
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
pretty_json "$ME_RESPONSE"
echo ""

# Test Refresh Token
echo "5. Testing Refresh Token..."
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")
pretty_json "$REFRESH_RESPONSE"

# Extract new tokens
NEW_ACCESS_TOKEN=$(echo $REFRESH_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
NEW_REFRESH_TOKEN=$(echo $REFRESH_RESPONSE | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
echo ""

# Test Logout
echo "6. Testing Logout..."
LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$NEW_REFRESH_TOKEN\"}")
pretty_json "$LOGOUT_RESPONSE"
echo ""

# Test CORS Preflight
echo "7. Testing CORS Preflight..."
curl -s -X OPTIONS "$BASE_URL/auth/login" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" -v
echo ""

echo "✅ All tests completed!"
