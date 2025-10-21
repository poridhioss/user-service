#!/bin/bash

BASE_URL="http://localhost:5000/api/users"

echo "==============================="
echo "1. Creating 100 Users"
echo "==============================="

declare -a user_ids

for i in $(seq 1 100); do
  name="User$i"
  email="user$i@example.com"

  response=$(curl -s -X POST $BASE_URL \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"$name\", \"email\": \"$email\"}")

  id=$(echo "$response" | jq -r '.id')
  if [ "$id" != "null" ]; then
    user_ids+=("$id")
    echo "Created $name with ID: $id"
  else
    echo "Failed to create $name"
  fi
done

echo "==============================="
echo "2. Get Each User by ID"
echo "==============================="

for id in "${user_ids[@]}"; do
  curl -s $BASE_URL/$id | jq
done

echo "==============================="
echo "3. Update Each User"
echo "==============================="

for id in "${user_ids[@]}"; do
  response=$(curl -s -X PUT $BASE_URL/$id \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"UpdatedUser$id\", \"email\": \"updated$id@example.com\"}")
  echo "Updated ID $id:"
  echo "$response" | jq
done

echo "==============================="
echo "4. Delete Each User"
echo "==============================="

for id in "${user_ids[@]}"; do
  response=$(curl -s -X DELETE $BASE_URL/$id)
  echo "Deleted ID $id:"
  echo "$response" | jq
done

echo "==============================="
echo "5. Get All Remaining Users"
echo "==============================="

curl -s $BASE_URL | jq