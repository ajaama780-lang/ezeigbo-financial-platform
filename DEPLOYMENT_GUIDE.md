# EZEIGBO Deployment Guide

Complete instructions for deploying EZEIGBO to production.

## 🚀 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] Supabase RLS policies configured
- [ ] Admin user created
- [ ] Initial packages created
- [ ] SSL certificate ready
- [ ] Domain configured

## 🔧 Environment Configuration

### Development Environment

Create `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Production Environment

Create `.env.production`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 🗄️ Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note the Project URL and Anon Key
4. Enable Auth
5. Configure Email templates (optional)

### 2. Apply Database Schema

The schema is automatically applied through migrations. Verify all tables exist:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Expected tables:
- profiles
- wallets
- wallet_transactions
- packages
- customer_packages
- rewards
- deposits
- withdrawals
- notifications
- audit_logs

### 3. Configure Row-Level Security (RLS)

Enable RLS on all tables:

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

### 4. Create Policies

Create policies to restrict customer access to their own data:

```sql
-- Customers can view their own profile
CREATE POLICY "Customers can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id AND is_customer = true);

-- Customers can view their own wallet
CREATE POLICY "Customers can view own wallet"
ON wallets FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));
```

### 5. Create Admin User

```sql
-- Create admin user via Supabase Auth, then:
INSERT INTO profiles (id, phone_number, full_name, is_admin, is_customer, account_status)
VALUES (
  'admin-uuid-here',
  'admin-phone',
  'Admin User',
  true,
  false,
  'active'
);
```

### 6. Seed Initial Packages

```sql
INSERT INTO packages (name, amount, duration_days, reward_rate, description, is_active)
VALUES
('Condom', 500, 15, 2.0, 'Entry level investment package', true),
('Ulo', 1000, 15, 2.5, 'Standard investment package', true),
('Echi', 3000, 15, 3.0, 'Premium investment package', true),
('TaTa', 5000, 15, 3.5, 'Elite investment package', true);
```

## 🔐 Edge Functions Deployment

### 1. Deploy Functions

```bash
# Deploy auth-register
supabase functions deploy auth-register

# Deploy deposit-approve
supabase functions deploy deposit-approve

# Deploy purchase-package
supabase functions deploy purchase-package

# Deploy process-rewards
supabase functions deploy process-rewards

# Deploy withdrawal-process
supabase functions deploy withdrawal-process
```

### 2. Configure Function Secrets

If using external APIs, add secrets:

```bash
supabase secrets set EXTERNAL_API_KEY=value
```

### 3. Set Up Scheduled Functions

For reward processing, configure a cron trigger in Supabase:

```sql
-- Create pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule reward processing daily at 2 AM UTC
SELECT cron.schedule('process-daily-rewards', '0 2 * * *', 'SELECT http_post(...)');
```

## 🏗️ Building for Production

### 1. Build the Application

```bash
npm run build
```

This creates a `dist` folder with optimized production build.

### 2. Test Production Build

```bash
npm run preview
```

### 3. Verify Build

- [ ] No console errors
- [ ] All assets loaded
- [ ] No missing environment variables
- [ ] Performance acceptable

## 📦 Deployment Platforms

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Configure `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_key"
  }
}
```

### Option 2: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy
```

### Option 3: Self-Hosted (Docker)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=0 /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

Build and run:
```bash
docker build -t ezeigbo .
docker run -p 3000:3000 ezeigbo
```

## 🔒 Security Checklist

- [ ] HTTPS enabled
- [ ] CORS configured properly
- [ ] API keys not exposed in frontend
- [ ] Sensitive data not logged
- [ ] Rate limiting enabled
- [ ] DDoS protection enabled
- [ ] SQL injection prevented
- [ ] XSS protection enabled
- [ ] CSRF tokens used
- [ ] Authentication secure
- [ ] Authorization enforced
- [ ] Audit logging enabled

## 📊 Monitoring & Logging

### 1. Set Up Error Tracking

```bash
# Using Sentry
npm install @sentry/react
```

Configure:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 0.1,
});
```

### 2. Set Up Analytics

```bash
# Using Plausible or Google Analytics
npm install plausible-tracker
```

### 3. Monitor Supabase

- Check Supabase dashboard for errors
- Monitor database performance
- Review edge function logs
- Check authentication metrics

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: vercel --prod
```

## 📈 Performance Optimization

### 1. Enable Caching

Configure cache headers in deployment:
```
/dist/index.html - no-cache
/dist/assets/* - max-age=31536000
```

### 2. Enable Compression

```bash
# Gzip compression enabled by default on Vercel/Netlify
```

### 3. Optimize Images

All images should be optimized before deployment.

### 4. Code Splitting

React Router automatically code-splits pages.

## 🚨 Post-Deployment

### 1. Verify Deployment

- [ ] Site loads correctly
- [ ] All pages accessible
- [ ] Database connected
- [ ] Authentication works
- [ ] Payments functional
- [ ] Notifications working
- [ ] Emails sending
- [ ] Analytics tracking

### 2. Create Backup

```bash
# Backup Supabase database
pg_dump postgresql://user:password@host/database > backup.sql
```

### 3. Set Up Monitoring

- [ ] Error tracking enabled
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring enabled
- [ ] Log aggregation enabled

### 4. Document Deployment

Record:
- Deployment date
- Version deployed
- Environment variables used
- Database state
- Known issues

## 🔄 Updates & Maintenance

### Regular Tasks

**Weekly:**
- [ ] Check error logs
- [ ] Monitor performance
- [ ] Verify backups

**Monthly:**
- [ ] Update dependencies
- [ ] Review security
- [ ] Analyze user feedback

**Quarterly:**
- [ ] Full security audit
- [ ] Performance review
- [ ] Database optimization

### Rollback Procedure

```bash
# If deployment fails, rollback:
vercel rollback
```

Or manually redeploy previous version:
```bash
git checkout previous-commit
npm run build
# Deploy
```

## 📞 Support & Troubleshooting

### Common Issues

**Issue: Database connection fails**
- Check Supabase URL and key
- Verify network connectivity
- Check RLS policies

**Issue: Edge functions not working**
- Check function logs in Supabase dashboard
- Verify environment variables
- Test function locally

**Issue: Authentication not working**
- Check Auth settings in Supabase
- Verify email configuration
- Clear browser cache

## 📝 Deployment Log

Date: ___________
Version: ___________
Environment: Production
Status: ✅ Live / ❌ Failed

Issues encountered:
___________________________________________________________

Resolved by:
___________________________________________________________

Next steps:
___________________________________________________________

---

**Deployed by: [Name]**
**Approved by: [Manager]**
