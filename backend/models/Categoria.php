<?php

declare(strict_types=1);

class Categoria
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
                categoria_id,
                nombre,
                descripcion
            FROM categorias
            ORDER BY nombre ASC
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}