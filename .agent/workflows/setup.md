---
description: Setup and run the Tars Chat App
---

Follow these steps to get the chat application running:

1. **Install Dependencies**
```bash
npm install
```

2. **Setup Clerk**
   - Create a project at [clerk.com](https://clerk.com).
   - Get your Publishable Key and Secret Key.
   - Go to **JWT Templates** -> **New Template** -> **Convex**.
   - Copy the **Issuer** URL.

3. **Setup Convex**
   - Run `npx convex dev` to initialize Convex.
   - In the Convex dashboard, go to **Settings** -> **Environment Variables**.
   - Add `CLERK_JWT_ISSUER_DOMAIN` with the Issuer URL from Clerk.

4. **Environment Variables**
   - Create `.env.local` based on `.env.local.example`.
   - Add your Clerk keys.

5. **Run the App**
```bash
npm run dev
```
