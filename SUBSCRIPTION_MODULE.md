# Subscription Module Documentation

## Overview
The subscription module allows:
- **Super Admin**: Create, update, and delete subscription plans
- **Schools**: View available plans and subscribe to one plan
- **Both**: View subscriptions (admin sees all, schools see their own)

## Database Structure

### SubscriptionPlan Entity
Stores subscription plans created by admin:
- `name`: Plan name
- `description`: Plan description
- `price`: Plan price
- `duration`: Plan duration in days
- `maxStudents`: Maximum number of students allowed
- `maxDeliveryPersons`: Maximum number of delivery persons allowed
- `features`: Array of plan features
- `isActive`: Whether plan is active

### SchoolSubscription Entity
Stores school subscriptions:
- `schoolId`: Foreign key to School
- `planId`: Foreign key to SubscriptionPlan
- `startDate`: Subscription start date
- `endDate`: Subscription end date
- `status`: active | expired | cancelled | pending
- `paidAmount`: Amount paid
- `paymentMethod`: Payment method used
- `paymentReference`: Payment reference number
- `autoRenew`: Whether to auto-renew

---

## API Endpoints

### 1. Create Subscription Plan (Super Admin Only)
**POST** `/subscription/plans`

**Headers:**
```
Authorization: Bearer {super_admin_token}
```

**Body:**
```json
{
  "name": "الخطة الأساسية",
  "description": "خطة مناسبة للمدارس الصغيرة",
  "price": 99.99,
  "duration": 30,
  "maxStudents": 100,
  "maxDeliveryPersons": 10,
  "features": [
    "إشعارات غير محدودة",
    "تقارير متقدمة",
    "دعم فني 24/7"
  ],
  "isActive": true
}
```

**Response:**
```json
{
  "id": 1,
  "name": "الخطة الأساسية",
  "description": "خطة مناسبة للمدارس الصغيرة",
  "price": 99.99,
  "duration": 30,
  "maxStudents": 100,
  "maxDeliveryPersons": 10,
  "features": ["إشعارات غير محدودة", "تقارير متقدمة", "دعم فني 24/7"],
  "isActive": true,
  "createdAt": "2025-11-28T10:00:00.000Z",
  "updatedAt": "2025-11-28T10:00:00.000Z"
}
```

---

### 2. Get All Plans (Public)
**GET** `/subscription/plans`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `isActive` (optional): Filter by active status (true/false)
- `sortBy` (optional): Sort field
- `sortOrder` (optional): ASC | DESC

**Example:**
```
GET /subscription/plans?isActive=true&page=1&limit=10
```

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "الخطة الأساسية",
      "price": 99.99,
      "duration": 30,
      "maxStudents": 100,
      "features": ["إشعارات غير محدودة"]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1
  },
  "links": {
    "first": "/subscription/plans?page=1&limit=10",
    "last": "/subscription/plans?page=1&limit=10"
  }
}
```

---

### 3. Get Plan Details
**GET** `/subscription/plans/:id`

**Response:**
```json
{
  "id": 1,
  "name": "الخطة الأساسية",
  "description": "خطة مناسبة للمدارس الصغيرة",
  "price": 99.99,
  "duration": 30,
  "maxStudents": 100,
  "maxDeliveryPersons": 10,
  "features": ["إشعارات غير محدودة", "تقارير متقدمة"],
  "isActive": true
}
```

---

### 4. Update Plan (Super Admin Only)
**PATCH** `/subscription/plans/:id`

**Headers:**
```
Authorization: Bearer {super_admin_token}
```

**Body:**
```json
{
  "price": 89.99,
  "isActive": false
}
```

---

### 5. Delete Plan (Super Admin Only)
**DELETE** `/subscription/plans/:id`

**Headers:**
```
Authorization: Bearer {super_admin_token}
```

**Note:** Cannot delete plans with active subscriptions.

---

### 6. Subscribe to Plan (School Only)
**POST** `/subscription/subscribe`

**Headers:**
```
Authorization: Bearer {school_token}
```

**Body:**
```json
{
  "planId": 1,
  "paymentMethod": "credit_card",
  "paymentReference": "PAY-123456789",
  "autoRenew": false
}
```

**Response:**
```json
{
  "id": 1,
  "schoolId": 1,
  "schoolName": "مدرسة النور",
  "schoolLogo": "https://example.com/logo.png",
  "plan": {
    "id": 1,
    "name": "الخطة الأساسية",
    "description": "خطة مناسبة للمدارس الصغيرة",
    "price": 99.99,
    "duration": 30,
    "maxStudents": 100,
    "maxDeliveryPersons": 10,
    "features": ["إشعارات غير محدودة"]
  },
  "startDate": "2025-11-28T10:00:00.000Z",
  "endDate": "2025-12-28T10:00:00.000Z",
  "status": "active",
  "paidAmount": 99.99,
  "paymentMethod": "credit_card",
  "paymentReference": "PAY-123456789",
  "autoRenew": false,
  "createdAt": "2025-11-28T10:00:00.000Z"
}
```

**Business Rules:**
- School can only have one active subscription at a time
- Must cancel current subscription before subscribing to a new one
- Subscription automatically calculates `endDate` based on plan duration

---

### 7. Get My Subscription (School Only)
**GET** `/subscription/my-subscription`

**Headers:**
```
Authorization: Bearer {school_token}
```

**Response:**
```json
{
  "hasSubscription": true,
  "subscription": {
    "id": 1,
    "plan": {
      "id": 1,
      "name": "الخطة الأساسية",
      "price": 99.99,
      "duration": 30,
      "features": ["إشعارات غير محدودة"]
    },
    "startDate": "2025-11-28T10:00:00.000Z",
    "endDate": "2025-12-28T10:00:00.000Z",
    "status": "active",
    "paidAmount": 99.99,
    "autoRenew": false
  }
}
```

If no active subscription:
```json
{
  "hasSubscription": false,
  "subscription": null
}
```

---

### 8. Get All Subscriptions
**GET** `/subscription/subscriptions`

**Headers:**
```
Authorization: Bearer {token}
```

**Access:**
- **Super Admin**: Can see all subscriptions
- **School**: Can only see their own subscriptions

**Query Parameters:**
- `page`, `limit`, `sortBy`, `sortOrder`: Pagination
- `status`: Filter by status (active, expired, cancelled, pending)
- `schoolId`: Filter by school (admin only)
- `planId`: Filter by plan

**Example:**
```
GET /subscription/subscriptions?status=active&page=1&limit=10
```

---

### 9. Get Subscription Details
**GET** `/subscription/subscriptions/:id`

**Headers:**
```
Authorization: Bearer {token}
```

---

### 10. Cancel Subscription
**PATCH** `/subscription/subscriptions/:id/cancel`

**Headers:**
```
Authorization: Bearer {token}
```

**Access:**
- **Super Admin**: Can cancel any subscription
- **School**: Can only cancel their own subscription

**Response:**
```json
{
  "id": 1,
  "status": "cancelled",
  ...
}
```

---

## Usage Flow

### For Super Admin:
1. Create subscription plans with different features and pricing
2. Update plans as needed (prices, features, active status)
3. View all subscriptions across all schools
4. Cancel subscriptions if needed
5. Cannot delete plans with active subscriptions

### For Schools:
1. View available plans (`GET /subscription/plans?isActive=true`)
2. Choose a plan and subscribe (`POST /subscription/subscribe`)
3. View current subscription status (`GET /subscription/my-subscription`)
4. View subscription history (`GET /subscription/subscriptions`)
5. Cancel subscription if needed (`PATCH /subscription/subscriptions/:id/cancel`)
6. Subscribe to a new plan after cancellation

---

## Enums

### SubscriptionStatus
```typescript
enum SubscriptionStatus {
  ACTIVE = 'active',      // Currently active
  EXPIRED = 'expired',    // Ended naturally
  CANCELLED = 'cancelled', // Cancelled by user/admin
  PENDING = 'pending'     // Payment pending
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "School already has an active subscription. Please cancel it first.",
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Plan with ID 1 not found",
  "error": "Not Found"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Only schools can subscribe to plans",
  "error": "Forbidden"
}
```

---

## Database Migration

After implementing this module, run migrations to create the tables:

```bash
npm run migration:generate -- src/migrations/CreateSubscriptionTables
npm run migration:run
```

The module will create two tables:
- `subscription_plans`
- `school_subscriptions`

---

## Future Enhancements

1. **Auto-renewal**: Implement cron job to check for expiring subscriptions and auto-renew if `autoRenew=true`
2. **Payment Integration**: Integrate with payment gateway (Stripe, PayPal, etc.)
3. **Trial Period**: Add trial period support
4. **Discount Codes**: Add promotional codes support
5. **Usage Analytics**: Track plan usage (student count, delivery person count)
6. **Notifications**: Send notifications before subscription expires
7. **Invoice Generation**: Generate invoices for payments
