#!/bin/bash
set -e

echo "Starting custom WordPress entrypoint..."

# Start the original WordPress entrypoint in the background
/usr/local/bin/docker-entrypoint.sh apache2-foreground &
WORDPRESS_PID=$!

# Wait a bit for WordPress to start
sleep 10

# Run WooCommerce installation in the background
/usr/local/bin/install-woocommerce.sh &

# Wait for the WordPress process
wait $WORDPRESS_PID
