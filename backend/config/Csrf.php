<?php

declare(strict_types=1);

const CSRF_SESSION_KEY = 'csrf_token';

function obtenerTokenCsrf(): string
{
    iniciarSesionSegura();

    $token = $_SESSION[CSRF_SESSION_KEY] ?? null;

    if (!is_string($token) || $token === '') {
        $token = bin2hex(random_bytes(32));
        $_SESSION[CSRF_SESSION_KEY] = $token;
    }

    return $token;
}

function regenerarTokenCsrf(): string
{
    iniciarSesionSegura();

    $token = bin2hex(random_bytes(32));
    $_SESSION[CSRF_SESSION_KEY] = $token;

    return $token;
}

function invalidarTokenCsrf(): void
{
    iniciarSesionSegura();
    unset($_SESSION[CSRF_SESSION_KEY]);
}

function requerirTokenCsrf(): void
{
    iniciarSesionSegura();

    $tokenEsperado = $_SESSION[CSRF_SESSION_KEY] ?? null;
    $tokenRecibido = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;

    if (
        !is_string($tokenEsperado) ||
        $tokenEsperado === '' ||
        !is_string($tokenRecibido) ||
        $tokenRecibido === '' ||
        !hash_equals($tokenEsperado, $tokenRecibido)
    ) {
        responderJsonAuth([
            'success' => false,
            'message' => 'Token CSRF inválido.',
        ], 403);
    }
}
