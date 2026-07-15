<?php

declare(strict_types=1);

require_once __DIR__ . '/config/Database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    if ($conn instanceof PDO) {
        echo "✅ Conexión exitosa a la base de datos.";
    } else {
        echo "❌ No se obtuvo una conexión.";
    }

} catch (Throwable $e) {
    echo "❌ Error: " . $e->getMessage();
}