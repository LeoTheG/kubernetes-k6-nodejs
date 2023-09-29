#!/bin/bash

npm run build

# receive the url as a parameter
k6 run -e MY_APP_URL=$1 dist/scripts/loadTesting.js