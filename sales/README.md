# Atom Registry Sales Widget Package (Portable Install Pass)

This package is designed to install cleanly on any domain that can serve static files and run PHP.

## Upload
Upload the **contents** of the `sales/` folder into your site's `/sales/` directory.

Example:
- `/public_html/sales/index.html`
- `/public_html/sales/widget.js`
- `/public_html/sales/widget.html`
- `/public_html/sales/docs.html`
- `/public_html/sales/api/verify-sale.php`

## Public URLs
- `/sales/`
- `/sales/widget.js`
- `/sales/widget.html`
- `/sales/docs.html`
- `/sales/api/verify-sale.php`

## Backend files
- `/sales/api/config.example.php`
- `/sales/api/config.php` (you create this by copying the example)
- `/sales/api/helpers.php`
- `/sales/api/.htaccess`
- `/sales/storage/`

## Required setup
1. Copy `api/config.example.php` to `api/config.php`
2. Update your webhook URL and secret
3. Make sure `/sales/storage/` is writable by PHP
4. Open `/sales/` and set the builder's `Widget install base URL` to your own domain path, such as:
   - `https://yourdomain.com/sales`
5. Set `verifyEndpoint` to:
   - `https://yourdomain.com/sales/api/verify-sale.php`

## Front-end features
- Keplr detection
- in-widget ATOM payment flow
- Mintscan success links
- public / checkout-only / hidden address visibility
- product image support
- digital download URL support
- script and iframe embeds

## Backend features
- Cosmos Hub tx verification
- recipient / amount / memo checks
- duplicate tx blocking
- optional downstream webhook firing

## Important
The front-end widget is portable. The full production stack requires PHP for `/sales/api/verify-sale.php`.

This pass also supports a product image shown above the description and an optional download URL that opens immediately after successful payment broadcast.
