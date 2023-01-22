#!/bin/bash

URL="ha101-1.overkiz.com"
API="https://$URL/enduser-mobile-web/enduserAPI"

# Prompt the user to enter a userId
read -p "Enter userId: " userId

# Prompt the user to enter a userPassword without displaying it on the screen
read -s -p "Enter userPassword: " userPassword

# Prompt the user to enter a PIN
read -p "Enter PIN: " pin

# Prompt the user to enter a label to be user for the token
read -p "Enter token label: " tokenLabel

# Make a POST request to the login URL with the userId and userPassword passed as form URL encoded data
# and save the cookies that are returned
cookies=$(curl -s -c - -d "userId=$userId" -d "userPassword=$userPassword" -X POST "$API/login")

# Make a GET request to the generate tokens URL with the PIN as a parameter and the cookies sent
# Save the "token" field from the response
token=$(curl -s -b "$cookies" "$API/config/$pin/local/tokens/generate" | jq -r '.token')

# Make a POST request to the tokens URL with the PIN as a parameter, the cookies sent and the token as a JSON body
curl -s -b "$cookies" -H "Content-Type: application/json" \
   -d '{"label": "'"$tokenLabel"'", "token": "'"$token"'", "scope": "devmode"}' \
   -X POST "$API/config/$pin/local/tokens"

# Display the token to the user
echo "Your token: $token