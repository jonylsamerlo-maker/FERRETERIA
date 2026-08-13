<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/Security.php';

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../config/Database.php';

function leerPasswordOculta(string $prompt): string
{
    if (!function_exists('shell_exec')) {
        throw new RuntimeException('No se puede ocultar la entrada en esta terminal.');
    }

    $estadoTerminal = shell_exec('stty -g');

    if (!is_string($estadoTerminal) || trim($estadoTerminal) === '') {
        throw new RuntimeException('Ejecute esta herramienta desde una terminal interactiva.');
    }

    fwrite(STDOUT, $prompt);
    shell_exec('stty -echo');

    try {
        $entrada = fgets(STDIN);
    } finally {
        shell_exec('stty ' . escapeshellarg(trim($estadoTerminal)));
        fwrite(STDOUT, PHP_EOL);
    }

    if ($entrada === false) {
        throw new RuntimeException('No fue posible leer la entrada.');
    }

    return rtrim($entrada, "\r\n");
}

if ($argc !== 2 || trim($argv[1]) === '') {
    fwrite(STDERR, "Uso: php scripts/cambiar_password.php <usuario-admin>\n");
    exit(1);
}

$usuario = trim($argv[1]);

try {
    $password = leerPasswordOculta('Nueva password: ');
    $confirmacion = leerPasswordOculta('Repita la nueva password: ');

    if ($password === '' || !hash_equals($password, $confirmacion)) {
        throw new RuntimeException('Las entradas no coinciden o estan vacias.');
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    if ($hash === false) {
        throw new RuntimeException('No fue posible generar la credencial.');
    }

    $database = new Database();
    $conn = $database->getConnection();

    if (!$conn instanceof PDO) {
        throw new RuntimeException('No fue posible acceder a la base de datos.');
    }

    $stmt = $conn->prepare(
        "UPDATE usuarios
         SET password = :password
         WHERE usuario = :usuario
           AND rol = 'ADMIN'"
    );
    $stmt->execute([
        ':password' => $hash,
        ':usuario' => $usuario,
    ]);

    if ($stmt->rowCount() !== 1) {
        throw new RuntimeException('No se encontro un ADMIN unico con ese usuario.');
    }

    fwrite(STDOUT, "Credencial actualizada correctamente.\n");
} catch (Throwable $e) {
    fwrite(STDERR, "No fue posible actualizar la credencial.\n");
    exit(1);
} finally {
    if (isset($password)) {
        $password = '';
    }

    if (isset($confirmacion)) {
        $confirmacion = '';
    }
}
