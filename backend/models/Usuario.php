<?php

declare(strict_types=1);

class Usuario
{
    private PDO $conn;

    public function __construct(PDO $conn)
    {
        $this->conn = $conn;
    }

    public function listar(): array
    {
        $sql = "
            SELECT
                usuario_id,
                nombre,
                apellido,
                usuario,
                email
            FROM usuarios
            ORDER BY nombre ASC
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}