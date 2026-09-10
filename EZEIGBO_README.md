# EZEIGBO - Premium Financial Platform

A complete, production-ready full-stack web application for secure investment management, built with React, TypeScript, Supabase, and Tailwind CSS.

## 🎯 Platform Overview

EZEIGBO is a Nigerian/Igbo-inspired financial platform designed to provide secure, trustworthy investment and wallet management services. The platform features a professional design with dark purple/blue backgrounds, gold accents, and a mobile-first responsive layout.

## 🏗️ Architecture

### Frontend
- **Framework**: React 18.3 with TypeScript
- **Router**: React Router 7
- **State Management**: React Query (TanStack Query)
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui
- **Build Tool**: Vite

### Backend
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Serverless Functions**: Supabase Edge Functions
- **Real-time**: Supabase Realtime

### Database Schema

#### Core Tables
- **profiles** - Customer and admin user accounts
- **wallets** - Wallet balances and tracking
- **wallet_transactions** - Ledger of all transactions
- **packages** - Investment package definitions
- **customer_packages** - Customer's active/expired packages
- **rewards** - Reward credits from packages
- **deposits** - Deposit requests and approvals
- **withdrawals** - Withdrawal requests and processing
- **notifications** - In-app notifications
- **audit_logs** - Admin action audit trail

## 🔐 Security Features

### Authentication
- Phone number-based registration (no email required)
- Secure password hashing via Supabase Auth
- Session-based authentication
- Role-based access control (Customer vs Admin)

### Authorization
- Server-side authorization checks
- Row-level security policies
- Admin-only endpoints protected
- Customer data isolation

### Financial Safety
- Atomic database transactions for all financial operations
- Double-spending prevention
- Wallet ledger tracking every balance change
- No negative balances allowed
- Audit logs for all admin actions

## 👥 User Roles

### Customer
- Registration with phone number, name, and password
- Wallet management
- Package purchases
- Reward tracking
- Deposit submissions
- Withdrawal requests
- Transaction history
- Profile management

### Admin
- Customer management (search, view, restrict)
- Deposit approval/rejection
- Withdrawal processing and payment
- Package management (create, edit, configure)
- Transaction monitoring
- Audit log viewing
- System statistics

## 💰 Financial Features

### Wallet System
- Available balance tracking
- Pending balance management
- Transaction ledger
- Real-time balance updates
- Multiple transaction types:
  - Deposits
  - Package purchases
  - Rewards
  - Withdrawals
  - Refunds
  - Admin adjustments

### Deposits
- Minimum: ₦500
- Maximum: ₦5,000
- Status tracking: Pending → Approved/Rejected
- Admin approval workflow
- Automatic wallet credit on approval

### Packages
1. **Condom** - ₦500 (2% daily reward)
2. **Ulo** - ₦1,000 (2.5% daily reward)
3. **Echi** - ₦3,000 (3% daily reward)
4. **TaTa** - ₦5,000 (3.5% daily reward)

Features:
- 15-day duration (configurable)
- Automatic reward generation
- Expiration handling
- Status tracking (Active/Expired/Cancelled)

### Rewards
- Daily reward calculation
- Configurable reward rates
- Automatic crediting to wallet
- Server-side processing
- Reward history tracking

### Withdrawals
- Minimum: ₦600
- Manual processing workflow
- Bank account details required
- Status tracking: Pending → Approved → Processing → Paid/Rejected
- Admin payment confirmation
- Payment date recording

## 📱 Customer Pages

### Public Pages
- **Landing** - Home page with platform overview
- **Register** - Phone-based registration
- **Login** - Phone + password authentication
- **Admin Login** - Admin portal access

### Customer Dashboard
- **Dashboard** - Overview of wallet, packages, earnings
- **Wallet** - Balance and transaction details
- **Deposit** - Submit deposit requests
- **Packages** - Browse and purchase packages
- **My Packages** - View active/expired packages
- **Earnings** - Reward history and totals
- **Withdraw** - Submit withdrawal requests
- **Withdrawal History** - Track withdrawal status
- **Transaction History** - Complete transaction log
- **Profile** - User profile and settings
- **Notifications** - In-app notifications
- **Logout** - Session termination

### Admin Dashboard
- **Dashboard** - Platform statistics and overview
- **Customers** - Customer list, search, restrict
- **Customer Details** - Individual customer profile
- **Deposits** - Manage deposit requests
- **Withdrawals** - Manage withdrawal requests
- **Packages** - Create and edit packages
- **Transactions** - View all platform transactions
- **Audit Logs** - Admin action history

## 🎨 Design System

### Color Palette
- **Primary**: Dark purple/blue (slate-950, purple-900)
- **Accent**: Gold (amber-400, amber-600)
- **Success**: Green (green-400)
- **Danger**: Red (red-400)
- **Neutral**: Gray (gray-400, gray-500)

### Typography
- Professional, clean fonts
- Clear hierarchy
- Responsive sizing

### Components
- Cards with hover effects
- Buttons with variants (primary, outline, ghost)
- Forms with validation
- Tables with sorting/filtering
- Loading states
- Error messages
- Success notifications

## 🔄 Financial Operations

### Package Purchase Flow
1. Customer selects package
2. System verifies available balance
3. Amount deducted from wallet
4. Package record created with expiry date
5. Reward schedule initiated
6. Notification sent to customer

### Deposit Flow
1. Customer submits deposit request
2. Request created with "Pending" status
3. Admin receives notification
4. Admin reviews and approves/rejects
5. If approved: wallet credited, notification sent
6. If rejected: reason provided, notification sent

### Withdrawal Flow
1. Customer submits withdrawal request
2. Amount reserved/deducted from available balance
3. Request created with "Pending" status
4. Admin receives notification
5. Admin verifies and marks as "Processing"
6. Admin sends money to customer bank account
7. Admin marks as "Paid" with payment date
8. Customer receives notification

### Reward Generation
1. Daily scheduled process
2. Checks all active packages
3. Calculates rewards based on package rate
4. Creates reward records
5. Transfers to wallet via transaction
6. Updates customer package total earned

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
# Create .env.local with Supabase credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Start development server
npm run dev

# Build for production
npm run build
```

### Database Setup
All tables are automatically created via Supabase migrations. The database schema includes:
- Proper foreign keys and constraints
- Indexes for performance
- Decimal types for financial amounts
- Timestamps for audit trails

## 📊 Key Features

### Real-time Updates
- Live wallet balance updates
- Notification delivery
- Transaction status changes

### Responsive Design
- Mobile-first approach
- Optimized for Android and iOS
- Tablet support
- Desktop experience

### Error Handling
- Validation on all forms
- Clear error messages
- Retry mechanisms
- Graceful degradation

### Performance
- Optimized queries
- Lazy loading
- Code splitting
- Caching strategies

## 🔍 Testing Checklist

- [ ] Registration with phone number
- [ ] Login with credentials
- [ ] Logout functionality
- [ ] Deposit submission and approval
- [ ] Package purchase and expiration
- [ ] Reward calculation and crediting
- [ ] Withdrawal submission and processing
- [ ] Account restriction
- [ ] Password reset
- [ ] Admin authorization
- [ ] Transaction history accuracy
- [ ] Wallet balance consistency
- [ ] Mobile responsiveness

## 📝 API Endpoints

### Edge Functions
- `auth-register` - Customer registration
- `deposit-approve` - Deposit approval/rejection
- `purchase-package` - Package purchase
- `process-rewards` - Daily reward processing
- `withdrawal-process` - Withdrawal handling

## 🛡️ Compliance

- No fake balances or mock data
- Real financial ledger
- Auditable transactions
- Admin action logging
- Data protection
- Secure authentication

## 📈 Future Enhancements

- Payment gateway integration (Paystack, Flutterwave)
- SMS notifications
- Email notifications
- Push notifications
- Advanced analytics
- Multi-currency support
- API for third-party integrations
- Mobile app (React Native)

## 📞 Support

For issues or questions, please contact support or create an issue in the repository.

## 📄 License

Proprietary - EZEIGBO Financial Platform

---

**Built with ❤️ for Nigerian investors**
