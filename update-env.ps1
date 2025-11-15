# PowerShell script to update .env file with correct SMTP configuration

$envContent = @"
# Server Configuration
PORT=8098
NODE_ENV=development
BASE_URL=http://localhost:8098
PROD_URL=http://74.225.250.224/be/

# Database Configuration
DB=mongodb+srv://santwayne123:WAyne123@cluster0.hdya7.mongodb.net/pehli_rasam?retryWrites=true&w=majority&appName=pehli_rasam
DB1=mongodb://localhost:27017/pehli_rasam

# JWT Configuration
JWT_ACCESS_TOKEN=`$2y`$12`$ioeNXcYkkV0hxYifmhPeqOtoqj1J6RWP/b7IJtdgTYnUn9y8hXUuS
JWT_REFRESH_TOKEN=`$2y`$10`$oJEPb4r7y.UF3ctK1B0j.epCSSoACWdZd81odmVqtZH7sHhu/A0Ce
COOKIE_EXPIRES_TIME=7

# AWS S3 Configuration (Optional)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET_NAME=your_bucket_name
S3_REGION=eu-north-1
S3_BUCKET_NAME=pehli-rasam

# Azure Blob Storage Configuration
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=pehlirasamstorage;AccountKey=ntDHMRofxC6Be/tVfjzjOWOUI6IZA3twMWA7JyLzh0zke+w9vyveEW5pUapAy8Fp6oD54TaXvP+t+ASt2dWuRA==;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=pehlirasamstorage

# SendGrid Configuration (Optional - if using SendGrid instead of SMTP)
SENDGRID_API_KEY=your_real_sendgrid_api_key
SENDGRID_FROM_EMAIL=Info@PehliRasam.com

# SMTP Email Configuration
# For hosting provider (mail.pehlirasam.com) - Try port 587 first
SMTP_HOST=mail.pehlirasam.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=info@pehlirasam.com
SMTP_PASSWORD=Aahaanveer@4may22mamu
FROM_EMAIL=info@pehlirasam.com

# Alternative SMTP settings (uncomment if port 587 doesn't work):
# SMTP_PORT=465
# SMTP_SECURE=true

# Gmail SMTP Configuration (Alternative - for local development)
# If you want to use Gmail instead, uncomment these and comment the hosting provider settings above:
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=465
# SMTP_SECURE=true
# SMTP_USERNAME=knowthehiccup@gmail.com
# SMTP_PASSWORD=Galaxy!-
# FROM_EMAIL=knowthehiccup@gmail.com
# Note: For Gmail, you need to enable 2-Step Verification and use an App Password

# Application Links
LINK=http://localhost:8098
"@

# Backup existing .env file
if (Test-Path ".env") {
    Copy-Item ".env" ".env.backup" -Force
    Write-Host "Backed up existing .env to .env.backup" -ForegroundColor Yellow
}

# Write new .env file
$envContent | Out-File -FilePath ".env" -Encoding utf8 -NoNewline
Write-Host "Updated .env file with correct SMTP configuration!" -ForegroundColor Green
Write-Host ""
Write-Host "SMTP Configuration:" -ForegroundColor Cyan
Write-Host "  Host: mail.pehlirasam.com" -ForegroundColor White
Write-Host "  Port: 587 (STARTTLS)" -ForegroundColor White
Write-Host "  Username: info@pehlirasam.com" -ForegroundColor White
Write-Host ""
Write-Host "If port 587 doesn't work, edit .env and change:" -ForegroundColor Yellow
Write-Host "  SMTP_PORT=465" -ForegroundColor White
Write-Host "  SMTP_SECURE=true" -ForegroundColor White

