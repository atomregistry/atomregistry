<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    json_response(500, [
        'ok' => false,
        'error' => 'Missing config.php. Copy config.example.php to config.php and update settings.',
    ]);
}

/** @var array<string,mixed> $config */
$config = require $configPath;
$allowedOrigins = $config['allowed_origins'] ?? ['*'];
cors_headers(is_array($allowedOrigins) ? $allowedOrigins : ['*']);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, [
        'ok' => false,
        'error' => 'POST required.',
    ]);
}

$payload = read_json_body();
$logFile = (string)($config['log_file'] ?? (__DIR__ . '/../storage/verify-sale.log'));

$txhash = strtoupper(trim((string)($payload['txhash'] ?? '')));
$recipient = trim((string)($payload['recipient_address'] ?? ''));
$expectedAmountUatom = trim((string)($payload['amount_uatom'] ?? ''));
$expectedMemo = (string)($payload['memo'] ?? '');
$expectedChainId = trim((string)($payload['chain_id'] ?? 'cosmoshub-4'));
$itemName = (string)($payload['item_name'] ?? 'Order');
$senderHint = trim((string)($payload['sender_address'] ?? ''));

if ($txhash === '' || !preg_match('/^[A-F0-9]{64}$/', $txhash)) {
    json_response(400, ['ok' => false, 'error' => 'Valid txhash is required.']);
}
if ($recipient === '') {
    json_response(400, ['ok' => false, 'error' => 'recipient_address is required.']);
}
if ($expectedAmountUatom === '' || !ctype_digit($expectedAmountUatom)) {
    json_response(400, ['ok' => false, 'error' => 'amount_uatom must be a numeric string.']);
}

$storePath = (string)($config['processed_tx_store'] ?? (__DIR__ . '/../storage/processed-transactions.json'));
$processed = load_processed_store($storePath);
if (($config['block_duplicate_processing'] ?? true) && isset($processed[$txhash])) {
    json_response(409, [
        'ok' => false,
        'error' => 'This transaction has already been processed.',
        'txhash' => $txhash,
        'processed_at' => $processed[$txhash]['processed_at'] ?? null,
    ]);
}

try {
    $lcdEndpoints = is_array($config['lcd_endpoints'] ?? null) ? $config['lcd_endpoints'] : [];
    $txData = http_get_json($lcdEndpoints, '/cosmos/tx/v1beta1/txs/' . $txhash);
} catch (Throwable $e) {
    append_log($logFile, 'TX fetch failure for ' . $txhash . ': ' . $e->getMessage());
    json_response(502, [
        'ok' => false,
        'error' => 'Unable to fetch transaction from Cosmos Hub LCD endpoints.',
        'details' => $e->getMessage(),
    ]);
}

$txResponse = $txData['tx_response'] ?? [];
$code = (int)($txResponse['code'] ?? 0);
if ($code !== 0) {
    append_log($logFile, 'TX ' . $txhash . ' failed with code ' . $code);
    json_response(422, [
        'ok' => false,
        'error' => 'Transaction exists but did not succeed.',
        'txhash' => $txhash,
        'code' => $code,
        'raw_log' => $txResponse['raw_log'] ?? null,
    ]);
}

$parsed = parse_bank_send_from_tx($txData);
$errors = [];

if (($txData['tx']['body']['memo'] ?? '') !== null && ($config['require_memo_match'] ?? true) && $expectedMemo !== '' && $parsed['memo'] !== $expectedMemo) {
    $errors[] = 'Memo mismatch.';
}
if (($config['require_recipient_match'] ?? true) && $parsed['to_address'] !== $recipient) {
    $errors[] = 'Recipient mismatch.';
}
if ($parsed['amount'] !== $expectedAmountUatom) {
    $errors[] = 'Amount mismatch.';
}
if ($parsed['denom'] !== 'uatom') {
    $errors[] = 'Unexpected denom: ' . $parsed['denom'];
}
if ($senderHint !== '' && $parsed['from_address'] !== $senderHint) {
    $errors[] = 'Sender mismatch.';
}

$chainId = (string)($txData['tx']['body']['memo'] ?? '');
$networkChainId = (string)($txData['tx_response']['tx']['@type'] ?? '');
unset($chainId, $networkChainId); // placeholder; response chain id is not consistently surfaced in LCD tx lookup.

if ($errors !== []) {
    append_log($logFile, 'Verification failed for ' . $txhash . ': ' . implode(' ', $errors));
    json_response(422, [
        'ok' => false,
        'error' => 'Transaction verification failed.',
        'txhash' => $txhash,
        'verification_errors' => $errors,
        'observed' => $parsed,
        'expected' => [
            'recipient_address' => $recipient,
            'amount_uatom' => $expectedAmountUatom,
            'memo' => $expectedMemo,
            'chain_id' => $expectedChainId,
        ],
    ]);
}

$verificationPayload = [
    'verified' => true,
    'txhash' => $txhash,
    'sender_address' => $parsed['from_address'],
    'recipient_address' => $parsed['to_address'],
    'amount_uatom' => $parsed['amount'],
    'memo' => $parsed['memo'],
    'item_name' => $itemName,
    'chain_id' => $expectedChainId,
    'verified_at' => date('c'),
];

$webhookResult = null;
$downstreamWebhookUrl = trim((string)($config['downstream_webhook_url'] ?? ''));
if ($downstreamWebhookUrl !== '') {
    $webhookResult = http_post_json(
        $downstreamWebhookUrl,
        $verificationPayload,
        (string)($config['downstream_webhook_secret'] ?? '')
    );
    append_log($logFile, 'Webhook result for ' . $txhash . ': ' . json_encode($webhookResult));
}

$processed[$txhash] = [
    'processed_at' => date('c'),
    'verification_payload' => $verificationPayload,
    'webhook_result' => $webhookResult,
];
save_processed_store($storePath, $processed);
append_log($logFile, 'Verified and stored ' . $txhash . ' for item ' . $itemName);

json_response(200, [
    'ok' => true,
    'message' => 'Transaction verified.',
    'txhash' => $txhash,
    'verification' => $verificationPayload,
    'webhook' => $webhookResult,
]);
