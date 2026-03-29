<?php
declare(strict_types=1);

return [
    // Where verified downstream order / fulfillment requests should be sent.
    'downstream_webhook_url' => 'https://atomregistry.com/api/order-fulfillment',

    // Optional shared secret for signing outbound webhook payloads.
    'downstream_webhook_secret' => 'replace-with-a-long-random-secret',

    // Cosmos Hub LCD endpoints checked in order.
    'lcd_endpoints' => [
        'https://cosmos-rest.publicnode.com',
        'https://rest.cosmos.directory/cosmoshub',
        'https://cosmoshub-api.lavenderfive.com',
        'https://cosmos-api.polkachu.com',
    ],

    // Optional CORS allowlist. Use ['*'] for fully public or list explicit origins.
    'allowed_origins' => ['*'],

    // Storage file used to prevent duplicate webhook firing for the same tx hash.
    'processed_tx_store' => __DIR__ . '/../storage/processed-transactions.json',

    // Log file for verification attempts and webhook activity.
    'log_file' => __DIR__ . '/../storage/verify-sale.log',

    // If true, the script rejects duplicate tx hashes after a successful verify+webhook cycle.
    'block_duplicate_processing' => true,

    // If true, require the client to send a recipient address and verify it exactly.
    'require_recipient_match' => true,

    // If true, require memo match when a memo is provided in the incoming payload.
    'require_memo_match' => true,
];
