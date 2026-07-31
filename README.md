# UpdateMate

UpdateMate turns rough, line-by-line work notes into a clean weekly progress update. It uses only two AWS services:

- **Amazon S3** hosts the static HTML, CSS, and JavaScript frontend.
- **AWS Lambda Function URLs** run the formatting service without API Gateway.

No notes are stored. The browser sends the notes to Lambda only when the user selects **Generate update**.

## Project structure

```text
.
├── index.html             # S3-hosted page
├── styles.css
├── app.js
├── app-config.js          # Add the Lambda Function URL here
└── lambda/
    ├── index.mjs          # Lambda handler and formatting rules
    └── test-format.mjs    # Dependency-free checks
```

## Run locally

Update `app-config.js` with a deployed Function URL, then serve the root directory with any static server. For example:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. The Lambda Function URL must have CORS enabled.

## Deploy the Lambda function

1. In the AWS Lambda console, create a function named `updatemate-formatter`:
   - Author from scratch
   - Runtime: **Node.js 22.x**
   - Architecture: `x86_64`
   - Use or create a basic execution role with CloudWatch Logs permissions.
2. Create a zip that contains `index.mjs` at its root:

   ```bash
   cd lambda
   zip update-mate-lambda.zip index.mjs
   ```

3. In the Lambda console, upload `update-mate-lambda.zip`, then set **Handler** to `index.handler`.
4. Under **Configuration → Function URL**, create a Function URL with:
   - Auth type: `NONE` (appropriate for this public demo only)
   - CORS: allow origin `*`, method `POST`, header `content-type`
5. Copy the Function URL into `app-config.js`:

   ```js
   window.UPDATEMATE_API_URL = 'https://your-id.lambda-url.your-region.on.aws/';
   ```

6. Verify formatting before deployment:

   ```bash
   node test-format.mjs
   ```

## Deploy the S3 site

1. Create an S3 bucket with a globally unique name in your chosen region.
2. In **Properties**, enable **Static website hosting** and choose `index.html` as the index document.
3. In **Permissions**, permit public read access for the site files. For a challenge demo, apply this bucket policy after replacing `YOUR-BUCKET-NAME`:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
     }]
   }
   ```

4. Upload `index.html`, `styles.css`, `app.js`, and the edited `app-config.js` to the bucket root.
5. Open the **Bucket website endpoint** shown in S3 properties and generate an update.

For a production app, restrict Function URL CORS to the site origin and add authentication. The public configuration above is deliberately minimal for a no-account, no-data challenge demo.

## Architecture

```text
User in browser
    │
    ▼
Amazon S3 static website
    │  POST notes + tone
    ▼
AWS Lambda Function URL
    │  rule-based formatting
    ▼
Formatted weekly update
```

## Deploy checklist

- [ ] Function URL copied into `app-config.js`
- [ ] CORS allows the frontend request
- [ ] Four frontend files uploaded at the bucket root
- [ ] Tested Professional, Short, and Casual tones
- [ ] S3 website endpoint opens in an incognito window
