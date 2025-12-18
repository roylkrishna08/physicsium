---
description: Steps to deploy the Vue.js app to Vercel
---

# Deploy to Vercel

Follow these steps to deploy your 'Physicsium' application to Vercel.

## 1. Initialize Git Repository
Vercel requires a git repository (optional but recommended for CI/CD) or can upload locally. We will initialize a local one.

// turbo
```bash
git init
```

// turbo
```bash
git add .
```

// turbo
```bash
git commit -m "Initial commit for Vercel deployment"
```

## 2. Deploy using Vercel CLI
We will use `npx` to run the Vercel CLI without installing it globally.

**Note**: The first time you run this, it will ask you to:
1. Log in (it will open your browser).
2. Confirm the project scope.
3. Link to existing project (Answer "N" for No).
4. Project Name (Press Enter for default).
5. Directory (Press Enter for `./`).
6. Build Settings (Press Enter for default auto-detection).

```bash
npx vercel
```

## 3. Production Deployment
Once satisfied with the preview, deploy to production.

```bash
npx vercel --prod
```
