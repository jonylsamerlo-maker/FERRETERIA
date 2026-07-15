<?php
// backend/index.php

// Una clase simple de prueba en POO
class Ferreteria {
    public $nombre;

    public function __construct($nombre) {
        $this->nombre = $nombre;
    }

    public function bienvenida() {
        return "Bienvenido a la API de " . $this->nombre . " con POO y Docker!";
    }
}

$miFerreteria = new Ferreteria("Don Bot");
echo $miFerreteria->bienvenida();