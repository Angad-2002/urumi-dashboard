#!/bin/bash
set -e

echo "WooCommerce Installation Script Started"

# Wait for WordPress core installation
MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if wp core is-installed --allow-root --path=/var/www/html 2>/dev/null; then
    echo "WordPress is installed!"
    break
  fi
  echo "Waiting for WordPress installation... (Attempt $((ATTEMPT + 1))/$MAX_ATTEMPTS)"
  sleep 5
  ATTEMPT=$((ATTEMPT + 1))
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "ERROR: WordPress installation timeout"
  exit 1
fi

# Install WooCommerce if not already installed
if ! wp plugin is-installed woocommerce --allow-root --path=/var/www/html 2>/dev/null; then
  echo "Installing WooCommerce plugin..."
  wp plugin install woocommerce --activate --allow-root --path=/var/www/html

  # Basic WooCommerce configuration
  echo "Configuring WooCommerce..."
  wp option update woocommerce_store_address "123 Store Street" --allow-root --path=/var/www/html
  wp option update woocommerce_store_address_2 "" --allow-root --path=/var/www/html
  wp option update woocommerce_store_city "San Francisco" --allow-root --path=/var/www/html
  wp option update woocommerce_default_country "US:CA" --allow-root --path=/var/www/html
  wp option update woocommerce_store_postcode "94102" --allow-root --path=/var/www/html
  wp option update woocommerce_currency "USD" --allow-root --path=/var/www/html
  wp option update woocommerce_product_type "both" --allow-root --path=/var/www/html
  wp option update woocommerce_allow_tracking "no" --allow-root --path=/var/www/html

  # Enable cash on delivery payment method
  wp option update woocommerce_cod_settings '{"enabled":"yes","title":"Cash on delivery","description":"Pay with cash upon delivery."}' --format=json --allow-root --path=/var/www/html

  echo "WooCommerce installed and configured successfully!"
else
  echo "WooCommerce is already installed"
fi

echo "WooCommerce Installation Script Completed"
