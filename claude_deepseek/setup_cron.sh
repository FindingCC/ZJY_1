#!/bin/bash
# Install weekly safety-study cron on production server
# Run: bash setup_cron.sh
set -e

CRON_LINE='0 2 * * 1 cd /opt/ZJY_1/claude_deepseek && node scripts/bootstrap.js >> /var/log/bootstrap.log 2>&1'

(crontab -l 2>/dev/null; echo "$CRON_LINE") | sort -u | crontab -
echo "Cron installed. Current crontab:"
crontab -l
