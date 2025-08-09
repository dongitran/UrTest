#!/bin/bash

NUM_REQUESTS=$1

if [ -z "$NUM_REQUESTS" ]; then
  echo "Usage: $0 <num_requests>"
  exit 1
fi

for i in $(seq 1 $NUM_REQUESTS); do
  PROCESS_ID=$(uuidgen)

  curl -s -X POST 'http://localhost:3050/api/curl/parse-and-test' \
    -H 'Content-Type: application/json' \
    -H 'accesstoken: GBfZq7orFXrRloVpUVs0CVVkIAO0iXoDuDs2uVClkBcp13YwWsDDUppQ3AFXop7c' \
    -d "{
      \"text\": \"curl -X 'POST' 'https://petclinic-hosted.keploy.io/688f08187ff479477f6a1201/api/owners' -H 'accept: */*' -H 'Content-Type: application/json' -d '{\\\"firstName\\\": \\\"George\\\", \\\"lastName\\\": \\\"Franklin\\\", \\\"address\\\": \\\"110 W. Liberty St.\\\", \\\"city\\\": \\\"Madison\\\", \\\"telephone\\\": \\\"6085551023\\\"}'\",
      \"processId\": \"$PROCESS_ID\"
    }" &
done

wait
echo "✅ Finished $NUM_REQUESTS requests."
