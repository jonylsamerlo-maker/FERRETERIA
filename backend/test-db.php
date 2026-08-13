<?php

declare(strict_types=1);

require_once __DIR__ . '/config/Security.php';

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/config/Database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    if ($conn instanceof PDO) {
        echo "Conexion exitosa a la base de datos." . PHP_EOL;
    } else {
        fwrite(STDERR, "No se obtuvo una conexion." . PHP_EOL);
        exit(1);
    }

} catch (Throwable $e) {
    fwrite(STDERR, "No fue posible verificar la conexion." . PHP_EOL);
    exit(1);
}
