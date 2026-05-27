#!/bin/bash
# SMOS Test Deployment Script
# Run this from /home/finance-os/lending-sas/smos

echo "=== SMOS Setup Script ==="
echo ""

echo "[1/4] Pulling latest code from GitHub..."
git pull
echo ""

echo "[2/4] Clearing Docker build cache..."
docker builder prune -af --filter until=1h
echo ""

echo "[3/4] Building and starting all containers..."
docker compose -f docker-compose.test.yml up -d --build
echo ""

echo "[4/4] Checking container status..."
docker compose -f docker-compose.test.yml ps
echo ""

echo "=== Done! ==="
echo "Open http://localhost in your browser to access SMOS."
