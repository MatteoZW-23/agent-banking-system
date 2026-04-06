# Provider Onboarding Guide

## Overview

This guide provides step-by-step instructions for integrating new payment providers into the Agent Banking System. Each provider requires specific configuration, credentials, and testing before production use.

## Pre-Integration Checklist

Before starting integration:

- [ ] Provider API documentation reviewed
- [ ] Sandbox/test environment access obtained
- [ ] API credentials generated
- [ ] Technical contact identified at provider
- [ ] Commission structure agreed upon
- [ ] Float account details confirmed
- [ ] Settlement account configured

## Provider Integration Steps

### Step 1: Create Provider Record

Add the provider to the database:

```sql
INSERT INTO providers (
  name,
  category,
  agent_service_name,
  api_endpoint,
  auth_type,
  auth_config,
  is_active
) VALUES (
  'Provider Name',
  'mobile_money|bank|fintech|aggregator',
  'Agent Service Name',
  'https://api.provider.com',
  'oauth2|apikey|basic|mtls|none',
  '{"key": "value"}',
  false
);
```

### Step 2: Implement Provider Adapter

Create a new provider adapter file: `server/providers/provider-name.ts`

```typescript
import { RestProviderAdapter, ProviderTransaction, FloatBalance } from "./providerAdapter";

export class ProviderNameAdapter extends RestProviderAdapter {
  async authenticate(): Promise<void> {
    // Implement authentication logic
  }

  async fetchTransactions(fromDate: Date, toDate: Date): Promise<ProviderTransaction[]> {
    // Implement transaction fetching
  }

  async getFloatBalance(): Promise<FloatBalance> {
    // Implement float balance retrieval
  }

  async healthCheck(): Promise<boolean> {
    // Implement health check
  }

  protected getDefaultHeaders(): Record<string, string> {
    // Return authentication headers
  }
}
```

### Step 3: Configure Authentication

Store provider credentials securely:

```sql
INSERT INTO agent_registrations (
  provider_id,
  agent_code,
  merchant_id,
  api_key_encrypted,
  api_secret_encrypted,
  float_account,
  commission_rate,
  is_primary
) VALUES (
  <provider_id>,
  'AGENT_CODE',
  'MERCHANT_ID',
  'encrypted_api_key',
  'encrypted_api_secret',
  'FLOAT_ACCOUNT',
  2.50,
  true
);
```

### Step 4: Set Commission Structure

Configure commission rates:

```sql
INSERT INTO commission_structures (
  provider_id,
  transaction_type,
  rate_percentage,
  min_amount,
  max_amount,
  fixed_fee,
  is_active
) VALUES
  (<provider_id>, 'cash_out', 2.50, 0, 10000, 0, true),
  (<provider_id>, 'cash_in', 1.50, 0, 10000, 0, true),
  (<provider_id>, 'send_money', 3.00, 0, 50000, 0, true);
```

### Step 5: Configure Float Thresholds

Set minimum and maximum float levels:

```sql
INSERT INTO provider_floats (
  provider_id,
  opening_balance,
  current_balance,
  minimum_threshold,
  maximum_threshold
) VALUES (
  <provider_id>,
  0.00,
  0.00,
  500.00,
  50000.00
);
```

### Step 6: Test Integration

#### 6.1 Authentication Test

```bash
curl -X POST https://api.provider.com/auth \
  -H "Content-Type: application/json" \
  -d '{"client_id": "...", "client_secret": "..."}'
```

#### 6.2 Transaction Fetch Test

```bash
curl -X GET "https://api.provider.com/transactions?from=2026-04-01&to=2026-04-06" \
  -H "Authorization: Bearer <token>"
```

#### 6.3 Float Balance Test

```bash
curl -X GET https://api.provider.com/balance \
  -H "Authorization: Bearer <token>"
```

#### 6.4 API Endpoint Test

```typescript
// In server/routers.ts
const adapter = new ProviderNameAdapter(config, credentials);
await adapter.authenticate();
const transactions = await adapter.fetchTransactions(new Date("2026-04-01"), new Date("2026-04-06"));
const balance = await adapter.getFloatBalance();
```

### Step 7: Verify Data Normalization

Ensure transactions are correctly normalized:

```typescript
// Verify transaction structure
const transaction = {
  id: "TXN001",
  reference: "REF001",
  amount: 1000.00,
  fee: 25.00,
  status: "completed",
  timestamp: new Date(),
  customerPhone: "+263771234567",
  type: "cash_out"
};
```

### Step 8: Enable in Production

Once testing is complete:

```sql
UPDATE providers SET is_active = true WHERE id = <provider_id>;
```

## Provider-Specific Guides

### EcoCash Integration

**Authentication Type**: OAuth2 (Client Credentials)

**Required Credentials**:
- Client ID
- Client Secret
- OAuth Token Endpoint

**Configuration**:
```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "tokenEndpoint": "https://api.ecocash.com.zw/oauth/token"
}
```

**Commission Rates**:
- Cash Out: 2.50%
- Cash In: 1.50%
- Send Money: 3.00%

### OneMoney Integration

**Authentication Type**: SOAP (Basic Auth)

**Required Credentials**:
- Username
- Password
- WSDL Endpoint

**Configuration**:
```json
{
  "username": "your-username",
  "password": "your-password",
  "wsdlEndpoint": "https://api.onemoney.co.zw/soap?wsdl"
}
```

### InnBucks Integration

**Authentication Type**: REST API Key

**Required Credentials**:
- API Key
- API Endpoint

**Configuration**:
```json
{
  "apiKey": "your-api-key",
  "apiEndpoint": "https://api.innbucks.com"
}
```

### ZB Bank Integration

**Authentication Type**: mTLS (Certificate-based)

**Required Credentials**:
- Client Certificate (.pem)
- Client Key (.pem)
- CA Certificate (.pem)

**Configuration**:
```json
{
  "certPath": "/path/to/client.pem",
  "keyPath": "/path/to/client-key.pem",
  "caPath": "/path/to/ca.pem"
}
```

## Testing Checklist

For each provider integration:

- [ ] Authentication successful
- [ ] Can fetch transactions
- [ ] Can retrieve float balance
- [ ] Health check passes
- [ ] Transactions normalized correctly
- [ ] Commission calculations accurate
- [ ] Reconciliation works
- [ ] Alerts trigger appropriately
- [ ] No data loss in transaction sync
- [ ] Error handling works correctly

## Troubleshooting

### Authentication Failures

**Issue**: "Invalid credentials" error

**Solution**:
1. Verify credentials are correct
2. Check if credentials have expired
3. Verify IP whitelisting if required
4. Check certificate validity for mTLS

### Transaction Fetch Failures

**Issue**: No transactions returned

**Solution**:
1. Verify date range is correct
2. Check if transactions exist in provider system
3. Verify API permissions
4. Check network connectivity

### Float Balance Issues

**Issue**: Float balance not updating

**Solution**:
1. Verify float account configuration
2. Check if account has transactions
3. Verify API endpoint for balance
4. Check for API rate limiting

### Commission Calculation Issues

**Issue**: Commissions not calculated correctly

**Solution**:
1. Verify commission rates in database
2. Check transaction type classification
3. Verify fee calculations
4. Check for rounding errors

## Performance Optimization

### Transaction Sync Optimization

- Implement incremental sync (only fetch new transactions)
- Use date-based filtering
- Batch transaction processing
- Implement caching for frequently accessed data

### API Rate Limiting

- Respect provider API rate limits
- Implement exponential backoff for retries
- Queue requests during high-load periods
- Monitor API usage

### Database Optimization

- Add indexes on frequently queried fields
- Archive old transactions
- Optimize reconciliation queries
- Use connection pooling

## Monitoring & Alerts

### Provider Health Monitoring

- Daily connectivity checks
- Transaction sync status
- Float balance validation
- API response time monitoring

### Alert Configuration

```sql
INSERT INTO alert_configurations (
  alert_type,
  threshold_value,
  is_active
) VALUES
  ('provider_down', '1', true),
  ('sync_delay', '3600', true),
  ('low_float', '500', true);
```

## Compliance & Security

### Data Security

- Encrypt API credentials at rest
- Use HTTPS for all API calls
- Implement certificate pinning for mTLS
- Rotate credentials regularly

### Compliance Requirements

- Maintain transaction audit trail
- Comply with provider data retention policies
- Implement KYC/AML checks
- Document all integrations

### Regulatory Considerations

- Verify provider regulatory status
- Ensure compliance with local regulations
- Document compliance measures
- Regular compliance audits

## Support & Escalation

### Provider Support Contacts

Maintain contact information for each provider:

- Technical Support Email
- Support Phone Number
- Escalation Contact
- Account Manager

### Issue Escalation Process

1. **Level 1**: Check logs and documentation
2. **Level 2**: Contact provider technical support
3. **Level 3**: Escalate to provider account manager
4. **Level 4**: Executive escalation if needed

## Documentation Requirements

For each provider integration, maintain:

- [ ] API documentation
- [ ] Authentication setup guide
- [ ] Commission structure document
- [ ] Float account configuration
- [ ] Troubleshooting guide
- [ ] Contact information
- [ ] Compliance documentation
- [ ] Performance metrics

## Rollback Procedures

If integration fails:

1. Disable provider: `UPDATE providers SET is_active = false WHERE id = <provider_id>`
2. Stop transaction sync for provider
3. Notify stakeholders
4. Investigate root cause
5. Fix issues
6. Re-enable provider

## Success Criteria

Provider integration is successful when:

- [ ] All tests pass
- [ ] Transactions sync correctly
- [ ] Reconciliation works
- [ ] Commissions calculate accurately
- [ ] Alerts trigger appropriately
- [ ] No data loss
- [ ] Performance meets SLA
- [ ] Documentation complete

---

**Last Updated**: April 2026  
**Version**: 1.0.0
