# EZEIGBO - API Reference

Complete API documentation for EZEIGBO platform.

## 🔐 Authentication Endpoints

### Register Customer
**POST** `/auth/register`
**Type**: Public

Request:
```json
{
  "phone_number": "08012345678",
  "full_name": "John Doe",
  "password": "password123"
}
```

Response (201):
```json
{
  "user_id": "uuid",
  "phone_number": "08012345678",
  "full_name": "John Doe",
  "wallet_id": "uuid"
}
```

### Login
**POST** `/auth/login`
**Type**: Public

Request:
```json
{
  "phone_number": "08012345678",
  "password": "password123"
}
```

Response (200):
```json
{
  "session": {
    "access_token": "jwt_token",
    "user": {
      "id": "uuid",
      "email": "08012345678@ezeigbo.local"
    }
  }
}
```

### Logout
**POST** `/auth/logout`
**Type**: Protected (Customer)

Response (200):
```json
{
  "success": true
}
```

---

## 💰 Wallet Endpoints

### Get Wallet
**GET** `/wallet`
**Type**: Protected (Customer)

Response (200):
```json
{
  "id": "uuid",
  "customer_id": "uuid",
  "available_balance": 5000.00,
  "pending_balance": 1000.00,
  "total_deposited": 10000.00,
  "total_withdrawn": 5000.00,
  "total_earned": 2500.00
}
```

### Get Transaction History
**GET** `/transactions?type=&status=&limit=50&offset=0`
**Type**: Protected (Customer)

Query Parameters:
- `type`: deposit, withdrawal, package_purchase, reward, refund, admin_adjustment
- `status`: pending, completed, failed, reversed
- `limit`: Number of records (default: 50)
- `offset`: Pagination offset (default: 0)

Response (200):
```json
{
  "transactions": [
    {
      "id": "uuid",
      "transaction_type": "deposit",
      "amount": 1000.00,
      "previous_balance": 0,
      "new_balance": 1000.00,
      "status": "completed",
      "reference": "DEP-2024-001",
      "description": "Deposit approved",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150
}
```

---

## 💳 Deposit Endpoints

### Submit Deposit
**POST** `/deposits`
**Type**: Protected (Customer)

Request:
```json
{
  "amount": 1000
}
```

Validation:
- Minimum: ₦500
- Maximum: ₦5,000

Response (201):
```json
{
  "id": "uuid",
  "customer_id": "uuid",
  "amount": 1000.00,
  "reference": "DEP-2024-001",
  "status": "pending",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Get Deposits (Customer)
**GET** `/deposits`
**Type**: Protected (Customer)

Response (200):
```json
{
  "deposits": [
    {
      "id": "uuid",
      "amount": 1000.00,
      "reference": "DEP-2024-001",
      "status": "approved",
      "created_at": "2024-01-15T10:30:00Z",
      "approved_at": "2024-01-15T11:00:00Z"
    }
  ]
}
```

### Get All Deposits (Admin)
**GET** `/admin/deposits?status=&limit=50&offset=0`
**Type**: Protected (Admin)

Response (200):
```json
{
  "deposits": [
    {
      "id": "uuid",
      "customer_id": "uuid",
      "customer": {
        "full_name": "John Doe",
        "phone_number": "08012345678"
      },
      "amount": 1000.00,
      "reference": "DEP-2024-001",
      "status": "pending",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 50
}
```

### Approve Deposit (Admin)
**POST** `/admin/deposits/:id/approve`
**Type**: Protected (Admin)

Response (200):
```json
{
  "id": "uuid",
  "status": "approved",
  "approved_at": "2024-01-15T11:00:00Z",
  "wallet_updated": true
}
```

### Reject Deposit (Admin)
**POST** `/admin/deposits/:id/reject`
**Type**: Protected (Admin)

Request:
```json
{
  "reason": "Duplicate request"
}
```

Response (200):
```json
{
  "id": "uuid",
  "status": "rejected",
  "rejection_reason": "Duplicate request",
  "rejected_at": "2024-01-15T11:00:00Z"
}
```

---

## 📦 Package Endpoints

### Get All Packages
**GET** `/packages`
**Type**: Public

Response (200):
```json
{
  "packages": [
    {
      "id": "uuid",
      "name": "Condom",
      "amount": 500.00,
      "duration_days": 15,
      "reward_rate": 2.0,
      "reward_frequency": "daily",
      "description": "Entry level investment package",
      "is_active": true
    }
  ]
}
```

### Purchase Package
**POST** `/packages/:id/purchase`
**Type**: Protected (Customer)

Request:
```json
{
  "package_id": "uuid"
}
```

Validation:
- Customer must have sufficient balance
- Account must not be restricted

Response (201):
```json
{
  "id": "uuid",
  "customer_id": "uuid",
  "package_id": "uuid",
  "amount": 500.00,
  "purchase_date": "2024-01-15T10:30:00Z",
  "expiry_date": "2024-01-30T10:30:00Z",
  "status": "active",
  "total_earned": 0
}
```

### Get Customer Packages
**GET** `/packages/my?status=`
**Type**: Protected (Customer)

Query Parameters:
- `status`: all, active, expired, cancelled

Response (200):
```json
{
  "packages": [
    {
      "id": "uuid",
      "package_id": "uuid",
      "amount": 500.00,
      "status": "active",
      "expiry_date": "2024-01-30T10:30:00Z",
      "total_earned": 15.00,
      "package_details": {
        "name": "Condom",
        "reward_rate": 2.0,
        "description": "Entry level investment package"
      }
    }
  ]
}
```

### Get All Packages (Admin)
**GET** `/admin/packages`
**Type**: Protected (Admin)

Response (200):
```json
{
  "packages": [
    {
      "id": "uuid",
      "name": "Condom",
      "amount": 500.00,
      "duration_days": 15,
      "reward_rate": 2.0,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Package (Admin)
**POST** `/admin/packages`
**Type**: Protected (Admin)

Request:
```json
{
  "name": "New Package",
  "amount": 2000,
  "duration_days": 15,
  "reward_rate": 2.5,
  "description": "New investment package"
}
```

Response (201):
```json
{
  "id": "uuid",
  "name": "New Package",
  "amount": 2000.00,
  "duration_days": 15,
  "reward_rate": 2.5,
  "is_active": true
}
```

### Update Package (Admin)
**PUT** `/admin/packages/:id`
**Type**: Protected (Admin)

Request:
```json
{
  "reward_rate": 3.0,
  "is_active": false
}
```

Response (200):
```json
{
  "id": "uuid",
  "reward_rate": 3.0,
  "is_active": false,
  "updated_at": "2024-01-15T11:00:00Z"
}
```

---

## 🎁 Rewards Endpoints

### Get Earnings
**GET** `/earnings`
**Type**: Protected (Customer)

Response (200):
```json
{
  "total_earnings": 150.00,
  "rewards": [
    {
      "id": "uuid",
      "amount": 10.00,
      "reward_date": "2024-01-15T00:00:00Z",
      "status": "credited",
      "package_name": "Condom"
    }
  ]
}
```

---

## 💸 Withdrawal Endpoints

### Submit Withdrawal
**POST** `/withdrawals`
**Type**: Protected (Customer)

Request:
```json
{
  "amount": 1000,
  "bank_name": "GTBank",
  "account_number": "1234567890",
  "account_name": "John Doe",
  "note": "Optional note"
}
```

Validation:
- Minimum: ₦600
- Must have sufficient available balance
- Account must not be restricted

Response (201):
```json
{
  "id": "uuid",
  "amount": 1000.00,
  "bank_name": "GTBank",
  "account_number": "1234567890",
  "account_name": "John Doe",
  "status": "pending",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Get Withdrawals (Customer)
**GET** `/withdrawals`
**Type**: Protected (Customer)

Response (200):
```json
{
  "withdrawals": [
    {
      "id": "uuid",
      "amount": 1000.00,
      "bank_name": "GTBank",
      "account_number": "1234567890",
      "status": "paid",
      "created_at": "2024-01-15T10:30:00Z",
      "paid_at": "2024-01-15T14:00:00Z"
    }
  ]
}
```

### Get All Withdrawals (Admin)
**GET** `/admin/withdrawals?status=&limit=50`
**Type**: Protected (Admin)

Response (200):
```json
{
  "withdrawals": [
    {
      "id": "uuid",
      "customer_id": "uuid",
      "customer": {
        "full_name": "John Doe",
        "phone_number": "08012345678"
      },
      "amount": 1000.00,
      "bank_name": "GTBank",
      "account_number": "1234567890",
      "account_name": "John Doe",
      "status": "pending",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Approve Withdrawal (Admin)
**POST** `/admin/withdrawals/:id/approve`
**Type**: Protected (Admin)

Request:
```json
{
  "note": "Approved for processing"
}
```

Response (200):
```json
{
  "id": "uuid",
  "status": "approved",
  "admin_note": "Approved for processing",
  "processed_at": "2024-01-15T11:00:00Z"
}
```

### Mark Withdrawal as Paid (Admin)
**POST** `/admin/withdrawals/:id/paid`
**Type**: Protected (Admin)

Response (200):
```json
{
  "id": "uuid",
  "status": "paid",
  "paid_at": "2024-01-15T14:00:00Z"
}
```

### Reject Withdrawal (Admin)
**POST** `/admin/withdrawals/:id/reject`
**Type**: Protected (Admin)

Request:
```json
{
  "reason": "Invalid account number"
}
```

Response (200):
```json
{
  "id": "uuid",
  "status": "rejected",
  "rejection_reason": "Invalid account number"
}
```

---

## 👥 Customer Management (Admin)

### Get All Customers
**GET** `/admin/customers?search=&limit=50`
**Type**: Protected (Admin)

Response (200):
```json
{
  "customers": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "phone_number": "08012345678",
      "account_status": "active",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Customer Details (Admin)
**GET** `/admin/customers/:id`
**Type**: Protected (Admin)

Response (200):
```json
{
  "profile": {
    "id": "uuid",
    "full_name": "John Doe",
    "phone_number": "08012345678",
    "account_status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "wallet": {
    "available_balance": 5000.00,
    "pending_balance": 1000.00,
    "total_deposited": 10000.00,
    "total_withdrawn": 5000.00,
    "total_earned": 2500.00
  }
}
```

### Restrict Customer (Admin)
**POST** `/admin/customers/:id/restrict`
**Type**: Protected (Admin)

Response (200):
```json
{
  "id": "uuid",
  "account_status": "restricted"
}
```

### Reactivate Customer (Admin)
**POST** `/admin/customers/:id/reactivate`
**Type**: Protected (Admin)

Response (200):
```json
{
  "id": "uuid",
  "account_status": "active"
}
```

---

## 📊 Transaction Management (Admin)

### Get All Transactions
**GET** `/admin/transactions?type=&status=&limit=50`
**Type**: Protected (Admin)

Query Parameters:
- `type`: deposit, withdrawal, package_purchase, reward, refund, admin_adjustment
- `status`: pending, completed, failed, reversed

Response (200):
```json
{
  "transactions": [
    {
      "id": "uuid",
      "customer_id": "uuid",
      "transaction_type": "deposit",
      "amount": 1000.00,
      "status": "completed",
      "reference": "DEP-2024-001",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## 📝 Audit Logs (Admin)

### Get Audit Logs
**GET** `/admin/audit-logs?limit=50&offset=0`
**Type**: Protected (Admin)

Response (200):
```json
{
  "logs": [
    {
      "id": "uuid",
      "admin_id": "uuid",
      "action": "deposit_approved",
      "target_customer_id": "uuid",
      "previous_value": { "status": "pending" },
      "new_value": { "status": "approved" },
      "created_at": "2024-01-15T11:00:00Z"
    }
  ]
}
```

---

## 🔔 Notifications

### Get Notifications
**GET** `/notifications?limit=50`
**Type**: Protected (Customer)

Response (200):
```json
{
  "notifications": [
    {
      "id": "uuid",
      "title": "Deposit Approved",
      "message": "Your deposit of ₦1000 has been approved",
      "notification_type": "deposit_approved",
      "is_read": false,
      "created_at": "2024-01-15T11:00:00Z"
    }
  ]
}
```

### Mark Notification as Read
**PUT** `/notifications/:id/read`
**Type**: Protected (Customer)

Response (200):
```json
{
  "id": "uuid",
  "is_read": true
}
```

---

## 🔄 Admin Dashboard

### Get Dashboard Stats
**GET** `/admin/dashboard/stats`
**Type**: Protected (Admin)

Response (200):
```json
{
  "total_customers": 150,
  "active_customers": 145,
  "total_deposits": 500000.00,
  "pending_deposits": 5,
  "total_withdrawals": 250000.00,
  "pending_withdrawals": 3,
  "total_packages_purchased": 450,
  "total_rewards_credited": 50000.00
}
```

---

## ⚠️ Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400
}
```

### Common Error Codes

- `UNAUTHORIZED` - 401: Not authenticated
- `FORBIDDEN` - 403: Not authorized
- `NOT_FOUND` - 404: Resource not found
- `VALIDATION_ERROR` - 400: Invalid input
- `INSUFFICIENT_BALANCE` - 400: Not enough balance
- `ACCOUNT_RESTRICTED` - 403: Account is restricted
- `DUPLICATE_REQUEST` - 409: Duplicate operation
- `SERVER_ERROR` - 500: Internal server error

---

## 🔐 Authentication

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

---

**API Version**: 1.0.0
**Last Updated**: September 10, 2026
