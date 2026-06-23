<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");
header("X-Powered-By: DocForge");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config/database.php';
require_once 'models/Project.php';
require_once 'models/Document.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/index.php', '', $path);
$path = rtrim($path, '/');

// Router logic using regex path matching
if ($path === '' || $path === '/' || $path === '/api') {
    echo json_encode([
        'status' => 'online',
        'service' => 'DocForge PHP Backend API',
        'version' => '1.0.0',
        'message' => 'DocForge API endpoints are active. Use the frontend client to interact.'
    ]);
} elseif ($path === '/api/projects') {
    if ($method === 'GET') {
        $projectModel = new Project();
        echo json_encode($projectModel->getAll());
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $projectModel = new Project();
        $res = $projectModel->create($data);
        if (isset($res['error'])) {
            http_response_code(500);
        }
        echo json_encode($res);
    }
} elseif (preg_match('#^/api/projects/([0-9]+)$#', $path, $matches)) {
    $projectId = $matches[1];
    if ($method === 'GET') {
        $projectModel = new Project();
        echo json_encode($projectModel->getById($projectId));
    } elseif ($method === 'DELETE') {
        $projectModel = new Project();
        echo json_encode($projectModel->delete($projectId));
    }
} elseif (preg_match('#^/api/projects/([0-9]+)/files$#', $path, $matches)) {
    $projectId = $matches[1];
    if ($method === 'GET') {
        // Fetch files for project from DB
        $database = new Database();
        $conn = $database->getConnection();
        if ($conn) {
            $query = "SELECT id, filename, filepath, content FROM files WHERE project_id = :project_id ORDER BY uploaded_at DESC";
            $stmt = $conn->prepare($query);
            $stmt->execute([':project_id' => $projectId]);
            $files = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($files);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
        }
    }
} elseif (preg_match('#^/api/projects/([0-9]+)/documents$#', $path, $matches)) {
    $projectId = $matches[1];
    $documentModel = new Document();
    if ($method === 'GET') {
        echo json_encode($documentModel->getByProjectId($projectId));
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $res = $documentModel->save(
            $projectId, 
            $data['type'], 
            $data['content'], 
            $data['format'] ?? 'markdown'
        );
        if (isset($res['error'])) {
            http_response_code(500);
        }
        echo json_encode($res);
    }
} elseif ($path === '/api/health') {
    echo json_encode(['status' => 'healthy', 'service' => 'DocForge API']);
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found', 'service' => 'DocForge', 'path' => $path]);
}
?>