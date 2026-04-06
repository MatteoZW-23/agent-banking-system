# Agent Banking System - Deployment Guide

## Pre-Deployment Checklist

### System Requirements

- Node.js 22.x or higher
- MySQL 8.0 or higher (or compatible)
- 2GB RAM minimum
- 10GB disk space minimum
- Internet connectivity for provider APIs

### Required Credentials

Gather the following before deployment:

1. **Manus OAuth Credentials**
   - Application ID
   - OAuth server URL
   - JWT secret

2. **Provider API Credentials**
   - EcoCash: Client ID, Client Secret
   - OneMoney: Username, Password
   - InnBucks: API Key
   - ZB Bank: API Key, Certificates
   - CBZ: API Key, Merchant ID
   - NMB: API Key, Credentials
   - Other providers: Respective credentials

3. **SMS Service Credentials** (for alerts)
   - Africa's Talking API key or similar
   - Sender ID

4. **Database Credentials**
   - MySQL host, port, username, password
   - Database name

## Installation Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd agent-banking-system
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Create `.env.local` file with required variables:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/agent_banking

# Manus OAuth
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
JWT_SECRET=your-jwt-secret-key

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key

# Owner Information
OWNER_OPEN_ID=your-open-id
OWNER_NAME=Your Name

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

### 4. Database Setup

```bash
# Generate migrations
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate

# Seed initial data (if available)
node scripts/seed-providers.mjs
```

### 5. Provider Configuration

Configure each provider in the database:

```sql
INSERT INTO providers (name, category, agent_service_name, api_endpoint, auth_type, is_active)
VALUES 
  ('EcoCash', 'mobile_money', 'EcoCash Agent', 'https://api.ecocash.com.zw', 'oauth2', true),
  ('OneMoney', 'mobile_money', 'OneMoney Agent', 'https://api.onemoney.co.zw/soap', 'basic', true),
  ('InnBucks', 'mobile_money', 'InnBucks Agent', 'https://api.innbucks.com', 'apikey', true),
  ('ZB Bank', 'bank', 'ZB Agent', 'https://api.zb.co.zw', 'mtls', true),
  ('CBZ', 'bank', 'CBZ Agent', 'https://api.cbz.co.zw', 'apikey', true),
  ('NMB', 'bank', 'NMB Agent', 'https://api.nmb.co.zw', 'apikey', true);
```

### 6. Alert Configuration

Configure alert thresholds:

```sql
INSERT INTO alert_configurations (alert_type, threshold_value, is_active, created_at)
VALUES 
  ('discrepancy', '10', true, NOW()),
  ('low_float', '500', true, NOW()),
  ('suspicious_transaction', '0.7', true, NOW()),
  ('failed_reconciliation', '1', true, NOW());
```

### 7. Build Application

```bash
# Development build
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start
```

## Configuration Details

### Provider Credentials Storage

Provider credentials are stored encrypted in `agent_registrations` table:

```sql
INSERT INTO agent_registrations (provider_id, agent_code, merchant_id, api_key_encrypted, api_secret_encrypted, float_account, commission_rate, is_primary)
VALUES 
  (1, 'AGENT001', 'MERCH001', 'encrypted_key', 'encrypted_secret', 'FLOAT001', 2.50, true);
```

### Commission Structure

Define commission rates per provider and transaction type:

```sql
INSERT INTO commission_structures (provider_id, transaction_type, rate_percentage, min_amount, max_amount, fixed_fee, is_active)
VALUES 
  (1, 'cash_out', 2.50, 0, 10000, 0, true),
  (1, 'cash_in', 1.50, 0, 10000, 0, true),
  (1, 'send_money', 3.00, 0, 50000, 0, true);
```

### Float Thresholds

Set minimum and maximum float thresholds per provider:

```sql
UPDATE provider_floats 
SET minimum_threshold = 500, maximum_threshold = 50000 
WHERE provider_id = 1;
```

## Running the Application

### Development Mode

```bash
pnpm dev
```

Access the application at `http://localhost:3000`

### Production Mode

```bash
pnpm build
pnpm start
```

## Monitoring & Logs

### Log Files

- **Dev Server**: `stdout` during `pnpm dev`
- **Production**: Configure logging to file system or service
- **Database**: MySQL slow query log

### Health Checks

Monitor provider health:

```bash
curl http://localhost:3000/api/trpc/providers.health?input={"id":1}
```

### Performance Monitoring

- Transaction processing time
- Reconciliation completion time
- API response times
- Database query performance

## Backup & Recovery

### Database Backup

```bash
# Daily backup
mysqldump -u user -p database_name > backup_$(date +%Y%m%d).sql

# Automated backup (cron job)
0 2 * * * mysqldump -u user -p database_name > /backups/backup_$(date +\%Y\%m\%d).sql
```

### Restore from Backup

```bash
mysql -u user -p database_name < backup_20260406.sql
```

### Transaction History Retention

Keep transaction records for minimum 7 years:

```sql
-- Archive old transactions (example: older than 2 years)
INSERT INTO transactions_archive 
SELECT * FROM transactions 
WHERE transaction_time < DATE_SUB(NOW(), INTERVAL 2 YEAR);

DELETE FROM transactions 
WHERE transaction_time < DATE_SUB(NOW(), INTERVAL 2 YEAR);
```

## Security Hardening

### Database Security

```sql
-- Create application user with limited privileges
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE ON agent_banking.* TO 'app_user'@'localhost';

-- Disable remote root access
DELETE FROM mysql.user WHERE User='root' AND Host!='localhost';
FLUSH PRIVILEGES;
```

### API Security

1. Enable HTTPS/TLS
2. Implement rate limiting
3. Set CORS policies
4. Use API key rotation
5. Enable audit logging

### Credential Management

1. Use environment variables for secrets
2. Rotate API keys quarterly
3. Use encrypted storage for credentials
4. Implement access controls
5. Audit credential access

## Troubleshooting Deployment

### Database Connection Issues

```bash
# Test connection
mysql -h localhost -u user -p -e "SELECT 1"

# Check connection string
echo $DATABASE_URL
```

### Provider API Failures

1. Verify API credentials
2. Check network connectivity
3. Review provider API status
4. Check firewall rules
5. Verify SSL certificates

### Performance Issues

1. Check database indexes
2. Monitor query performance
3. Review transaction volume
4. Optimize slow queries
5. Consider database replication

### Memory Issues

1. Monitor Node.js memory usage
2. Increase heap size if needed: `NODE_OPTIONS=--max-old-space-size=4096`
3. Implement connection pooling
4. Review cache configuration

## Scaling Considerations

### Horizontal Scaling

1. Load balance across multiple instances
2. Use shared database
3. Implement session persistence
4. Configure provider API rate limits

### Vertical Scaling

1. Increase server resources
2. Optimize database queries
3. Implement caching layer
4. Use read replicas for reporting

### Database Optimization

1. Add appropriate indexes
2. Archive old data
3. Implement partitioning
4. Use connection pooling

## Maintenance Schedule

### Daily Tasks

- Monitor provider connectivity
- Review alert logs
- Check reconciliation completion
- Verify float balances

### Weekly Tasks

- Review transaction volumes
- Check system performance
- Analyze error logs
- Validate commission calculations

### Monthly Tasks

- Review reconciliation discrepancies
- Analyze fraud patterns
- Update provider configurations
- Performance optimization

### Quarterly Tasks

- Rotate API credentials
- Security audit
- Database maintenance
- Backup verification

## Disaster Recovery

### Recovery Time Objective (RTO)

- Critical systems: 1 hour
- Non-critical systems: 4 hours

### Recovery Point Objective (RPO)

- Transaction data: 1 hour
- Configuration data: 1 day

### Disaster Recovery Procedures

1. **Database Failure**
   - Restore from latest backup
   - Verify data integrity
   - Resume operations

2. **Provider API Failure**
   - Switch to backup provider
   - Queue transactions for retry
   - Manual reconciliation

3. **Complete System Failure**
   - Restore from backup
   - Reconfigure providers
   - Verify all systems
   - Resume operations

## Support & Maintenance

### Getting Help

- Review SYSTEM_DOCUMENTATION.md for detailed information
- Check logs for error messages
- Contact provider support for API issues
- Escalate to development team for bugs

### Reporting Issues

Include the following when reporting issues:

1. Error message or description
2. Steps to reproduce
3. Relevant logs
4. System configuration
5. Provider information

---

**Last Updated**: April 2026  
**Version**: 1.0.0
