# SQS Admin

A web-based administration tool for Amazon Simple Queue Service (SQS), built with TanStack Start.

## Features

- View your SQS queues and their statistics in a paginated table
- Send JSON or text messages to queues
- View messages in queues
- Delete messages from queues
- Redrive message to dead letter queue sources
- Auto-refresh message view
- Dark mode support

## Getting Started

```bash
make setup
```

### Queue Access Permission Config

This project reads `config.yaml` from the project root at startup. It is required and controls:

- Which queue name patterns each signed-in system can access
- The users belongs to which system
- (Optional) Environment queue patterns used by the queue list environment filter

### Environment Variables

| Variable                | Description                                      | Default                          |
| ----------------------- | ------------------------------------------------ | -------------------------------- |
| `AWS_REGION`            | AWS region used by the SQS client                | `ap-east-1`                      |
| `AWS_ACCESS_KEY_ID`     | AWS access key for SQS                           | `test`                           |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for SQS                           | `test`                           |
| `SQS_ENDPOINT`          | custom SQS endpoint                              | `http://localhost:3000`          |
| `AUTH_URL`              | Auth.js endpoint URL for callbacks and redirects | `http://localhost:3001/api/auth` |
| `AUTH_SECRET`           | Secret used by Auth.js to sign/encrypt tokens    | ``                               |
| `COGNITO_CLIENT_ID`     | Amazon Cognito app client ID                     | ``                               |
| `COGNITO_CLIENT_SECRET` | Amazon Cognito app client secret                 | ``                               |
| `COGNITO_ISSUER`        | Cognito issuer URL (user pool OIDC issuer)       | ``                               |
