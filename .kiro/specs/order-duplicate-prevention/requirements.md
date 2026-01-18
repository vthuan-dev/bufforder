# Requirements Document: Order Duplicate Prevention

## Introduction

Improve order creation system to prevent duplicate orders from being created when users click rapidly or experience network issues. The current system has idempotency key generation but the keys are not being stored in the database, and duplicate detection may have race conditions.

## Glossary

- **Order_System**: The backend order creation endpoint (`POST /api/orders/take`)
- **Idempotency_Key**: A unique identifier generated per order attempt to prevent duplicates
- **Duplicate_Order**: Multiple orders with the same user and product within a short time window
- **Race_Condition**: When multiple concurrent requests bypass duplicate checks

## Requirements

### Requirement 1: Store Idempotency Keys

**User Story:** As a system, I want to store idempotency keys in the database, so that duplicate requests can be reliably detected.

#### Acceptance Criteria

1. WHEN an order is created with an idempotency key, THE Order_System SHALL store the key in the `clientRequestId` field
2. WHEN an order is created without an idempotency key, THE Order_System SHALL store NULL in the `clientRequestId` field
3. WHEN querying orders, THE Order_System SHALL return the `clientRequestId` value for debugging

### Requirement 2: Idempotency Key Duplicate Detection

**User Story:** As a user, I want my order to be created only once even if I click multiple times, so that I don't accidentally create duplicate orders.

#### Acceptance Criteria

1. WHEN a request arrives with an idempotency key that already exists for the same user, THE Order_System SHALL return the existing order without creating a new one
2. WHEN a request arrives with a new idempotency key, THE Order_System SHALL proceed with order creation
3. WHEN returning an existing order, THE Order_System SHALL include all order details in the response

### Requirement 3: Time-Based Duplicate Detection

**User Story:** As a user, I want the system to prevent me from ordering the same product multiple times within a short period, so that accidental duplicates are prevented even without idempotency keys.

#### Acceptance Criteria

1. WHEN a user attempts to order the same product within 5 minutes of a previous order, THE Order_System SHALL return the existing order without creating a new one
2. WHEN a user attempts to order a different product, THE Order_System SHALL allow the order creation
3. WHEN more than 5 minutes have passed since the last order of the same product, THE Order_System SHALL allow a new order

### Requirement 4: Race Condition Prevention

**User Story:** As a system, I want to check for duplicates before starting the database transaction, so that concurrent requests don't bypass duplicate detection.

#### Acceptance Criteria

1. WHEN multiple concurrent requests arrive, THE Order_System SHALL check for existing orders BEFORE starting the transaction
2. WHEN a duplicate is detected during the check, THE Order_System SHALL return the existing order immediately
3. WHEN no duplicate is found, THE Order_System SHALL proceed with the transaction to create the order

### Requirement 5: Database Constraint

**User Story:** As a system, I want a database-level unique constraint on idempotency keys, so that duplicates are prevented even if application logic fails.

#### Acceptance Criteria

1. THE database SHALL enforce a unique constraint on `(userId, clientRequestId)` pairs
2. WHEN attempting to insert a duplicate `(userId, clientRequestId)`, THE database SHALL reject the insert
3. WHEN a database constraint violation occurs, THE Order_System SHALL handle it gracefully and return the existing order

### Requirement 6: Logging and Debugging

**User Story:** As a developer, I want detailed logging of duplicate detection, so that I can debug issues and verify the system is working correctly.

#### Acceptance Criteria

1. WHEN a duplicate is detected via idempotency key, THE Order_System SHALL log the detection with the key value
2. WHEN a duplicate is detected via time-window check, THE Order_System SHALL log the detection with product ID and time difference
3. WHEN an order is successfully created, THE Order_System SHALL log the order ID and idempotency key
4. WHEN a database constraint violation occurs, THE Order_System SHALL log the error details

## Non-Functional Requirements

### Performance
- Duplicate checks should complete within 100ms
- Database queries should use indexes for fast lookups

### Reliability
- System should handle concurrent requests correctly
- Database constraints should provide final safety net

### Maintainability
- Logging should be clear and actionable
- Code should be well-documented

## Out of Scope

- Changing the idempotency key generation logic (already working in frontend)
- Modifying the order creation flow beyond duplicate prevention
- Adding new order statuses or workflows
