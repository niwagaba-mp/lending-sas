#!/bin/bash
# ssl_provision.sh - Zero-downtime Let's Encrypt bootstrapping & renewal configuration
# Sets up dummy certificates to satisfy Nginx startup requirements, runs Certbot webroot verification,
# and switches Nginx to the signed production certificates.

domains=("smos-cloud.com" "www.smos-cloud.com")
email="admin@smos-cloud.com"
data_path="/etc/letsencrypt"
webroot_path="./certbot/www"

echo "=========================================================="
echo "      SMOS Zero-Downtime Let's Encrypt Provisioner        "
echo "=========================================================="

# Check if docker-compose is available
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Ensure Certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "⏳ Certbot is not installed on host. Installing certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot
fi

# 1. Create Webroot dir
mkdir -p "$webroot_path"

# 2. Check if certificates exist
if [ -d "$data_path/live/${domains[0]}" ]; then
    echo "✅ SSL certificates already exist. Running Certbot renewal check..."
    sudo certbot renew --webroot -w "$webroot_path" --post-hook "docker exec smos_nginx_prod nginx -s reload"
    exit 0
fi

echo "⏳ SSL certificates not found. Starting bootstrapping process..."

# 3. Create dummy certificates to bypass Nginx boot-time check
echo "⏳ Generating dummy certificates for ${domains[0]}..."
path="/etc/letsencrypt/live/${domains[0]}"
sudo mkdir -p "$path"

# Generate mock private key and certificate
sudo openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "$path/privkey.pem" \
  -out "$path/fullchain.pem" \
  -subj "/CN=localhost"

echo "⏳ Starting Nginx in production mode with dummy certificate..."
docker compose -f docker-compose.prod.yml up --force-recreate -d nginx

# Wait for Nginx to initialize
sleep 3

# 4. Request the real Let's Encrypt certificates
echo "⏳ Deleting dummy certificates..."
sudo rm -rf "$path"

echo "🚀 Requesting real SSL certificates from Let's Encrypt..."
domain_args=""
for d in "${domains[@]}"; do
  domain_args="$domain_args -d $d"
done

sudo certbot certonly --webroot -w "$webroot_path" \
  $domain_args \
  --email "$email" \
  --agree-tos \
  --no-eff-email \
  --non-interactive

# 5. Reload Nginx configuration to load production certificates
echo "🚀 Reloading Nginx configuration..."
docker exec smos_nginx_prod nginx -s reload

echo "✅ Let's Encrypt certificates successfully provisioned and active!"

# 6. Set up automated renewal crontab
echo "⏳ Configuring cron job for weekly certificate renewal checks..."
(crontab -l 2>/dev/null; echo "0 3 * * 0 certbot renew --webroot -w $webroot_path --quiet --post-hook 'docker exec smos_nginx_prod nginx -s reload'") | crontab -
echo "✅ Automated renewal cron job registered."
