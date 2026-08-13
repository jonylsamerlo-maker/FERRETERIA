<?php

declare(strict_types=1);

require_once __DIR__ . '/Security.php';

class Database
{
    private string $host;
    private string $db_name;
    private string $username;
    private string $password;

    private ?PDO $conn = null;

    public function __construct()
    {
        $this->host = $this->leerConfiguracion('DB_HOST', 'db');
        $this->db_name = $this->leerConfiguracion('DB_NAME', 'ferreteria_db');
        $this->username = $this->leerConfiguracion('DB_USER', 'jony_user');
        $this->password = $this->leerConfiguracion('DB_PASSWORD', 'jony_password');
    }

    private function leerConfiguracion(string $clave, string $valorLocal): string
    {
        $valor = getenv($clave);

        if (is_string($valor) && $valor !== '') {
            return $valor;
        }

        if (esEntornoProduccion()) {
            throw new RuntimeException('La configuracion de base de datos esta incompleta.');
        }

        return $valorLocal;
    }

    public function getConnection(): ?PDO
    {
        if ($this->conn !== null) {
            return $this->conn;
        }

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password
            );

            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        } catch (PDOException $e) {
            error_log('No fue posible conectar con la base de datos: ' . $e->getMessage());
            throw new RuntimeException('No fue posible conectar con la base de datos.');
        }

        return $this->conn;
    }
}
