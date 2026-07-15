<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'status' => 'ok',
    'api' => 'Ferretería API',
    'version' => '1.0'
]);