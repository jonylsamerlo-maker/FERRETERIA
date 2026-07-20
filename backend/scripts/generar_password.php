<?php

declare(strict_types=1);

$password = "Admin123*";

$hash = password_hash($password, PASSWORD_DEFAULT);

echo "Contraseña: " . $password . PHP_EOL;
echo "Hash: " . $hash . PHP_EOL;