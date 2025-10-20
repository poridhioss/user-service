#!/bin/bash

BASE_URL="http://localhost:5000/api/users"

echo "==============================="
echo "1. Creating Users"
echo "==============================="

user1=$(curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com"}')

user2=$(curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob", "email": "bob@example.com"}')

user3=$(curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob", "email": ""}')

id1=$(echo "$user1" | jq -r '.id')
id2=$(echo "$user2" | jq -r '.id')
id3=$(echo "$user3" | jq -r '.id')

echo "Created User 1: $user1"
echo "Created User 2: $user2"
echo "Created User 3: $user3"

echo "==============================="
echo "2. Get Specific User (ID: $id1)"
echo "==============================="
curl -s $BASE_URL/$id1 | jq

echo "==============================="
echo "3. Update User (ID: $id1)"
echo "==============================="
updated_user=$(curl -s -X PUT $BASE_URL/$id1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Updated", "email": "alice.updated@example.com"}')

echo "$updated_user" | jq

echo "==============================="
echo "4. Delete User (ID: $id1)"
echo "==============================="
curl -s -X DELETE $BASE_URL/$id1 | jq

echo "==============================="
echo "5. Get All Users"
echo "==============================="
curl -s $BASE_URL | jq