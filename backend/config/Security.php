<?php

declare(strict_types=1);

function esEntornoProduccion(): bool
{
    return strtolower((string)(getenv('APP_ENV') ?: 'development')) === 'production';
}

function configurarSeguridadHttp(): void
{
    header_remove('X-Powered-By');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header("Content-Security-Policy: frame-ancestors 'self'");
    header('X-Frame-Options: SAMEORIGIN');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');

    if (esEntornoProduccion()) {
        ini_set('display_errors', '0');
        ini_set('display_startup_errors', '0');
        ini_set('log_errors', '1');
    }
}

function obtenerOrigenFrontend(): string
{
    $origen = trim((string)(getenv('FRONTEND_ORIGIN') ?: 'http://localhost:4321'));

    if (
        preg_match('#^https?://[a-z0-9.-]+(?::\d{1,5})?$#iD', $origen) !== 1 ||
        str_contains($origen, "\r") ||
        str_contains($origen, "\n")
    ) {
        error_log('FRONTEND_ORIGIN no es un origen HTTP valido.');
        return 'http://localhost:4321';
    }

    return $origen;
}

function configurarCors(
    string $metodos,
    bool $permitirCsrf = false,
    bool $exponerDescarga = false
): void {
    header('Access-Control-Allow-Origin: ' . obtenerOrigenFrontend());
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: ' . $metodos);
    header(
        'Access-Control-Allow-Headers: Content-Type' .
        ($permitirCsrf ? ', X-CSRF-Token' : '')
    );

    if ($exponerDescarga) {
        header('Access-Control-Expose-Headers: Content-Disposition');
    }
}

configurarSeguridadHttp();
