<?php
declare(strict_types=1);

function json_response(int $status, array $payload): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        json_response(400, [
            'ok' => false,
            'error' => 'Invalid JSON payload.',
        ]);
    }

    return $data;
}

function append_log(string $file, string $message): void
{
    $dir = dirname($file);
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    $line = sprintf("[%s] %s\n", date('c'), $message);
    file_put_contents($file, $line, FILE_APPEND);
}

function cors_headers(array $allowedOrigins): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if ($allowedOrigins === ['*']) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        return;
    }

    if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
    }
}

function load_processed_store(string $path): array
{
    if (!file_exists($path)) {
        return [];
    }

    $raw = file_get_contents($path);
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function save_processed_store(string $path, array $data): void
{
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

function http_get_json(array $endpoints, string $path): array
{
    $lastError = 'No endpoint attempts made.';

    foreach ($endpoints as $base) {
        $url = rtrim($base, '/') . $path;
        $ctx = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => 15,
                'header' => "Accept: application/json\r\n",
            ],
        ]);
        $response = @file_get_contents($url, false, $ctx);
        if ($response === false) {
            $lastError = 'Request failed for ' . $url;
            continue;
        }

        $statusLine = $http_response_header[0] ?? '';
        if (!str_contains($statusLine, '200')) {
            $lastError = 'Non-200 response for ' . $url . ' => ' . $statusLine;
            continue;
        }

        $data = json_decode($response, true);
        if (is_array($data)) {
            return $data;
        }
        $lastError = 'Invalid JSON from ' . $url;
    }

    throw new RuntimeException($lastError);
}

function http_post_json(string $url, array $payload, ?string $secret = null): array
{
    $body = json_encode($payload, JSON_UNESCAPED_SLASHES);
    $headers = [
        'Content-Type: application/json',
        'Accept: application/json',
    ];

    if ($secret !== null && $secret !== '') {
        $signature = hash_hmac('sha256', $body, $secret);
        $headers[] = 'X-Atom-Sales-Signature: sha256=' . $signature;
    }

    $ctx = stream_context_create([
        'http' => [
            'method' => 'POST',
            'timeout' => 20,
            'ignore_errors' => true,
            'header' => implode("\r\n", $headers),
            'content' => $body,
        ],
    ]);

    $response = @file_get_contents($url, false, $ctx);
    $statusLine = $http_response_header[0] ?? '';

    return [
        'status_line' => $statusLine,
        'body' => $response === false ? '' : $response,
        'ok' => str_contains($statusLine, '200') || str_contains($statusLine, '201') || str_contains($statusLine, '202'),
    ];
}

function parse_bank_send_from_tx(array $txData): array
{
    $tx = $txData['tx'] ?? [];
    $body = $tx['body'] ?? [];
    $messages = $body['messages'] ?? [];
    $first = is_array($messages) && isset($messages[0]) && is_array($messages[0]) ? $messages[0] : [];

    $from = (string)($first['from_address'] ?? '');
    $to = (string)($first['to_address'] ?? '');
    $amounts = $first['amount'] ?? [];

    $denom = '';
    $amount = '0';
    if (is_array($amounts) && isset($amounts[0]) && is_array($amounts[0])) {
        $denom = (string)($amounts[0]['denom'] ?? '');
        $amount = (string)($amounts[0]['amount'] ?? '0');
    }

    return [
        'from_address' => $from,
        'to_address' => $to,
        'denom' => $denom,
        'amount' => $amount,
        'memo' => (string)($body['memo'] ?? ''),
    ];
}
