<?php
// router.php for PHP built-in web server
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// If the file exists and is a file, serve it directly (e.g., api/upload.php)
if (file_exists(__DIR__ . $path) && is_file(__DIR__ . $path)) {
    return false; // Let PHP's built-in server handle the file directly
}

// Otherwise, route to index.php (Front Controller)
include_once __DIR__ . '/index.php';
?>
