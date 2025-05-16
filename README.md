# Music App

## Environment Setup

1. Copy the environment template files:
```bash
cp src/environments/environment.template.ts src/environments/environment.ts
cp src/environments/environment.prod.template.ts src/environments/environment.prod.ts
```

2. Update the environment files with your AWS credentials:
- `src/environments/environment.ts` for development
- `src/environments/environment.prod.ts` for production

Required AWS configuration:
```typescript
aws: {
  accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID',
  secretAccessKey: 'YOUR_AWS_SECRET_ACCESS_KEY',
  region: 'YOUR_AWS_REGION',
  bucketName: 'YOUR_AWS_BUCKET_NAME'
}
```

**Note: Never commit your actual AWS credentials to version control!**

## Development server

Run `ionic serve` for a dev server. Navigate to `http://localhost:8100/`. The application will automatically reload if you change any of the source files. 