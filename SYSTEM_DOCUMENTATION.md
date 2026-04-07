# Agent Banking System - Comprehensive Documentation

## Overview

The Agent Banking Tracking System is a comprehensive multi-provider financial reconciliation and monitoring platform designed for Zimbabwe's agent banking ecosystem. It provides unified transaction management, real-time float tracking, automated reconciliation, employee commission calculations, and LLM-based fraud detection across 15+ payment providers.

## System Architecture

### Core Components

**Database Layer**: MySQL-based schema with 12 tables supporting providers, transactions, floats, commissions, alerts, and employee tracking.

**Provider Integration Framework**: Adapter-based architecture supporting REST, SOAP, and Open Banking APIs with automatic retry logic and error handling.

**Reconciliation Engine**: Automated transaction matching and discrepancy detection comparing internal ledger against external provider data.

**Alert System**: Real-time threshold monitoring with SMS notifications for critical events (large discrepancies, low float, failed reconciliations).

**LLM Analysis**: Machine learning-based transaction pattern analysis for suspicious activity detection and fraud flagging.

**CSV Import Service**: Bulk transaction import for offline providers (Metbank, POSB, Agribank, MyCash).

### Technology Stack

- **Backend**: Express.js with tRPC for type-safe API procedures
- **Database**: MySQL with Drizzle ORM for schema management
- **Frontend**: React 19 with Tailwind CSS 4 for responsive UI
- **Authentication**: Manus OAuth 2.0 for secure user management
- **LLM Integration**: Built-in LLM service for transaction analysis

## Database Schema

### Tables

1. **users** - User accounts with role-based access control (admin/user)
2. **employees** - Agent employee records with unique tracking codes
3. **providers** - Payment provider registry (mobile money, banks, fintechs, aggregators)
4. **agent_registrations** - Provider-specific credentials and configurations
5. **transactions** - Unified transaction model across all providers
6. **provider_floats** - Real-time float balance tracking per provider
7. **commission_structures** - Commission rules and rates per provider/transaction type
8. **daily_settlements** - Daily reconciliation records with discrepancy tracking
9. **transaction_flags** - LLM-flagged suspicious transactions with risk scores
10. **alert_configurations** - Configurable alert thresholds and rules
11. **alert_history** - Audit trail of triggered alerts and acknowledgments
12. **commission_history** - Historical commission calculations per employee

### Key Relationships

- Transactions link to providers, employees, and agent registrations
- Floats track balances per provider and agent
- Commissions aggregate from transactions by employee and type
- Alerts trigger based on thresholds and transaction patterns

## Provider Integration

### Supported Providers

**Mobile Money Operators**: EcoCash, OneMoney, InnBucks

**Banks**: ZB Bank, CBZ, NMB, Nedbank, Stanbic, Steward Bank

**Aggregators**: Paynow, PawaPay, Tola Mobile

**Offline Providers**: Metbank, POSB, Agribank, MyCash (via CSV import)

### Provider Adapter Framework

Each provider implements the `ProviderAdapter` interface with three core methods:

- `authenticate()` - Establish secure connection using provider's auth method
- `fetchTransactions(fromDate, toDate)` - Retrieve transactions for date range
- `getFloatBalance()` - Get current float balance
- `healthCheck()` - Verify provider connectivity

### Authentication Methods

- **OAuth2**: EcoCash (client credentials flow)
- **API Key**: InnBucks, Paynow (Bearer token)
- **SOAP**: OneMoney (XML-based protocol)
- **mTLS**: Nedbank, Stanbic (certificate-based)
- **Basic Auth**: Legacy providers

## API Endpoints

### Providers

- `providers.list` - Get all active providers
- `providers.getById` - Get provider details
- `providers.health` - Check provider connectivity status

### Transactions

- `transactions.listByProvider` - Get transactions for specific provider
- `transactions.listByDateRange` - Get transactions for date range
- `transactions.flaggedTransactions` - Get LLM-flagged suspicious transactions
- `transactions.analyzeTransaction` - Run LLM analysis on single transaction

### Reconciliation

- `reconciliation.reconcileProvider` - Reconcile single provider
- `reconciliation.reconcileAll` - Reconcile all providers for date

### Floats

- `floats.getByProvider` - Get float balance for provider
- `floats.getTotalBalance` - Get aggregate float across all providers

### Commissions

- `commissions.calculateEmployee` - Calculate commission for employee in period
- `commissions.getReport` - Get commission report for all employees

### Alerts

- `alerts.getHistory` - Get alert history
- `alerts.acknowledge` - Mark alert as acknowledged
- `alerts.checkThresholds` - Manually trigger threshold checks

### Reports

- `reports.dailySummary` - Daily transaction summary
- `reports.agentPnL` - Agent profit/loss report
- `reports.providerBreakdown` - Provider performance breakdown

### CSV Import

- `csvImport.importTransactions` - Import CSV file
- `csvImport.validateCSV` - Validate CSV format
- `csvImport.getTemplate` - Download CSV template

## Dashboard Pages

### Home Dashboard

Overview of system health, key metrics, and quick access to main features.

### Transactions

View and filter all transactions across providers with status indicators and flagged transaction highlighting.

### Reconciliation

Manage reconciliation process with per-provider and batch reconciliation options. View discrepancy details and mismatches.

### Floats

Monitor float balances across all providers with health indicators. Receive alerts for low float conditions.

### Alerts

Manage system alerts with severity levels. Acknowledge alerts and track resolution status.

### Commissions

Track employee commissions with breakdown by transaction type and provider. Identify top performers.

### CSV Import

Import transactions from offline providers with validation and error reporting.

## Reconciliation Process

### Daily Reconciliation Workflow

1. **Fetch Internal Transactions** - Query database for completed transactions
2. **Fetch External Data** - Call provider APIs for provider-side transactions
3. **Transaction Matching** - Compare amounts and references
4. **Discrepancy Detection** - Identify mismatches and missing transactions
5. **Alert Triggering** - Generate alerts for significant discrepancies
6. **Settlement Recording** - Update daily settlement records

### Discrepancy Thresholds

- **Critical**: Discrepancy > $100 or > 10%
- **High**: Discrepancy > $50 or > 5%
- **Medium**: Discrepancy > $10 or > 2%
- **Low**: Discrepancy < $10 and < 2%

## LLM-Based Transaction Analysis

### Suspicious Pattern Detection

The system uses LLM analysis to detect suspicious transactions based on:

- **Amount Anomalies**: Transactions significantly above/below normal range
- **Frequency Patterns**: Unusual transaction timing or volume
- **Customer Patterns**: New customers or unusual customer behavior
- **Cross-Provider Patterns**: Coordinated transactions across multiple providers
- **Temporal Patterns**: Transactions at unusual times

### Risk Scoring

Transactions receive risk scores (0.0 - 1.0):

- **0.0 - 0.3**: Low risk (normal activity)
- **0.3 - 0.7**: Medium risk (monitor)
- **0.7 - 1.0**: High risk (investigate)

### Flagging Workflow

1. Transaction is analyzed by LLM
2. Risk score is calculated
3. High-risk transactions are flagged
4. Alerts are generated for critical risks
5. Compliance team reviews flagged transactions

## Commission Calculation

### Commission Structure

Commissions are calculated per employee based on:

- **Transaction Type**: Different rates for cash_out, cash_in, send_money, etc.
- **Provider**: Provider-specific commission rules
- **Amount Range**: Tiered rates based on transaction amount
- **Employee Level**: Different rates for different employee tiers

### Calculation Formula

```
Commission = Transaction Amount × Commission Rate - Fees
```

### Commission Report

The commission report includes:

- Total commission per employee
- Breakdown by transaction type
- Breakdown by provider
- Top performers ranking
- Trend analysis

## Alert System

### Alert Types

1. **Discrepancy Alert** - Large transaction discrepancy detected
2. **Low Float Alert** - Provider float below minimum threshold
3. **Suspicious Transaction Alert** - High-risk transaction flagged by LLM
4. **Failed Reconciliation Alert** - Reconciliation status is "investigating"
5. **System Health Alert** - Provider connectivity issues

### Alert Severity Levels

- **Critical**: Immediate action required
- **High**: Action required within 1 hour
- **Medium**: Action required within 24 hours
- **Low**: Monitor and review

### SMS Notifications

Critical alerts trigger SMS notifications to configured managers:

- Discrepancies over $10
- Float below minimum threshold
- High-risk transactions detected
- Failed reconciliations

## CSV Import Format

### Required Columns

- **Date**: Transaction date (YYYY-MM-DD)
- **Reference**: Unique transaction reference
- **Type**: Transaction type (cash_out, cash_in, send_money, receive_money, bill_payment, airtime, data_bundle, ticket_purchase, bank_transfer, salary_disbursement, float_purchase, float_redemption)
- **Amount**: Transaction amount (numeric)
- **Status**: Transaction status (completed, pending, failed, reversed, disputed)

### Optional Columns

- **Fee**: Transaction fee
- **Description**: Additional notes
- **EmployeeCode**: Employee identifier

### Import Validation

- Duplicate detection (prevents re-importing same transaction)
- Format validation (date format, amount numeric)
- Required field validation
- Error reporting with row numbers

## Security Considerations

### Authentication

- Manus OAuth 2.0 for user authentication
- JWT tokens for session management
- Role-based access control (admin/user)

### Data Protection

- Encrypted storage of provider credentials
- Masked customer PII in transaction records
- Audit trail for all reconciliation activities
- Alert acknowledgment tracking

### API Security

- Protected procedures require authentication
- Input validation on all endpoints
- Rate limiting on sensitive operations
- Error handling without exposing sensitive details

## Deployment

### Environment Variables

Required environment variables:

- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Session signing secret
- `VITE_APP_ID` - Manus OAuth application ID
- `OAUTH_SERVER_URL` - Manus OAuth server URL
- `BUILT_IN_FORGE_API_URL` - Manus API endpoint
- `BUILT_IN_FORGE_API_KEY` - Manus API key

### Provider Configuration

Each provider requires:

- API endpoint URL
- Authentication credentials (API key, client ID/secret, certificates)
- Agent registration details
- Commission structure
- Float thresholds

### Database Setup

1. Create MySQL database
2. Run migrations: `pnpm drizzle-kit migrate`
3. Seed initial provider data
4. Configure alert thresholds

## Monitoring & Maintenance

### Health Checks

- Daily provider connectivity checks
- Transaction sync status monitoring
- Float balance validation
- Reconciliation completion tracking

### Performance Optimization

- Transaction indexing by provider, date, status
- Float balance caching
- Batch reconciliation processing
- Query optimization for large datasets

### Backup & Recovery

- Daily database backups
- Transaction history retention (7 years minimum)
- Reconciliation record archival
- Disaster recovery procedures

## Troubleshooting

### Common Issues

**Provider Connection Failed**

- Verify API credentials
- Check network connectivity
- Review provider API status
- Check certificate validity for mTLS

**Reconciliation Discrepancies**

- Verify transaction timestamps match
- Check for duplicate transactions
- Review fee calculations
- Investigate provider-side processing delays

**Low Float Alerts**

- Verify float balance data
- Check recent transactions
- Review deposit/withdrawal timing
- Contact provider for manual balance verification

**LLM Analysis Failures**

- Check LLM service connectivity
- Verify transaction data format
- Review error logs
- Retry analysis for specific transactions

## Future Enhancements

1. **Real-time Float Monitoring** - WebSocket updates for float changes
2. **Advanced Analytics** - Predictive analytics for transaction volumes
3. **Multi-currency Support** - Handle transactions in multiple currencies
4. **Automated Reconciliation** - Auto-reconcile matched transactions
5. **Mobile App** - Native mobile application for field agents
6. **API Webhooks** - Real-time event notifications
7. **Custom Reports** - User-defined report generation
8. **Integration Marketplace** - Third-party provider integrations

## Support & Contact

For system issues, provider integration questions, or feature requests, contact the development team through the system's built-in notification system or support portal.

---

**Last Updated**: April 2026  
**Version**: 1.0.0  
**Status**: Production Ready
