# Database Backup & Archival Strategy

## Overview
This document outlines the comprehensive backup and archival strategy for the restaurant ordering system database, ensuring data protection, disaster recovery, and compliance with data retention policies.

## Backup Types

### 1. Full Backups (Daily)
- **Schedule**: Every day at 2:00 AM local time
- **Retention**: 30 days
- **Storage**: Local and cloud storage
- **Method**: `pg_dump` with compression

```bash
#!/bin/bash
# Daily full backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/daily"
DB_NAME="restaurant_ordering"

pg_dump -h localhost -U postgres -d $DB_NAME \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="$BACKUP_DIR/full_backup_$DATE.dump"

# Upload to cloud storage
aws s3 cp "$BACKUP_DIR/full_backup_$DATE.dump" \
  "s3://restaurant-backups/daily/"
```

### 2. Incremental Backups (Hourly)
- **Schedule**: Every hour during business hours (7 AM - 11 PM)
- **Retention**: 7 days
- **Method**: WAL archiving and point-in-time recovery

```bash
#!/bin/bash
# WAL archiving configuration in postgresql.conf
# wal_level = replica
# archive_mode = on
# archive_command = 'cp %p /backups/wal/%f'
```

### 3. Transaction Log Backups (Continuous)
- **Method**: Continuous WAL shipping
- **Retention**: 7 days
- **Purpose**: Point-in-time recovery

## Backup Schedule

| Backup Type | Frequency | Retention | Storage Location |
|-------------|-----------|-----------|------------------|
| Full | Daily (2:00 AM) | 30 days | Local + Cloud |
| Incremental | Hourly (Business hours) | 7 days | Local + Cloud |
| WAL | Continuous | 7 days | Local + Cloud |
| Monthly Archive | 1st of month | 7 years | Cloud Only |

## Data Retention Policies

### Financial Data
- **Retention Period**: 7 years (legal requirement)
- **Archive Method**: Compressed full backups
- **Storage**: Cold storage (AWS Glacier)

### User Activity Data
- **Retention Period**: 2 years after last activity
- **Cleanup Method**: Automated deletion script
- **GDPR Compliance**: Right to erasure after 30 days notice

### Operational Data
- **Orders**: 3 years
- **Inventory**: 3 years
- **Employee Records**: 7 years after employment end
- **Audit Logs**: 10 years

## Archive Strategy

### Monthly Archives
```sql
-- Monthly archive procedure
CREATE OR REPLACE FUNCTION create_monthly_archive(p_year INTEGER, p_month INTEGER)
RETURNS VOID AS $$
DECLARE
    v_archive_date DATE;
    v_backup_file TEXT;
BEGIN
    v_archive_date := make_date(p_year, p_month, 1);
    v_backup_file := format('monthly_archive_%s_%s.dump', p_year, lpad(p_month::text, 2, '0'));

    -- Create filtered dump for the specific month
    PERFORM pg_dump_filtered(
        format('--where="created_at >= ''%s'' AND created_at < ''%s''",
               v_archive_date,
               v_archive_date + INTERVAL '1 month'),
        v_backup_file
    );

    -- Upload to long-term storage
    PERFORM upload_to_glacier(v_backup_file);
END;
$$ LANGUAGE plpgsql;
```

### Data Archival Process
1. **Identify old data** based on retention policies
2. **Export to archive format** (compressed SQL dumps)
3. **Verify archive integrity**
4. **Move to cold storage**
5. **Delete from production** (after verification)

## Disaster Recovery

### Recovery Time Objectives (RTO)
- **Critical systems**: 4 hours
- **Non-critical systems**: 24 hours

### Recovery Point Objectives (RPO)
- **Financial data**: 15 minutes
- **Operational data**: 1 hour

### Recovery Procedures

#### Full System Recovery
```bash
#!/bin/bash
# Full system recovery script
BACKUP_FILE=$1
DB_NAME="restaurant_ordering"

# Stop application services
systemctl stop restaurant-api
systemctl stop nginx

# Drop and recreate database
dropdb $DB_NAME
createdb $DB_NAME

# Restore from backup
pg_restore -h localhost -U postgres -d $DB_NAME \
  --verbose \
  --clean \
  --if-exists \
  $BACKUP_FILE

# Start services
systemctl start restaurant-api
systemctl start nginx
```

#### Point-in-Time Recovery
```bash
#!/bin/bash
# Point-in-time recovery script
RECOVERY_TIME=$1  # Format: 'YYYY-MM-DD HH:MM:SS'

# Stop PostgreSQL
systemctl stop postgresql

# Restore base backup
tar -xzf /backups/base_backup.tar.gz -C /var/lib/postgresql/data/

# Create recovery configuration
cat > /var/lib/postgresql/data/recovery.conf << EOF
restore_command = 'cp /backups/wal/%f %p'
recovery_target_time = '$RECOVERY_TIME'
recovery_target_action = 'promote'
EOF

# Start PostgreSQL in recovery mode
systemctl start postgresql
```

## Backup Verification

### Automated Testing
```bash
#!/bin/bash
# Backup verification script
BACKUP_FILE=$1
TEST_DB="test_restore_$(date +%s)"

# Create test database
createdb $TEST_DB

# Restore backup
pg_restore -d $TEST_DB $BACKUP_FILE

# Run verification queries
psql -d $TEST_DB -c "
SELECT
    'cafes' as table_name, count(*) as record_count
FROM cafes
UNION ALL
SELECT 'orders', count(*) FROM orders
UNION ALL
SELECT 'payments', count(*) FROM payments;
"

# Cleanup
dropdb $TEST_DB

echo "Backup verification completed successfully"
```

### Integrity Checks
- **Checksum verification** for all backup files
- **Test restoration** on staging environment weekly
- **Data consistency checks** after restoration

## Cloud Storage Configuration

### AWS S3 Lifecycle Policies
```json
{
  "Rules": [
    {
      "ID": "RestaurantBackupLifecycle",
      "Status": "Enabled",
      "Filter": {"Prefix": "backups/"},
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        },
        {
          "Days": 365,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ],
      "Expiration": {
        "Days": 2555  // 7 years
      }
    }
  ]
}
```

## Security Considerations

### Encryption
- **At rest**: AES-256 encryption for all backups
- **In transit**: TLS 1.3 for all transfers
- **Key management**: AWS KMS or similar

### Access Control
- **Backup access**: Limited to DBA and operations team
- **Audit logging**: All backup operations logged
- **Multi-factor authentication**: Required for production access

## Monitoring & Alerting

### Backup Monitoring
```sql
-- Backup monitoring view
CREATE VIEW backup_monitoring AS
SELECT
    backup_type,
    last_backup,
    CASE
        WHEN last_backup < NOW() - INTERVAL '25 hours' THEN 'CRITICAL'
        WHEN last_backup < NOW() - INTERVAL '23 hours' THEN 'WARNING'
        ELSE 'OK'
    END as status,
    backup_size_mb,
    duration_minutes
FROM backup_log
WHERE backup_date >= CURRENT_DATE - INTERVAL '7 days';
```

### Alert Conditions
- Backup failure or timeout
- Backup size deviation (>20% change)
- WAL archive delays
- Storage space warnings

## Compliance Requirements

### GDPR Compliance
- **Right to erasure**: 30-day implementation
- **Data portability**: Automated export capability
- **Audit trail**: Complete backup/restore logging

### Financial Regulations
- **7-year retention**: Tax and accounting records
- **Immutable storage**: WORM compliance for financial data
- **Regular audits**: Quarterly backup integrity verification

## Scripts and Automation

### Daily Backup Script
```bash
#!/bin/bash
# /opt/scripts/daily_backup.sh

set -e  # Exit on any error

# Configuration
DB_NAME="restaurant_ordering"
BACKUP_DIR="/backups/daily"
LOG_FILE="/var/log/backup.log"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Generate backup filename
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/restaurant_db_$DATE.dump"

# Log start
echo "[$(date)] Starting daily backup" >> $LOG_FILE

# Create backup
if pg_dump -h localhost -U postgres -d $DB_NAME \
    --format=custom \
    --compress=9 \
    --verbose \
    --file="$BACKUP_FILE" 2>> $LOG_FILE; then

    echo "[$(date)] Backup completed: $BACKUP_FILE" >> $LOG_FILE

    # Upload to cloud
    aws s3 cp "$BACKUP_FILE" "s3://restaurant-backups/daily/" >> $LOG_FILE 2>&1

    # Clean old backups
    find $BACKUP_DIR -name "*.dump" -mtime +$RETENTION_DAYS -delete

    echo "[$(date)] Daily backup process completed successfully" >> $LOG_FILE
else
    echo "[$(date)] ERROR: Backup failed" >> $LOG_FILE
    exit 1
fi
```

### Crontab Configuration
```bash
# Daily backup at 2:00 AM
0 2 * * * /opt/scripts/daily_backup.sh

# Hourly WAL backup during business hours
0 7-23 * * * /opt/scripts/wal_backup.sh

# Weekly backup verification
0 3 * * 1 /opt/scripts/verify_backup.sh

# Monthly archive creation
0 4 1 * * /opt/scripts/monthly_archive.sh
```

## Testing & Validation

### Monthly DR Tests
- Full system recovery test
- Point-in-time recovery test
- Performance validation after recovery

### Annual Compliance Audit
- Backup integrity verification
- Retention policy compliance
- Security assessment

This backup strategy ensures comprehensive data protection while maintaining compliance with legal requirements and business continuity needs.