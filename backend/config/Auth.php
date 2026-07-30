<?php

declare(strict_types=1);

function iniciarSesionSegura(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => false,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    session_start();
}

function obtenerUsuarioSesion(): ?array
{
    iniciarSesionSegura();

    $usuario = $_SESSION['usuario_autenticado'] ?? null;

    if (!is_array($usuario)) {
        return null;
    }

    $usuarioId = $usuario['usuario_id'] ?? null;
    $rol = $usuario['rol'] ?? null;

    if (!is_int($usuarioId) || !is_string($rol) || $rol === '') {
        return null;
    }

    return $usuario;
}

function guardarUsuarioSesion(array $usuario): void
{
    iniciarSesionSegura();
    session_regenerate_id(true);

    $_SESSION['usuario_autenticado'] = [
        'usuario_id' => (int)$usuario['usuario_id'],
        'nombre' => (string)$usuario['nombre'],
        'apellido' => (string)$usuario['apellido'],
        'usuario' => (string)$usuario['usuario'],
        'email' => (string)$usuario['email'],
        'rol' => strtoupper((string)$usuario['rol']),
    ];
}

function cerrarSesionAutenticada(): void
{
    iniciarSesionSegura();

    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            (bool)$params['secure'],
            (bool)$params['httponly']
        );
    }

    session_destroy();
}

function responderJsonAuth(array $datos, int $codigo): never
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function requerirUsuarioAutenticado(): array
{
    $usuario = obtenerUsuarioSesion();

    if ($usuario === null) {
        responderJsonAuth([
            'success' => false,
            'message' => 'Debe iniciar sesión.'
        ], 401);
    }

    return $usuario;
}

function requerirRolAdmin(): array
{
    $usuario = requerirUsuarioAutenticado();

    if (($usuario['rol'] ?? '') !== 'ADMIN') {
        responderJsonAuth([
            'success' => false,
            'message' => 'No autorizado.'
        ], 403);
    }

    return $usuario;
}
