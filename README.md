# UpdateMate

UpdateMate turns rough, line-by-line work notes into a clean weekly progress update for email or Slack. It uses two AWS Free Tier services:

- **Amazon S3** hosts the static HTML, CSS, JavaScript, and the shared formatter.
- **AWS Lambda Function URLs** run the same formatter without API Gateway.

No notes are stored on the server. The browser sends notes to Lambda only when the user selects **Generate update**. If the Function URL is unreachable, the same rules run in the browser so a Friday update is never blocked by a network blip.

Recent copies stay in `localStorage` on this device only.

## Project structure

```text
.
├── index.html             # S3-hosted page
├── styles.css
├── app.js
├── app-config.js          # Lambda Function URL
├── formatter.js           # Shared formatting rules (browser + Lambda)
└── lambda/
    ├── index.mjs          # Lambda handler
    ├── formatter.js       # Copy of the shared writer (zip this)
    └── test-format.mjs    # Dependency-free checks
```

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. Leave `app-config.js` empty to format only in the browser, or paste a Function URL to use Lambda first.

```bash
node lambda/test-format.mjs
```

## Deploy

```bash
./deploy.sh
```

The script runs the formatter tests, zips `lambda/index.mjs` with `formatter.js`, updates the Lambda function, and uploads the static files to the S3 website bucket.

Manual steps if you prefer the console:

1. Create a Node.js 22.x function named `updatemate-formatter`.
2. Copy the writer into the zip:

   ```bash
   cp formatter.js lambda/formatter.js
   cd lambda
   zip update-mate-lambda.zip index.mjs formatter.js
   ```

3. Upload the zip and set **Handler** to `index.handler`.
4. Create a Function URL with auth type `NONE` (public demo only) and CORS for `POST` + `content-type`.
5. Paste the Function URL into `app-config.js`.
6. Enable S3 static website hosting, allow public read of the objects, and upload `index.html`, `styles.css`, `app.js`, `app-config.js`, and `formatter.js`. Set the JavaScript files to `Content-Type: application/javascript`.

For a production app, restrict Function URL CORS to the site origin and add authentication. The public configuration above is deliberately minimal for a no-account, no-data challenge demo.

## Architecture

```text
User in browser
    │ paste notes + choose tone
    ▼
Amazon S3 static website
    │ POST { notes, tone }  (or format locally if Lambda is down)
    ▼
AWS Lambda Function URL
    │ validate → clean → add light grammar → group blockers → format
    ▼
Email, Slack, or standup-ready update
```

## Deploy checklist

- [ ] Formatter tests pass (`node lambda/test-format.mjs`)
- [ ] `formatter.js` is in the Lambda zip
- [ ] Function URL copied into `app-config.js`
- [ ] CORS allows the frontend request
- [ ] Five frontend files uploaded at the bucket root
- [ ] Tested Professional, Short, Casual, and Slack tones
- [ ] Confirmed local fallback by temporarily breaking the Function URL
- [ ] S3 website endpoint opens in an incognito window
