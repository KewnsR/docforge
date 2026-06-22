<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("X-Powered-By: DocForge");

require_once 'config/database.php';
require_once 'models/Project.php';
require_once 'models/Document.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/index.php', '', $path);

// API Router
switch($path) {
    case '/api/projects':
        if($method === 'GET') {
            $projectModel = new Project();
            echo json_encode($projectModel->getAll());
        } elseif($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $projectModel = new Project();
            echo json_encode($projectModel->create($data));
        }
        break;
        
    case strpos($path, '/api/projects/') === 0:
        $projectId = explode('/', $path)[3];
        if($method === 'GET') {
            $projectModel = new Project();
            echo json_encode($projectModel->getById($projectId));
        } elseif($method === 'DELETE') {
            $projectModel = new Project();
            echo json_encode($projectModel->delete($projectId));
        }
        break;
        
    case '/api/health':
        echo json_encode(['status' => 'healthy', 'service' => 'DocForge API']);
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found', 'service' => 'DocForge']);
}
?>