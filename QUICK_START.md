# EZEIGBO - Quick Start Guide

Get up and running with EZEIGBO in minutes.

## 🚀 Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account
- Git

## ⚡ Quick Setup (5 minutes)

### 1. Clone and Install

```bash
# Install dependencies
npm install

# Or with yarn
yarn install
```

### 2. Configure Supabase

Create `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from your Supabase project settings.

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🧪 Test Credentials

### Customer Account
- **Phone**: 08012345678
- **Password**: password123

### Admin Account
- **Phone**: admin_phone
- **Password**: admin_password

*Note: Create these accounts first via registration*

## 📱 First Steps

1. **Visit Landing Page**: http://localhost:5173
2. **Register**: Create a new customer account
3. **Login**: Use your credentials
4. **View Dashboard**: See your wallet and packages
5. **Make Deposit**: Submit a deposit request
6. **Admin Approval**: Login as admin and approve
7. **Buy Package**: Purchase an investment package
8. **Track Earnings**: View rewards in earnings page

## 🎯 Key URLs

### Customer Pages
- Dashboard: http://localhost:5173/dashboard
- Wallet: http://localhost:5173/wallet
- Deposit: http://localhost:5173/deposit
- Packages: http://localhost:5173/packages
- My Packages: http://localhost:5173/my-packages
- Earnings: http://localhost:5173/earnings
- Withdraw: http://localhost:5173/withdraw
- Withdrawal History: http://localhost:5173/withdrawal-history
- Transaction History: http://localhost:5173/transaction-history
- Profile: http://localhost:5173/profile
- Notifications: http://localhost:5173/notifications

### Admin Pages
- Admin Dashboard: http://localhost:5173/admin/dashboard
- Customers: http://localhost:5173/admin/customers
- Deposits: http://localhost:5173/admin/deposits
- Withdrawals: http://localhost:5173/admin/withdrawals
- Packages: http://localhost:5173/admin/packages
- Transactions: http://localhost:5173/admin/transactions
- Audit Logs: http://localhost:5173/admin/audit-logs

## 💰 Test Financial Operations

### Deposit Flow
1. Go to `/deposit`
2. Enter amount: 1000
3. Submit
4. Login as admin
5. Go to `/admin/deposits`
6. Approve the deposit
7. Check wallet balance increased

### Package Purchase
1. Ensure wallet balance ≥ 1000
2. Go to `/packages`
3. Click "Buy" on any package
4. Confirm purchase
5. Check `/my-packages` to see active package

### Withdrawal Flow
1. Go to `/withdraw`
2. Enter amount: 1000
3. Fill bank details
4. Submit
5. Login as admin
6. Go to `/admin/withdrawals`
7. Approve and mark as paid

## 🔧 Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 📚 Documentation

- **Full Guide**: See `EZEIGBO_README.md`
- **Testing**: See `TESTING_GUIDE.md`
- **Deployment**: See `DEPLOYMENT_GUIDE.md`
- **Project Summary**: See `PROJECT_COMPLETION_SUMMARY.md`

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Use different port
npm run dev -- --port 3000
```

### Supabase Connection Error
- Verify `.env.local` has correct URL and key
- Check Supabase project is active
- Verify network connectivity

### Database Schema Not Found
- Ensure Supabase migrations have been applied
- Check Supabase dashboard for tables
- Verify RLS policies are configured

### Authentication Issues
- Clear browser cookies
- Verify Supabase Auth is enabled
- Check user exists in profiles table

## 💡 Tips

1. **Use Mobile View**: Press F12, then toggle device toolbar to test mobile
2. **Check Console**: Open browser console for errors
3. **Use Admin Panel**: Test all features from admin dashboard
4. **Monitor Transactions**: Watch wallet_transactions table
5. **Check Audit Logs**: All admin actions are logged

## 🎓 Learning the Codebase

### Key Files to Explore

**Pages**:
- `src/pages/customer/Dashboard.tsx` - Main customer dashboard
- `src/pages/admin/Dashboard.tsx` - Admin dashboard
- `src/pages/Landing.tsx` - Home page

**Components**:
- `src/components/ui/` - shadcn/ui components
- Reusable across all pages

**Utilities**:
- `src/lib/supabase.ts` - Supabase client
- `src/lib/auth.ts` - Authentication helpers
- `src/lib/wallet.ts` - Wallet operations
- `src/lib/packages.ts` - Package operations
- `src/lib/admin.ts` - Admin operations

**Styling**:
- `src/index.css` - Design system tokens
- `tailwind.config.ts` - Tailwind configuration

### Architecture Pattern

```
Request → Page Component → useEffect → Supabase Query
                                    ↓
                            State Update
                                    ↓
                            Re-render UI
                                    ↓
                            Display to User
```

## 🔐 Security Reminders

- Never commit `.env.local` with real keys
- Always use HTTPS in production
- Enable RLS on all tables
- Create strong admin passwords
- Regularly audit admin actions
- Monitor transaction logs

## 📞 Support

For issues:
1. Check `TESTING_GUIDE.md` for common scenarios
2. Review browser console for errors
3. Check Supabase logs
4. Verify database schema

## 🎉 You're Ready!

Your EZEIGBO platform is now running. Explore the features, test the workflows, and enjoy building!

---

**Happy coding! 🚀**
