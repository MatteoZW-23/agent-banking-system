# Africa's Talking SMS Gateway Setup Guide

This guide provides comprehensive instructions for setting up the Africa's Talking SMS gateway integration for real-time alert notifications in the Agent Banking System.

## Overview

The Agent Banking System integrates with Africa's Talking to send SMS notifications for critical system alerts. This enables managers and operators to receive instant notifications about:

- **Large Discrepancies**: When transaction discrepancies exceed configured thresholds
- **Low Float Balance**: When provider float falls below minimum levels
- **Failed Reconciliation**: When automated reconciliation processes fail
- **Suspicious Transactions**: When LLM analysis flags potentially fraudulent transactions
- **High Commission**: When commission amounts exceed normal ranges

## Prerequisites

Before setting up the SMS gateway, ensure you have:

1. An active Africa's Talking account (https://africastalking.com)
2. API credentials (API Key and Username)
3. Valid phone numbers for receiving alerts
4. Access to the Agent Banking System dashboard

## Step 1: Create Africa's Talking Account

1. Visit https://africastalking.com
2. Click "Sign Up" and create a new account
3. Verify your email address
4. Complete your profile information
5. Add a payment method (if using production)

## Step 2: Obtain API Credentials

### For Sandbox (Testing)

1. Log in to your Africa's Talking dashboard
2. Navigate to **Settings → API Credentials**
3. Copy your **API Key** (keep this secure)
4. Note your **Username** (usually your account username)
5. The sandbox API endpoint is: `https://api.sandbox.africastalking.com`

### For Production

1. Complete the verification process on Africa's Talking
2. Navigate to **Settings → API Credentials**
3. Switch from Sandbox to Production mode
4. Copy your **Production API Key**
5. The production API endpoint is: `https://api.africastalking.com`

## Step 3: Configure Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Africa's Talking SMS Configuration
AFRICAS_TALKING_API_KEY=your_api_key_here
AFRICAS_TALKING_USERNAME=your_username_here
SMS_ALERTS_ENABLED=true
SMS_ALERT_RECIPIENTS=+263712345678,+263712345679
SMS_ALERT_TYPES=discrepancy,low_float,failed_reconciliation,suspicious_transaction
SMS_MIN_SEVERITY=high
```

### Environment Variable Descriptions

| Variable                   | Description                        | Example                                       |
| -------------------------- | ---------------------------------- | --------------------------------------------- |
| `AFRICAS_TALKING_API_KEY`  | Your Africa's Talking API Key      | `abc123def456ghi789`                          |
| `AFRICAS_TALKING_USERNAME` | Your Africa's Talking Username     | `myapp`                                       |
| `SMS_ALERTS_ENABLED`       | Enable/disable SMS alerts globally | `true` or `false`                             |
| `SMS_ALERT_RECIPIENTS`     | Comma-separated phone numbers      | `+263712345678,+263712345679`                 |
| `SMS_ALERT_TYPES`          | Alert types to notify              | `discrepancy,low_float,failed_reconciliation` |
| `SMS_MIN_SEVERITY`         | Minimum severity to trigger SMS    | `low`, `medium`, `high`, `critical`           |

## Step 4: Configure SMS Settings in Dashboard

1. Log in to the Agent Banking System dashboard
2. Navigate to **Settings → SMS Configuration**
3. Click **Enable** to activate SMS alerts
4. Add recipient phone numbers:
   - Format: `+263712345678` (international format)
   - Or: `0712345678` (local Zimbabwe format, auto-converted)
5. Select alert types to receive notifications
6. Set minimum severity level (recommended: `high`)
7. Click **Save Configuration**

## Step 5: Test SMS Service

### Via Dashboard

1. Go to **Settings → SMS Configuration**
2. Scroll to **Test SMS Service**
3. Enter a test phone number
4. Click **Send Test SMS**
5. Verify you receive the test message

### Via API

```bash
curl -X POST http://localhost:3000/api/trpc/sms.test \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+263712345678"}'
```

## Phone Number Formatting

The system automatically formats phone numbers to international format. Supported formats:

| Input Format    | Converted To    | Notes                  |
| --------------- | --------------- | ---------------------- |
| `0712345678`    | `+263712345678` | Zimbabwe local format  |
| `712345678`     | `+263712345678` | Without leading 0      |
| `263712345678`  | `+263712345678` | Country code without + |
| `+263712345678` | `+263712345678` | Already formatted      |

## Alert Severity Levels

SMS notifications respect severity levels. Configure the minimum severity to avoid alert fatigue:

| Level      | Description        | Use Case                                 |
| ---------- | ------------------ | ---------------------------------------- |
| `low`      | Minor issues       | Informational alerts                     |
| `medium`   | Notable issues     | Unusual but manageable situations        |
| `high`     | Significant issues | Requires attention (recommended default) |
| `critical` | Urgent issues      | Immediate action required                |

## Alert Types

Configure which alert types should trigger SMS notifications:

### Discrepancy Alerts

- **Trigger**: Transaction discrepancies exceed configured threshold (default: $10)
- **Example**: "DISCREPANCY: EcoCash reconciliation shows $50 discrepancy"

### Low Float Alerts

- **Trigger**: Provider float balance falls below minimum threshold
- **Example**: "LOW_FLOAT: EcoCash float balance is $100 (below $500 minimum)"

### Failed Reconciliation

- **Trigger**: Automated reconciliation process fails
- **Example**: "FAILED_RECONCILIATION: Daily reconciliation failed for EcoCash"

### Suspicious Transaction

- **Trigger**: LLM analysis flags transaction as potentially fraudulent
- **Example**: "SUSPICIOUS_TRANSACTION: Transaction #12345 flagged as high-risk"

### High Commission

- **Trigger**: Commission amount exceeds normal range
- **Example**: "HIGH_COMMISSION: Employee commission for today is $500 (3x average)"

## Delivery Tracking

The system automatically tracks SMS delivery status:

| Status      | Meaning                          |
| ----------- | -------------------------------- |
| `pending`   | SMS queued for sending           |
| `sent`      | SMS successfully sent to carrier |
| `delivered` | SMS delivered to recipient       |
| `failed`    | SMS delivery failed              |

View delivery reports in the **Alerts** page under SMS Notification History.

## Cost Management

### Sandbox Testing

- Sandbox SMS are free for testing
- No actual SMS sent; messages logged only
- Perfect for development and testing

### Production Usage

- Each SMS costs approximately $0.02-0.05 USD (varies by destination)
- Monitor usage in Africa's Talking dashboard
- Set up billing alerts to avoid unexpected charges

### Cost Optimization Tips

1. **Set appropriate severity threshold**: Only send SMS for important alerts
2. **Limit recipients**: Add only essential contact numbers
3. **Configure alert types**: Only enable necessary alert types
4. **Use rate limiting**: Prevent duplicate alerts within short timeframes

## Troubleshooting

### SMS Not Sending

**Problem**: SMS alerts are not being sent

**Solutions**:

1. Verify `SMS_ALERTS_ENABLED=true` in environment variables
2. Check that phone numbers are in correct format: `+263...`
3. Verify Africa's Talking API credentials are correct
4. Check alert severity meets minimum threshold
5. Verify alert type is enabled in configuration

### Test SMS Fails

**Problem**: Test SMS returns error

**Solutions**:

1. Verify API key and username are correct
2. Ensure you're using sandbox credentials for testing
3. Check internet connectivity
4. Verify phone number format is correct
5. Check Africa's Talking account has available balance (production)

### SMS Delivery Delayed

**Problem**: SMS takes too long to arrive

**Solutions**:

1. Check network connectivity
2. Verify phone number is correct and active
3. Check Africa's Talking service status
4. Review SMS delivery reports for errors
5. Contact Africa's Talking support if issue persists

### High SMS Costs

**Problem**: SMS charges are higher than expected

**Solutions**:

1. Review alert configuration - reduce alert types
2. Increase minimum severity threshold
3. Remove unnecessary recipients
4. Implement rate limiting for duplicate alerts
5. Monitor usage in Africa's Talking dashboard

## Security Best Practices

1. **Protect API Keys**: Never commit API keys to version control
2. **Use Environment Variables**: Store credentials in `.env` files (not committed)
3. **Limit Recipients**: Only add phone numbers of authorized personnel
4. **Audit Logs**: Review SMS notification history regularly
5. **Rotate Credentials**: Periodically update API keys in Africa's Talking
6. **Monitor Usage**: Set up billing alerts for unusual activity

## Integration with Alert System

The SMS service integrates with the main alert system:

1. Alert triggered in system
2. Alert severity and type evaluated
3. SMS configuration checked
4. If conditions met, SMS sent to configured recipients
5. Delivery status logged to database
6. Notification history available in dashboard

## API Endpoints

### Send Test SMS

```bash
POST /api/trpc/sms.test
Content-Type: application/json

{
  "phoneNumber": "+263712345678"
}
```

### Get SMS Configuration

```bash
GET /api/trpc/sms.getConfig
```

### Update SMS Configuration

```bash
POST /api/trpc/sms.updateConfig
Content-Type: application/json

{
  "enabled": true,
  "phoneNumbers": ["+263712345678"],
  "alertTypes": ["discrepancy", "low_float"],
  "minSeverity": "high"
}
```

## Support

For issues with:

- **Agent Banking System**: Contact system administrator
- **Africa's Talking**: Visit https://africastalking.com/support
- **SMS Delivery**: Check Africa's Talking dashboard for delivery reports

## Next Steps

1. ✅ Create Africa's Talking account
2. ✅ Obtain API credentials
3. ✅ Configure environment variables
4. ✅ Set up SMS in dashboard
5. ✅ Test SMS service
6. ✅ Monitor alert notifications
7. ✅ Review delivery reports regularly
8. ✅ Adjust configuration based on usage

---

**Last Updated**: April 2026
**Version**: 1.0
**Status**: Production Ready
