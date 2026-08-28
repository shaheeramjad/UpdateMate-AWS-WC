# Weekend Showcase Challenge: UpdateMate

**Tags:** `#application` `#productivity` `#challenge` `#aws-free-tier`

This is my victory lap for the Summer Build Series. In July I shipped **UpdateMate**, a tiny app that turns Friday-night notes into a status update I can actually send. In the creative weekend I learned that the thing people remember is the object on screen, not the number of boxes in a diagram. In the agent weekend I learned that a useful system can wake up without a button. For the showcase I came back to the tool I still open, and I finished the parts I ran out of time for.

The problem never went away. Every Friday I still have the same deceptively small task: turn a week of scattered notes into a useful progress update. The work is already done, but writing a clear summary still means opening a blank message, deciding what belongs together, and trying to phrase a blocker constructively. UpdateMate removes that friction. You paste notes such as “Fixed login bug,” “Reviewed two pull requests,” “Started learning AWS Lambda,” and “Blocked by database issue,” choose a tone, and copy a ready-to-send result.

Try the live app: [UpdateMate](http://updatemate-shaheer-2026.s3-website-us-east-1.amazonaws.com/)

## Vision and what it does

UpdateMate is for anyone who regularly sends a status update: developers reporting to a manager, students recording project progress, open-source contributors, or teams sharing a weekly check-in. It does not invent work that did not happen. It makes the work you already noted easier to communicate.

The flow is still short on purpose:

1. Paste one rough note per line.
2. Select Professional, Short, Casual, or Slack.
3. Press **Generate update**, or use Ctrl/⌘ + Enter, then copy the result.

Behind the scenes the app removes empty lines, bullet characters, and list numbering. It recognizes notes beginning with terms such as “blocked,” “blocker,” “waiting on,” and “awaiting,” then separates those from completed items. This weekend I added the finishing touch the first version needed: light grammar so “Fixed login bug” becomes “I fixed a login bug,” and “Blocked by database issue” becomes “I am currently blocked by a database issue.” The Slack tone returns a copy-paste list with `*This week*` and `*Blocker*` headings, which is the format I actually use in a team channel.

I still chose transparent, rule-based formatting instead of calling a model for every Friday update. I used Amazon Nova on the agent weekend, and it is the right tool when the input is messy GitHub issues. Weekly notes are already facts the user typed. Predictable rules keep the output honest, fast, and cheap. They also keep the architecture inside the Free Tier.

Nothing is stored on the server. The last few copies stay in the browser so you can reopen what you just sent, and they never leave the device.

## How I built it

The first version was the smallest useful workflow: a text area, three tones, a Generate button, and a Copy button. Plain HTML, CSS, and JavaScript, no build step, published as static files. The page is two panels: a light workspace for rough notes and a dark result panel that makes the finished update easy to find.

The frontend sends the notes and selected tone to a Lambda Function URL as JSON. The Node.js handler validates the request, limits notes to 5,000 characters, cleans each line, detects blockers with a regular expression, and formats the response. For the showcase I extracted those rules into a shared `formatter.js` module. Lambda imports it. The browser imports the same file. That was a lesson from the creative weekend: if the writer lives in one place, the UI cannot drift from the backend, and the demo still works when a Function URL is cold or blocked.

An early deployment issue is still the most useful debugging lesson I carried all summer. The browser showed a `200` response but blocked the request because `Access-Control-Allow-Origin` appeared twice. I had configured CORS on the Lambda Function URL and also returned CORS headers from the handler. The fix was to let the Function URL manage CORS. I did not reintroduce that bug this weekend.

The new work was quality, not ceremony. I added a small article-insertion helper for countable nouns such as “bug,” “issue,” and “incident,” a Slack tone, a keyboard shortcut, and a local history list. If Lambda cannot be reached, the page formats the notes itself and says so. Friday still ships.

I also kept the handler able to accept both the Function URL event format and a direct Lambda console test event, and I wrote dependency-free tests for the four tones plus invalid requests. Those tests run before deploy.

## AWS services used and architecture overview

UpdateMate still uses two AWS services on the Free Tier:

- **Amazon S3** hosts the static website: HTML, CSS, JavaScript, and the shared formatter.
- **AWS Lambda** runs the Node.js formatting function. A **Lambda Function URL** exposes that function directly, so the project does not need API Gateway.

```text
User
  │ enters rough notes and chooses a tone
  ▼
Amazon S3 static website
  │ POST { notes, tone }
  │ (same formatter.js runs locally if Lambda is down)
  ▼
AWS Lambda Function URL
  │ validate → clean → light grammar → group blockers → format
  ▼
Email or Slack-ready weekly update in the browser
```

The trigger is still the **Generate update** button. That click is the only time notes leave the browser. Lambda returns formatted text. The frontend displays it and copies it. There is no database, no account, and no persisted work notes in AWS.

For the public challenge demo, the Function URL uses public invocation and CORS for browser access. That is appropriate for this small, no-account tool. A production version that handled private work updates should restrict CORS to the known site origin and add authentication. The S3 website is public-read so visitors can open the app link.

I used more of the platform elsewhere this summer — Amazon EventBridge, Amazon Bedrock (Nova), Amazon SES, and AWS CDK in GitGuardian, an agent that summarizes GitHub issues on a schedule — but I did not bolt those onto UpdateMate. A Friday formatter does not need a model, a bus, or an inbox. The showcase version is the original idea taken further, not a pile of extra services.

## What I learned across the summer

The Summer Build Series changed how I decide what to ship.

From the productivity weekend I learned that a useful AWS app does not need a large architecture. Amazon S3 static website hosting is enough to publish a real frontend. Lambda Function URLs are enough for a single backend endpoint. I still treat browser integration as part of backend work: a function can pass in the console and fail in the live page because of CORS.

From the creative weekend I learned that constraints are a product decision. A postcard that must fit on the back of a card cannot ramble. A weekly update that must fit in Slack cannot either. Sharing one generator between the browser and Lambda, and spending time on type and a clear object, did more than adding another box to the diagram.

From the agent weekend I learned the other half of “useful.” GitGuardian does not wait for me to press Generate. EventBridge wakes a Lambda at 08:00, Bedrock reads the day’s issues, and SES delivers the brief. That taught me when a model earns its keep: when the input is unstructured and the output is a report I would not write by hand. It also taught me to keep secrets in SSM and to make the scheduled path boring enough to trust.

The showcase weekend tied those lessons together. UpdateMate is still a button, on purpose. The finishing touch was making the writing sound like a person, giving me a Slack format, and making the formatter portable so the app degrades gracefully. I did not add Bedrock here because I had already learned where it belongs.

Most importantly, I learned to finish the small tool I actually use. The victory lap is not a new architecture. It is a Friday helper that is honest, fast, and finally ready to show.

## Link to app or repo

- **Live app:** [UpdateMate](http://updatemate-shaheer-2026.s3-website-us-east-1.amazonaws.com/)
- **Source code:** [https://github.com/shaheeramjad/UpdateMate-AWS-WC](https://github.com/shaheeramjad/UpdateMate-AWS-WC)

## Builder who inspired me

I want to tag **Ben Fowler**, who hosted this Summer Build Series on AWS Builder Center and kept the prompts small enough that a weekend was enough. The series asked for a wishlist idea, a creative app, an agent that runs on its own, and then this showcase. That sequence is why UpdateMate exists in public instead of as a private script.

I also want to thank the builders who shipped in the comments all summer, especially the folks who proved an agent could be one Lambda and a schedule. That constraint is what made GitGuardian possible, and it is what stopped me from turning this Friday helper into a platform.
