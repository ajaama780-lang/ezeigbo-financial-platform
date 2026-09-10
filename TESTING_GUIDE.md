# EZEIGBO Testing Guide

Complete testing procedures for all features of the EZEIGBO platform.

## 🧪 Test Environment Setup

1. Start the development server: `npm run dev`
2. Access the application at `http://localhost:5173`
3. Ensure Supabase is properly configured

## 👤 User Registration & Authentication

### Test 1: Customer Registration
**Steps:**
1. Go to Landing page
2. Click "Get Started" or navigate to `/register`
3. Enter full name: "Test User"
4. Enter phone number: "08012345678"
5. Enter password: "password123"
6. Confirm password: "password123"
7. Click Register

**Expected Results:**
- ✅ New account created
- ✅ Wallet automatically created with ₦0 balance
- ✅ Profile created with is_customer=true
- ✅ Redirected to login page
- ✅ Success notification shown

### Test 2: Customer Login
**Steps:**
1. Go to `/login`
2. Enter phone number: "08012345678"
3. Enter password: "password123"
4. Click Login

**Expected Results:**
- ✅ Session created
- ✅ Redirected to dashboard
- ✅ User profile displayed
- ✅ Wallet data loaded

### Test 3: Admin Login
**Steps:**
1. Go to `/admin-login`
2. Enter phone number: "admin_phone"
3. Enter password: "admin_password"
4. Click Login

**Expected Results:**
- ✅ Admin session created
- ✅ Redirected to admin dashboard
- ✅ Admin menu visible
- ✅ Statistics loaded

### Test 4: Logout
**Steps:**
1. From any authenticated page
2. Click Logout button
3. Verify redirect to login

**Expected Results:**
- ✅ Session terminated
- ✅ Redirected to login page
- ✅ Cannot access protected pages

## 💰 Deposit System

### Test 5: Submit Deposit Request
**Steps:**
1. Login as customer
2. Navigate to `/deposit`
3. Enter amount: "1000"
4. Click Submit

**Expected Results:**
- ✅ Deposit record created with status="pending"
- ✅ Wallet pending_balance shows ₦1000
- ✅ Available balance unchanged
- ✅ Notification sent
- ✅ Transaction history updated

### Test 6: Minimum Deposit Validation
**Steps:**
1. Try to deposit ₦100 (below ₦500 minimum)

**Expected Results:**
- ✅ Error message: "Minimum deposit is ₦500"
- ✅ Form not submitted

### Test 7: Maximum Deposit Validation
**Steps:**
1. Try to deposit ₦10,000 (above ₦5,000 maximum)

**Expected Results:**
- ✅ Error message: "Maximum deposit is ₦5,000"
- ✅ Form not submitted

### Test 8: Admin Approve Deposit
**Steps:**
1. Login as admin
2. Navigate to `/admin/deposits`
3. Find pending deposit
4. Click Approve

**Expected Results:**
- ✅ Deposit status changed to "approved"
- ✅ Customer wallet available_balance credited
- ✅ Pending balance cleared
- ✅ Transaction ledger entry created
- ✅ Customer notification sent

### Test 9: Admin Reject Deposit
**Steps:**
1. Login as admin
2. Navigate to `/admin/deposits`
3. Find pending deposit
4. Click Reject
5. Enter reason: "Duplicate request"

**Expected Results:**
- ✅ Deposit status changed to "rejected"
- ✅ Rejection reason recorded
- ✅ Wallet unchanged
- ✅ Customer notification sent with reason

## 📦 Package System

### Test 10: View Packages
**Steps:**
1. Login as customer
2. Navigate to `/packages`

**Expected Results:**
- ✅ All 4 packages displayed (Condom, Ulo, Echi, TaTa)
- ✅ Package details shown (amount, duration, reward rate)
- ✅ Purchase buttons visible
- ✅ Responsive layout on mobile

### Test 11: Purchase Package (Sufficient Balance)
**Steps:**
1. Ensure wallet has ₦1000+ balance
2. Click "Buy" on Ulo package (₦1000)

**Expected Results:**
- ✅ Confirmation dialog shown
- ✅ Amount deducted from available balance
- ✅ Package record created with status="active"
- ✅ Expiry date set to 15 days from now
- ✅ Package appears in "My Packages"
- ✅ Transaction ledger entry created
- ✅ Notification sent

### Test 12: Purchase Package (Insufficient Balance)
**Steps:**
1. Ensure wallet has less than package amount
2. Try to purchase package

**Expected Results:**
- ✅ Error message: "Insufficient balance"
- ✅ Purchase not processed

### Test 13: Prevent Duplicate Purchase (Double-click)
**Steps:**
1. Click purchase button twice rapidly

**Expected Results:**
- ✅ Only one purchase processed
- ✅ Second request rejected
- ✅ Balance only deducted once

### Test 14: View My Packages
**Steps:**
1. Navigate to `/my-packages`
2. View active packages

**Expected Results:**
- ✅ Active packages displayed
- ✅ Expired packages in separate section
- ✅ Days remaining calculated correctly
- ✅ Total earned shown
- ✅ Filter buttons work

### Test 15: Package Expiration
**Steps:**
1. Wait for package to expire (or manually set expiry_date to past)
2. Check package status

**Expected Results:**
- ✅ Package status changed to "expired"
- ✅ No more rewards generated
- ✅ Displayed in expired section
- ✅ Customer can purchase new package

## 🎁 Reward System

### Test 16: Reward Generation
**Steps:**
1. Purchase a package
2. Wait for daily reward processing
3. Check wallet and earnings

**Expected Results:**
- ✅ Reward calculated based on package rate
- ✅ Amount credited to wallet
- ✅ Transaction ledger entry created
- ✅ Package total_earned updated
- ✅ Visible in earnings page

### Test 17: View Earnings
**Steps:**
1. Navigate to `/earnings`
2. View reward history

**Expected Results:**
- ✅ All rewards displayed
- ✅ Total earnings calculated
- ✅ Reward dates shown
- ✅ Package information linked

## 💳 Withdrawal System

### Test 18: Submit Withdrawal Request
**Steps:**
1. Ensure available balance ≥ ₦600
2. Navigate to `/withdraw`
3. Enter amount: "1000"
4. Enter bank name: "GTBank"
5. Enter account number: "1234567890"
6. Enter account name: "Test User"
7. Click Submit

**Expected Results:**
- ✅ Withdrawal record created with status="pending"
- ✅ Amount deducted from available balance (reserved)
- ✅ Wallet transaction ledger updated
- ✅ Notification sent
- ✅ Cannot withdraw same amount again

### Test 19: Minimum Withdrawal Validation
**Steps:**
1. Try to withdraw ₦500 (below ₦600 minimum)

**Expected Results:**
- ✅ Error message: "Minimum withdrawal is ₦600"
- ✅ Form not submitted

### Test 20: Insufficient Balance for Withdrawal
**Steps:**
1. Ensure balance is less than requested amount
2. Try to withdraw

**Expected Results:**
- ✅ Error message: "Insufficient balance"
- ✅ Withdrawal not processed

### Test 21: Admin Approve Withdrawal
**Steps:**
1. Login as admin
2. Navigate to `/admin/withdrawals`
3. Find pending withdrawal
4. Click Approve

**Expected Results:**
- ✅ Status changed to "approved"
- ✅ Admin notes can be added
- ✅ Notification sent to customer

### Test 22: Admin Mark Withdrawal as Paid
**Steps:**
1. After approving
2. Click "Mark as Paid"
3. Confirm payment

**Expected Results:**
- ✅ Status changed to "paid"
- ✅ Paid date recorded
- ✅ Customer notification sent
- ✅ Transaction marked as completed

### Test 23: Admin Reject Withdrawal
**Steps:**
1. Find pending withdrawal
2. Click Reject
3. Enter reason: "Invalid account"

**Expected Results:**
- ✅ Status changed to "rejected"
- ✅ Amount returned to available balance
- ✅ Reason recorded
- ✅ Customer notification sent

### Test 24: Withdrawal History
**Steps:**
1. Navigate to `/withdrawal-history`
2. View all withdrawals

**Expected Results:**
- ✅ All withdrawals displayed
- ✅ Status clearly shown
- ✅ Amounts and dates visible
- ✅ Filter by status works

## 📊 Wallet & Transactions

### Test 25: Wallet Balance Consistency
**Steps:**
1. Perform multiple financial operations
2. Check wallet balance
3. Verify against transaction ledger

**Expected Results:**
- ✅ Balance = Sum of all transactions
- ✅ No negative balances
- ✅ Every operation recorded
- ✅ Audit trail complete

### Test 26: Transaction History
**Steps:**
1. Navigate to `/transaction-history`
2. View all transactions

**Expected Results:**
- ✅ All transactions displayed
- ✅ Types shown (deposit, purchase, reward, withdrawal)
- ✅ Amounts and dates visible
- ✅ Status indicators present
- ✅ Sorting/filtering works

### Test 27: Wallet Page
**Steps:**
1. Navigate to `/wallet`

**Expected Results:**
- ✅ Available balance displayed
- ✅ Pending balance shown
- ✅ Total deposited shown
- ✅ Total withdrawn shown
- ✅ Total earned shown
- ✅ Recent transactions visible

## 👥 Account Management

### Test 28: View Profile
**Steps:**
1. Navigate to `/profile`

**Expected Results:**
- ✅ Full name displayed
- ✅ Phone number displayed
- ✅ Account status shown
- ✅ Join date visible

### Test 29: Account Restriction
**Steps:**
1. Login as admin
2. Navigate to `/admin/customers`
3. Find customer
4. Click "Restrict"

**Expected Results:**
- ✅ Account status changed to "restricted"
- ✅ Customer cannot make new purchases
- ✅ Customer cannot submit withdrawals
- ✅ Clear message shown to customer
- ✅ Audit log entry created

### Test 30: Account Reactivation
**Steps:**
1. As admin, find restricted customer
2. Click "Reactivate"

**Expected Results:**
- ✅ Account status changed to "active"
- ✅ Customer can access all features
- ✅ Notification sent
- ✅ Audit log entry created

## 🔐 Admin Features

### Test 31: Customer Search
**Steps:**
1. Navigate to `/admin/customers`
2. Search by name: "Test"
3. Search by phone: "0801"

**Expected Results:**
- ✅ Results filtered correctly
- ✅ Partial matches found
- ✅ Clear results

### Test 32: Customer Details
**Steps:**
1. Click on customer from list
2. View `/admin/customers/:id`

**Expected Results:**
- ✅ Full customer profile shown
- ✅ Wallet information displayed
- ✅ Active packages listed
- ✅ Transaction history visible
- ✅ Deposit/withdrawal history shown

### Test 33: Package Management
**Steps:**
1. Navigate to `/admin/packages`
2. View all packages

**Expected Results:**
- ✅ All packages listed
- ✅ Current settings shown
- ✅ Edit buttons available
- ✅ Enable/disable toggles work

### Test 34: Edit Package
**Steps:**
1. Click Edit on a package
2. Change reward rate from 2% to 2.5%
3. Save changes

**Expected Results:**
- ✅ Changes saved
- ✅ New purchases use new rate
- ✅ Audit log entry created
- ✅ Previous value recorded

### Test 35: Transaction Monitoring
**Steps:**
1. Navigate to `/admin/transactions`
2. View all platform transactions

**Expected Results:**
- ✅ All transactions displayed
- ✅ Filter by type works
- ✅ Filter by status works
- ✅ Filter by date works
- ✅ Customer information linked

### Test 36: Audit Logs
**Steps:**
1. Navigate to `/admin/audit-logs`
2. View admin actions

**Expected Results:**
- ✅ All admin actions logged
- ✅ Timestamp recorded
- ✅ Admin identified
- ✅ Action details shown
- ✅ Previous/new values recorded

## 📱 Responsive Design

### Test 37: Mobile Layout
**Steps:**
1. Open app on mobile device or use browser dev tools
2. Test all pages in mobile view

**Expected Results:**
- ✅ All content readable
- ✅ Buttons easily tappable
- ✅ Forms responsive
- ✅ Navigation works
- ✅ No horizontal scrolling

### Test 38: Tablet Layout
**Steps:**
1. Test on tablet or 768px+ width

**Expected Results:**
- ✅ Proper spacing
- ✅ Grid layouts work
- ✅ Touch-friendly
- ✅ Good readability

### Test 39: Desktop Layout
**Steps:**
1. Test on desktop at 1920px+

**Expected Results:**
- ✅ Professional layout
- ✅ Proper spacing
- ✅ All features accessible
- ✅ Responsive design

## ⚠️ Error Handling

### Test 40: Network Error Handling
**Steps:**
1. Disconnect internet
2. Try to perform action

**Expected Results:**
- ✅ Error message shown
- ✅ Retry option available
- ✅ No data loss

### Test 41: Form Validation
**Steps:**
1. Submit empty forms
2. Submit invalid data

**Expected Results:**
- ✅ Validation errors shown
- ✅ Clear error messages
- ✅ Form not submitted

### Test 42: Session Timeout
**Steps:**
1. Login
2. Wait for session to expire
3. Try to access protected page

**Expected Results:**
- ✅ Redirected to login
- ✅ Session cleared
- ✅ Message shown

## 📊 Summary

All tests should pass before deployment. Document any failures and create issues for fixes.

**Total Tests: 42**

---

**Testing completed on: [Date]**
**Tester: [Name]**
**Status: [PASS/FAIL]**
