<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit(1);
}

require_once __DIR__ . '/../config/Database.php';

const LONGITUD_MINIMA_PASSWORD = 12;

function leerCampo(string $prompt): string
{
    fwrite(STDOUT, $prompt);
    $entrada = fgets(STDIN);

    if ($entrada === false) {
        throw new RuntimeException('No fue posible leer la entrada.');
    }

    return trim($entrada);
}

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

function validarDatos(string $nombre, string $apellido, string $usuario, string $email): void
{
    if ($nombre === '' || strlen($nombre) > 100) {
        throw new InvalidArgumentException('El nombre es obligatorio y debe tener hasta 100 caracteres.');
    }

    if ($apellido === '' || strlen($apellido) > 100) {
        throw new InvalidArgumentException('El apellido es obligatorio y debe tener hasta 100 caracteres.');
    }

    if (preg_match('/^[a-zA-Z0-9._-]{3,50}$/D', $usuario) !== 1) {
        throw new InvalidArgumentException('El usuario debe tener entre 3 y 50 caracteres alfanuméricos, punto, guion o guion bajo.');
    }

    if (strlen($email) > 150 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        throw new InvalidArgumentException('El email no es válido.');
    }
}

function crearAdmin(PDO $conn, string $nombre, string $apellido, string $usuario, string $email, string $hash): void
{
    $bloqueo = $conn->query("SELECT GET_LOCK('ferreteria_jm_crear_primer_admin', 10)");

    if ((int) $bloqueo->fetchColumn() !== 1) {
        throw new RuntimeException('No se pudo obtener el bloqueo de aprovisionamiento. Intente nuevamente.');
    }

    try {
        $adminExistente = $conn->query("SELECT usuario_id FROM usuarios WHERE rol = 'ADMIN' LIMIT 1");

        if ($adminExistente->fetchColumn() !== false) {
            throw new DomainException('Ya existe un usuario ADMIN. Esta herramienta no lo modifica.');
        }

        $duplicado = $conn->prepare(
            'SELECT usuario_id FROM usuarios WHERE usuario = :usuario OR email = :email LIMIT 1'
        );
        $duplicado->execute([
            ':usuario' => $usuario,
            ':email' => $email,
        ]);

        if ($duplicado->fetchColumn() !== false) {
            throw new DomainException('El usuario o email ya está registrado. No se creó ningún ADMIN.');
        }

        $crear = $conn->prepare(
            "INSERT INTO usuarios (nombre, apellido, usuario, email, password, rol)
             VALUES (:nombre, :apellido, :usuario, :email, :password, 'ADMIN')"
        );
        $crear->execute([
            ':nombre' => $nombre,
            ':apellido' => $apellido,
            ':usuario' => $usuario,
            ':email' => $email,
            ':password' => $hash,
        ]);
    } finally {
        $liberarBloqueo = $conn->query("SELECT RELEASE_LOCK('ferreteria_jm_crear_primer_admin')");
        $liberarBloqueo->fetchColumn();
    }
}

function hayAdmin(PDO $conn): bool
{
    $adminExistente = $conn->query("SELECT usuario_id FROM usuarios WHERE rol = 'ADMIN' LIMIT 1");

    return $adminExistente->fetchColumn() !== false;
}

try {
    fwrite(STDOUT, "Aprovisionamiento del primer ADMIN. No ejecute esta herramienta si ya existe uno.\n");

    $database = new Database();
    $conn = $database->getConnection();

    if (!$conn instanceof PDO) {
        throw new RuntimeException('No fue posible acceder a la base de datos.');
    }

    if (hayAdmin($conn)) {
        throw new DomainException('Ya existe un usuario ADMIN. Esta herramienta no lo modifica.');
    }

    $nombre = leerCampo('Nombre: ');
    $apellido = leerCampo('Apellido: ');
    $usuario = leerCampo('Usuario: ');
    $email = leerCampo('Email: ');
    validarDatos($nombre, $apellido, $usuario, $email);

    $password = leerPasswordOculta('Contraseña: ');
    $confirmacion = leerPasswordOculta('Repita la contraseña: ');

    if (strlen($password) < LONGITUD_MINIMA_PASSWORD) {
        throw new InvalidArgumentException('La contraseña debe tener al menos 12 caracteres.');
    }

    if (!hash_equals($password, $confirmacion)) {
        throw new InvalidArgumentException('Las contraseñas no coinciden.');
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    if ($hash === false) {
        throw new RuntimeException('No fue posible proteger la contraseña.');
    }

    crearAdmin($conn, $nombre, $apellido, $usuario, $email, $hash);
    fwrite(STDOUT, "ADMIN creado correctamente.\n");
    exit(0);
} catch (DomainException $e) {
    fwrite(STDERR, $e->getMessage() . PHP_EOL);
    exit(2);
} catch (InvalidArgumentException $e) {
    fwrite(STDERR, $e->getMessage() . PHP_EOL);
    exit(1);
} catch (Throwable $e) {
    fwrite(STDERR, "No fue posible crear el ADMIN.\n");
    exit(1);
} finally {
    if (isset($password)) {
        $password = '';
    }

    if (isset($confirmacion)) {
        $confirmacion = '';
    }
}
