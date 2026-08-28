#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BUCKET="${BUCKET:-updatemate-shaheer-2026}"
FUNCTION="${FUNCTION:-updatemate-formatter}"
REGION="${AWS_REGION:-us-east-1}"

cd "$ROOT"
node lambda/test-format.mjs

cp formatter.js lambda/formatter.js
cd lambda
zip -q update-mate-lambda.zip index.mjs formatter.js
cd "$ROOT"

aws lambda update-function-code \
  --region "$REGION" \
  --function-name "$FUNCTION" \
  --zip-file "fileb://lambda/update-mate-lambda.zip" \
  --no-cli-pager

for file in index.html styles.css app.js app-config.js formatter.js; do
  content_type="text/html"
  case "$file" in
    *.css) content_type="text/css" ;;
    *.js) content_type="application/javascript" ;;
  esac
  aws s3 cp "$file" "s3://$BUCKET/$file" \
    --region "$REGION" \
    --content-type "$content_type" \
    --cache-control "max-age=60"
done

echo "Deployed UpdateMate to Lambda ($FUNCTION) and s3://$BUCKET"
echo "Site: http://$BUCKET.s3-website-$REGION.amazonaws.com/"
