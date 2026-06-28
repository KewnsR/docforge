<?php
// config/database.php

class DokariFallbackStatement {
    private $sql;
    private $data = [];
    private $dbPath;

    public function __construct($sql, $dbPath) {
        $this->sql = $sql;
        $this->dbPath = $dbPath;
    }

    private function loadDB() {
        if (!file_exists($this->dbPath)) {
            $dir = dirname($this->dbPath);
            if (!is_dir($dir)) mkdir($dir, 0777, true);
            $initial = ['users' => [], 'projects' => [], 'files' => [], 'documents' => []];
            file_put_contents($this->dbPath, json_encode($initial, JSON_PRETTY_PRINT));
            return $initial;
        }
        $content = file_get_contents($this->dbPath);
        $db = json_decode($content, true);
        if (!is_array($db)) {
            $db = ['users' => [], 'projects' => [], 'files' => [], 'documents' => []];
        }
        return $db;
    }

    private function saveDB($db) {
        $dir = dirname($this->dbPath);
        if (!is_dir($dir)) mkdir($dir, 0777, true);
        file_put_contents($this->dbPath, json_encode($db, JSON_PRETTY_PRINT));
    }

    public function execute($params = []) {
        $db = $this->loadDB();
        $sql = $this->sql;
        $this->data = [];

        // USERS queries
        if (strpos($sql, 'WHERE username = :username') !== false && (strpos($sql, 'users') !== false || strpos($sql, 'table_name') !== false)) {
            foreach ($db['users'] as $u) {
                if (strtolower($u['username']) === strtolower($params[':username'] ?? '')) {
                    $this->data[] = ['id' => (int)$u['id'], 'username' => $u['username'], 'password' => $u['password']];
                }
            }
        } else if (strpos($sql, 'INSERT INTO users') !== false || (strpos($sql, 'INSERT INTO') !== false && strpos($sql, 'username') !== false)) {
            $newId = count($db['users']) > 0 ? max(array_column($db['users'], 'id')) + 1 : 1;
            $newUser = [
                'id' => $newId,
                'username' => $params[':username'] ?? '',
                'password' => $params[':password'] ?? '',
                'created_at' => date('Y-m-d H:i:s')
            ];
            $db['users'][] = $newUser;
            $this->saveDB($db);
            $this->data[] = ['id' => $newId];
        }

        // PROJECTS queries
        else if (strpos($sql, 'FROM projects') !== false || (strpos($sql, 'FROM') !== false && strpos($sql, 'user_id') !== false)) {
            if (strpos($sql, 'WHERE id = :id AND user_id = :user_id') !== false) {
                foreach ($db['projects'] as $p) {
                    if ((int)$p['id'] === (int)($params[':id'] ?? 0) && (int)$p['user_id'] === (int)($params[':user_id'] ?? 0)) {
                        $this->data[] = $p;
                    }
                }
            } else if (strpos($sql, 'WHERE user_id = :user_id') !== false) {
                foreach ($db['projects'] as $p) {
                    if ((int)$p['user_id'] === (int)($params[':user_id'] ?? 0)) {
                        $this->data[] = $p;
                    }
                }
                usort($this->data, function($a, $b) {
                    return strcmp($b['created_at'] ?? '', $a['created_at'] ?? '');
                });
            }
        } else if (strpos($sql, 'INSERT INTO projects') !== false || (strpos($sql, 'INSERT INTO') !== false && strpos($sql, 'description') !== false)) {
            $newId = count($db['projects']) > 0 ? max(array_column($db['projects'], 'id')) + 1 : 1;
            $newProject = [
                'id' => $newId,
                'name' => $params[':name'] ?? '',
                'description' => $params[':description'] ?? '',
                'user_id' => (int)($params[':user_id'] ?? 0),
                'created_at' => date('Y-m-d H:i:s')
            ];
            $db['projects'][] = $newProject;
            $this->saveDB($db);
            $this->data[] = ['id' => $newId];
        } else if (strpos($sql, 'DELETE FROM projects') !== false || (strpos($sql, 'DELETE FROM') !== false && strpos($sql, 'user_id') !== false)) {
            $db['projects'] = array_values(array_filter($db['projects'], function($p) use ($params) {
                return !((int)$p['id'] === (int)($params[':id'] ?? 0) && (int)$p['user_id'] === (int)($params[':user_id'] ?? 0));
            }));
            $this->saveDB($db);
        }

        // FILES queries
        else if (strpos($sql, 'FROM files') !== false) {
            if (strpos($sql, 'WHERE project_id = :project_id AND filename = :filename') !== false) {
                foreach ($db['files'] as $f) {
                    if ((int)$f['project_id'] === (int)($params[':project_id'] ?? 0) && $f['filename'] === ($params[':filename'] ?? '')) {
                        $this->data[] = ['id' => (int)$f['id']];
                    }
                }
            } else if (strpos($sql, 'WHERE project_id = :project_id') !== false) {
                foreach ($db['files'] as $f) {
                    if ((int)$f['project_id'] === (int)($params[':project_id'] ?? 0)) {
                        $this->data[] = $f;
                    }
                }
                usort($this->data, function($a, $b) {
                    return strcmp($b['uploaded_at'] ?? '', $a['uploaded_at'] ?? '');
                });
            }
        } else if (strpos($sql, 'UPDATE files SET') !== false) {
            foreach ($db['files'] as &$f) {
                if ((int)$f['id'] === (int)($params[':id'] ?? 0)) {
                    if (isset($params[':content'])) $f['content'] = $params[':content'];
                    if (isset($params[':filepath'])) $f['filepath'] = $params[':filepath'];
                    $f['uploaded_at'] = date('Y-m-d H:i:s');
                }
            }
            $this->saveDB($db);
        } else if (strpos($sql, 'INSERT INTO files') !== false) {
            $newId = count($db['files']) > 0 ? max(array_column($db['files'], 'id')) + 1 : 1;
            $newFile = [
                'id' => $newId,
                'project_id' => (int)($params[':project_id'] ?? 0),
                'filename' => $params[':filename'] ?? '',
                'filepath' => $params[':filepath'] ?? '',
                'content' => $params[':content'] ?? '',
                'uploaded_at' => date('Y-m-d H:i:s')
            ];
            $db['files'][] = $newFile;
            $this->saveDB($db);
            $this->data[] = ['id' => $newId];
        }

        // DOCUMENTS queries
        else if (strpos($sql, 'FROM documents') !== false) {
            if (strpos($sql, 'WHERE project_id = :project_id AND type = :type') !== false) {
                foreach ($db['documents'] as $d) {
                    if ((int)$d['project_id'] === (int)($params[':project_id'] ?? 0) && $d['type'] === ($params[':type'] ?? '')) {
                        $this->data[] = ['id' => (int)$d['id']];
                    }
                }
            } else if (strpos($sql, 'WHERE project_id = :project_id') !== false) {
                foreach ($db['documents'] as $d) {
                    if ((int)$d['project_id'] === (int)($params[':project_id'] ?? 0)) {
                        $this->data[] = $d;
                    }
                }
                usort($this->data, function($a, $b) {
                    return strcmp($b['created_at'] ?? '', $a['created_at'] ?? '');
                });
            }
        } else if (strpos($sql, 'UPDATE documents SET') !== false) {
            foreach ($db['documents'] as &$d) {
                if ((int)$d['id'] === (int)($params[':id'] ?? 0)) {
                    if (isset($params[':content'])) $d['content'] = $params[':content'];
                    if (isset($params[':format'])) $d['format'] = $params[':format'];
                    $d['created_at'] = date('Y-m-d H:i:s');
                }
            }
            $this->saveDB($db);
        } else if (strpos($sql, 'INSERT INTO documents') !== false) {
            $newId = count($db['documents']) > 0 ? max(array_column($db['documents'], 'id')) + 1 : 1;
            $newDoc = [
                'id' => $newId,
                'project_id' => (int)($params[':project_id'] ?? 0),
                'type' => $params[':type'] ?? '',
                'content' => $params[':content'] ?? '',
                'format' => $params[':format'] ?? 'markdown',
                'created_at' => date('Y-m-d H:i:s')
            ];
            $db['documents'][] = $newDoc;
            $this->saveDB($db);
            $this->data[] = ['id' => $newId];
        }

        return true;
    }

    public function fetch($mode = null) {
        if (empty($this->data)) return false;
        return array_shift($this->data);
    }

    public function fetchAll($mode = null) {
        $res = $this->data;
        $this->data = [];
        return $res;
    }
}

class DokariFallbackDB {
    private $dbPath;
    public function __construct($dbPath) {
        $this->dbPath = $dbPath;
    }
    public function setAttribute($attr, $val) {}
    public function prepare($sql) {
        return new DokariFallbackStatement($sql, $this->dbPath);
    }
}

class Database {
    private $host;
    private $port;
    private $db_name;
    private $username;
    private $password;
    private $conn;
    
    public function __construct() {
        // Load .env if it exists
        $envFile = __DIR__ . '/../../.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                $parts = explode('=', $line, 2);
                if (count($parts) === 2) {
                    $key = trim($parts[0]);
                    $val = trim($parts[1]);
                    $val = trim($val, "\"'");
                    $_ENV[$key] = $val;
                    putenv("$key=$val");
                }
            }
        }
        
        $this->host = getenv('DB_HOST') ?: 'localhost';
        $this->port = getenv('DB_PORT') ?: '5432';
        $this->db_name = getenv('DB_NAME') ?: 'dokari';
        $this->username = getenv('DB_USER') ?: 'postgres';
        $this->password = getenv('DB_PASSWORD') ?: 'postgres';
    }
    
    public function getConnection() {
        $this->conn = null;
        
        // Try connecting via PDO PostgreSQL if PDO extension is available
        if (extension_loaded('pdo') && extension_loaded('pdo_pgsql')) {
            try {
                $this->conn = new PDO(
                    "pgsql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name,
                    $this->username,
                    $this->password,
                    [PDO::ATTR_TIMEOUT => 2]
                );
                $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                return $this->conn;
            } catch(PDOException $exception) {
                error_log("PostgreSQL connection error: " . $exception->getMessage());
            }
        }
        
        // Automatic high-reliability local file DB fallback
        $storagePath = __DIR__ . '/../storage/db.json';
        return new DokariFallbackDB($storagePath);
    }
}
?>