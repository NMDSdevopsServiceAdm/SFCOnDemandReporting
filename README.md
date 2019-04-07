# SFCOnDemandReporting
Skills for Care On-Demand Reporting.

## microservices
Each report is packaged as a lambda function and deployed to AWS.

## SfC API
Each lambda function calls back on to the SfC API, to get data and then aggregate/summarise data
to generate a report.

## Invocation
No external access to these reports. The reports are executed based on AWS CloudWatch schedule or
in response to events emitted from the SfC API - such as, creating a workplace or updating a staff record.

## Slack Notification
No external access to these reports. The reports once ready are delivered securely to a Slack channel.

## Security
Utilises AWS Secret Manager, via an IAM policy, to obtain credentials for Slack notification, but also
the credentials to access the SfC API.

# To Deploy
You need AWS credentials with administrative permissions to run CloudFormation and create the lambda resources.

Requires a "serverless-admin" AWS credentials profile name.

Run: `./node_modules/.bin/serverless config credentials --provider aws --key <your key> --secret <your secret> --profile serverless-admin --overwrite`

You also need the MongoDB URI - must be passed as a parameter to serverless build and deploy, such that the
sensitive information including username and password are not stored.

Run: `MONGO_DB_URI='mongodb+srv://<db username>:<db password>@<db host>/<db name>' npm run package:dev`:
* Note, the uri is contained within single quotes.
* The `MONGO_DB_URI` is the environment variable name.