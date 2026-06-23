<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$projectId = $_POST['project_id'] ?? null;
if (!$projectId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing project_id']);
    exit;
}

$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$uploadedFilesList = [];

if (isset($_FILES['files'])) {
    $files = $_FILES['files'];
    // Check if it's a single or multiple files upload
    $fileNames = is_array($files['name']) ? $files['name'] : [$files['name']];
    $fileTmpNames = is_array($files['tmp_name']) ? $files['tmp_name'] : [$files['tmp_name']];
    $fileErrors = is_array($files['error']) ? $files['error'] : [$files['error']];
    
    $count = count($fileNames);
    
    for ($i = 0; $i < $count; $i++) {
        if ($fileErrors[$i] === UPLOAD_ERR_OK) {
            $filename = basename($fileNames[$i]);
            $filepath = 'uploads/' . $projectId . '/' . $filename;
            $content = file_get_contents($fileTmpNames[$i]);
            
            // Check if file already exists in project, if so, update it
            $checkQuery = "SELECT id FROM files WHERE project_id = :project_id AND filename = :filename";
            $stmt = $conn->prepare($checkQuery);
            $stmt->execute([':project_id' => $projectId, ':filename' => $filename]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existing) {
                $query = "UPDATE files SET content = :content, filepath = :filepath, uploaded_at = CURRENT_TIMESTAMP WHERE id = :id";
                $stmt = $conn->prepare($query);
                $stmt->execute([
                    ':content' => $content,
                    ':filepath' => $filepath,
                    ':id' => $existing['id']
                ]);
            } else {
                $query = "INSERT INTO files (project_id, filename, filepath, content) VALUES (:project_id, :filename, :filepath, :content)";
                $stmt = $conn->prepare($query);
                $stmt->execute([
                    ':project_id' => $projectId,
                    ':filename' => $filename,
                    ':filepath' => $filepath,
                    ':content' => $content
                ]);
            }
            
            $uploadedFilesList[] = [
                'filename' => $filename,
                'filepath' => $filepath
            ];
        }
    }
}

echo json_encode([
    'success' => true,
    'files' => $uploadedFilesList
]);
?>
