<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: http://localhost:4321');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/Auth.php';
require_once __DIR__ . '/../config/Csrf.php';

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
