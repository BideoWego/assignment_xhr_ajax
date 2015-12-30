<?php

$data = ($_SERVER['REQUEST_METHOD'] === 'GET') ? $_GET : $_POST;
echo json_encode($data);
echo print_r($data, true);
echo $_SERVER['REQUEST_URI'];

