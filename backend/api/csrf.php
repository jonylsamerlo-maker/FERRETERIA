<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/Auth.php';
require_once __DIR__ . '/../config/Csrf.php';

configurarCors('GET, OPTIONS', true);
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    responderJsonAuth([
        'success' => false,
        'message' => 'Método no permitido.',
    ], 405);
}

requerirUsuarioAutenticado();

responderJsonAuth([
    'csrf_token' => obtenerTokenCsrf(),
], 200);
