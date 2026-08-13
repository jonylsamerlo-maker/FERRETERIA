<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/Security.php';

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

fwrite(STDERR, "Use scripts/cambiar_password.php para rotar una credencial.\n");
exit(1);
