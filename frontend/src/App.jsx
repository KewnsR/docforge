import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';

// Resolve Backend and AI service URLs dynamically
const HOST_IP = window.location.hostname || 'localhost';
const BACKEND_URL = `http://${HOST_IP}:8080`;
const AI_SERVICE_URL = `http://${HOST_IP}:5000`;

export default function App() {
  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // App States
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [documents, setDocuments] = useState({ api: '', readme: '' });
  const [diagramUrl, setDiagramUrl] = useState('');
  const [activeTab, setActiveTab] = useState('api');
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);

  // New Project Form State
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  // Toast State
  const [toasts, setToasts] = useState([]);

  // File Input Ref
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  // Sync HTML class list with theme changes
  useEffect(() => {
    document.documentElement.className = theme + '-mode';
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load projects list on startup and setup auto-refresh
  useEffect(() => {
    loadProjects();
    const interval = setInterval(() => {
      loadProjects();
    }, 15000);
    return () => clearInterval(interval);
  }, [currentProjectId]);

  // Handle Loading files & documents when project changes
  useEffect(() => {
    if (!currentProjectId) {
      setCurrentProject(null);
      setUploadedFiles([]);
      setDocuments({ api: '', readme: '' });
      setDiagramUrl('');
      return;
    }

    // 1. Fetch Project Details
    fetch(`${BACKEND_URL}/api/projects/${currentProjectId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load project details');
        return res.json();
      })
      .then(project => {
        setCurrentProject(project);
        setBackendOnline(true);
      })
      .catch(err => {
        console.error(err);
        showToast('Failed to load project details', 'error');
      });

    // 2. Fetch Project Files
    fetch(`${BACKEND_URL}/api/projects/${currentProjectId}/files`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load files');
        return res.json();
      })
      .then(files => {
        setUploadedFiles(files.map(f => ({
          filename: f.filename,
          content: f.content || ''
        })));
      })
      .catch(err => {
        console.error(err);
        showToast('Failed to load project files', 'error');
      });

    // 3. Fetch Project Documents
    fetch(`${BACKEND_URL}/api/projects/${currentProjectId}/documents`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load documents');
        return res.json();
      })
      .then(docs => {
        let apiContent = '';
        let readmeContent = '';
        let diagram = '';

        docs.forEach(doc => {
          if (doc.type === 'api') apiContent = doc.content;
          if (doc.type === 'readme') readmeContent = doc.content;
          if (doc.type === 'architecture') diagram = doc.content;
        });

        setDocuments({ api: apiContent, readme: readmeContent });
        if (diagram) {
          // Map localhost to hostname dynamically
          const mappedUrl = diagram.replace('localhost', HOST_IP);
          setDiagramUrl(mappedUrl);
        } else {
          setDiagramUrl('');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Failed to load project documents', 'error');
      });
  }, [currentProjectId]);

  // Utility to show toasts
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Toggle Theme handler
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Load Projects from Database
  const loadProjects = () => {
    fetch(`${BACKEND_URL}/api/projects`)
      .then(res => {
        if (!res.ok) throw new Error('Backend Offline');
        return res.json();
      })
      .then(data => {
        setProjects(data);
        setBackendOnline(true);
      })
      .catch(err => {
        if (backendOnline) {
          setBackendOnline(false);
          showToast(`Unable to connect to PHP backend at ${BACKEND_URL}`, 'error');
        }
      });
  };

  // Create Project
  const createProject = () => {
    if (!newProjectName.trim()) {
      showToast('Please enter a project name', 'warning');
      return;
    }

    fetch(`${BACKEND_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProjectName, description: newProjectDesc })
    })
      .then(res => {
        if (!res.ok) throw new Error('Create failed');
        return res.json();
      })
      .then(response => {
        if (response.error) throw new Error(response.error);
        
        showToast(`Project "${newProjectName}" created successfully!`, 'success');
        setNewProjectName('');
        setNewProjectDesc('');
        setCurrentProjectId(response.id);
        loadProjects();
      })
      .catch(err => {
        console.error(err);
        showToast(err.message || 'Failed to create project', 'error');
      });
  };

  // Delete Project
  const deleteCurrentProject = () => {
    if (!currentProjectId || !currentProject) return;

    if (!confirm(`Are you sure you want to delete project "${currentProject.name}"? This will permanently delete all uploaded files and generated documents.`)) {
      return;
    }

    fetch(`${BACKEND_URL}/api/projects/${currentProjectId}`, {
      method: 'DELETE'
    })
      .then(res => {
        if (!res.ok) throw new Error('Delete failed');
        return res.json();
      })
      .then(() => {
        showToast(`Project "${currentProject.name}" deleted successfully.`, 'success');
        setCurrentProjectId(null);
        loadProjects();
      })
      .catch(err => {
        console.error(err);
        showToast('Failed to delete project', 'error');
      });
  };

  // Handle local File Reading & DB Upload
  const handleFiles = (filesList) => {
    if (!currentProjectId) {
      showToast('Please select or create a project first!', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('project_id', currentProjectId);

    let filesReadCount = 0;
    const filesToRead = filesList.length;
    const tempUploadedFiles = [];

    setUploading(true);
    showToast(`Reading ${filesList.length} file(s)...`, 'info');

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      formData.append('files[]', file);

      const reader = new FileReader();
      reader.onload = (e) => {
        tempUploadedFiles.push({
          filename: file.name,
          content: e.target.result
        });
        filesReadCount++;

        if (filesReadCount === filesToRead) {
          uploadFiles(formData, tempUploadedFiles);
        }
      };
      reader.onerror = () => {
        filesReadCount++;
        if (filesReadCount === filesToRead) {
          uploadFiles(formData, tempUploadedFiles);
        }
      };
      reader.readAsText(file);
    }
  };

  const uploadFiles = (formData, tempFiles) => {
    showToast('Uploading files to database...', 'info');

    fetch(`${BACKEND_URL}/api/upload.php`, {
      method: 'POST',
      body: formData
    })
      .then(res => {
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
      })
      .then(response => {
        // Merge files in state without duplicate filenames
        setUploadedFiles(prev => {
          const merged = [...prev];
          tempFiles.forEach(tf => {
            const idx = merged.findIndex(uf => uf.filename === tf.filename);
            if (idx !== -1) {
              merged[idx] = tf;
            } else {
              merged.push(tf);
            }
          });
          return merged;
        });

        showToast(`${response.files.length} files uploaded successfully!`, 'success');
        setUploading(false);
      })
      .catch(err => {
        console.error(err);
        showToast('Upload failed. Please try again.', 'error');
        setUploading(false);
      });
  };

  // Generate All Documentation
  const generateDocumentation = () => {
    if (!currentProjectId) {
      showToast('Please select or create a project first!', 'warning');
      return;
    }

    if (uploadedFiles.length === 0) {
      showToast('Please upload some files first!', 'warning');
      return;
    }

    setGenerating(true);
    showToast('Generating docs with AI... This may take a moment.', 'info');

    const filesContentArray = uploadedFiles.map(f => ({
      filename: f.filename,
      content: f.content
    }));

    // Promise 1: Generate API Docs
    const apiPromise = fetch(`${AI_SERVICE_URL}/generate/api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: currentProjectId, files_content: filesContentArray })
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setDocuments(prev => ({ ...prev, api: res.documentation }));
          saveDocumentToDB(currentProjectId, 'api', res.documentation);
          showToast('API docs generated!', 'success');
        } else {
          throw new Error('API docs failed');
        }
      });

    // Promise 2: Generate README
    const readmePromise = fetch(`${AI_SERVICE_URL}/generate/readme`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_info: {
          name: currentProject?.name || 'DocForge Project',
          description: currentProject?.description || 'Generated with DocForge'
        },
        files_summary: `Project contains ${uploadedFiles.length} files: ` + uploadedFiles.map(f => f.filename).join(', ')
      })
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setDocuments(prev => ({ ...prev, readme: res.readme }));
          saveDocumentToDB(currentProjectId, 'readme', res.readme);
          showToast('README generated!', 'success');
        } else {
          throw new Error('README failed');
        }
      });

    // Promise 3: Generate Diagram
    const diagramPromise = fetch(`${AI_SERVICE_URL}/generate/diagram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code_structure: {
          files: uploadedFiles,
          project_name: currentProject?.name
        }
      })
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          const mappedUrl = res.diagram_url.replace('localhost', HOST_IP);
          setDiagramUrl(mappedUrl + '?t=' + new Date().getTime());
          saveDocumentToDB(currentProjectId, 'architecture', mappedUrl, 'url');
          showToast('Architecture diagram generated!', 'success');
        } else {
          throw new Error('Diagram failed');
        }
      });

    // Resolve all promises
    Promise.all([apiPromise, readmePromise, diagramPromise])
      .catch(err => {
        console.error(err);
        showToast('Documentation generation encountered an issue.', 'error');
      })
      .finally(() => {
        setGenerating(false);
      });
  };

  // Save Document to Database
  const saveDocumentToDB = (projectId, type, content, format = 'markdown') => {
    fetch(`${BACKEND_URL}/api/projects/${projectId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content, format })
    })
      .then(res => res.json())
      .then(() => {
        console.log(`Saved ${type} to database`);
      })
      .catch(err => console.error(`Error saving ${type} document:`, err));
  };

  // Copy to Clipboard
  const copyToClipboard = (type) => {
    const text = documents[type];
    if (!text) {
      showToast('No content to copy', 'warning');
      return;
    }

    navigator.clipboard.writeText(text).then(
      () => showToast('Markdown copied to clipboard!', 'success'),
      () => showToast('Failed to copy to clipboard', 'error')
    );
  };

  // Export Documentation
  const exportDoc = (type, format) => {
    const content = documents[type];
    if (!content) {
      showToast('No content to export', 'warning');
      return;
    }

    if (format === 'pdf') {
      showToast('Exporting PDF...', 'info');
      fetch(`${AI_SERVICE_URL}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, format: 'pdf' })
      })
        .then(res => {
          if (!res.ok) throw new Error('Export failed');
          return res.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `docforge_${type}_documentation.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          showToast('PDF exported successfully!', 'success');
        })
        .catch(err => {
          console.error(err);
          showToast('PDF export failed. Make sure wkhtmltopdf is installed.', 'error');
        });
    } else {
      // Export as Markdown
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `docforge_${type}_documentation.md`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      showToast('Markdown exported successfully!', 'success');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => {
    setDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div>
      {/* Toast HUD */}
      <div className="toast-container-custom">
        {toasts.map(toast => (
          <div key={toast.id} className="toast-custom">
            <div className="toast-custom-header">
              <span className="fw-bold">
                <i className="fas fa-hammer me-1 text-primary"></i> DocForge
              </span>
              <button className="btn-close btn-close-white" style={{ fontSize: '10px' }} onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}></button>
            </div>
            <div className="toast-custom-body">
              <i className={`fas ${toast.type === 'success' ? 'fa-check-circle text-success' : toast.type === 'error' ? 'fa-exclamation-circle text-danger' : toast.type === 'warning' ? 'fa-exclamation-triangle text-warning' : 'fa-info-circle text-primary'} me-2`}></i>
              {toast.message}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <nav className="navbar navbar-premium navbar-dark mb-4">
        <div className="container">
          <span className="navbar-brand">
            <i className="fas fa-hammer me-2 text-primary"></i>
            <strong>DocForge</strong> - AI Documentation Generator
          </span>
          <div className="d-flex align-items-center">
            <button id="themeToggle" className="btn btn-sm btn-outline-premium me-3" onClick={toggleTheme} title="Toggle Theme">
              <i id="themeIcon" className={`fas ${theme === 'dark' ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>
            <div className="text-secondary small">
              <i className="fas fa-robot text-primary me-1"></i> Powered by OpenAI
            </div>
          </div>
        </div>
      </nav>

      <div className="container mt-4">
        <div className="row">
          {/* Sidebar */}
          <div className="col-lg-4 col-md-5 mb-4">
            
            {/* Select Project Card */}
            <div className="card shadow-sm mb-3">
              <div className="card-header">
                <h5 className="card-title">
                  <i className="fas fa-folder-open text-primary me-2"></i>Select Project
                </h5>
              </div>
              <div className="card-body">
                <select 
                  id="projectSelect" 
                  className="form-select" 
                  value={currentProjectId || ''} 
                  onChange={(e) => setCurrentProjectId(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Project Configuration */}
            <div className="card shadow-sm mb-3">
              <div className="card-header">
                <h5 className="card-title">
                  <i className="fas fa-plus-circle text-primary me-2"></i>New Project
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label small text-secondary">Project Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="My Awesome Project"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small text-secondary">Description</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="Describe what your project does..."
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary-premium w-100" onClick={createProject}>
                  <i className="fas fa-plus-circle me-1"></i> Create Project
                </button>
              </div>
            </div>

            {/* File Upload Card */}
            <div className="card shadow-sm mb-3">
              <div className="card-header">
                <h5 className="card-title">
                  <i className="fas fa-upload text-primary me-2"></i>Upload Files
                </h5>
              </div>
              <div className="card-body">
                <div 
                  id="dropZone" 
                  className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <i className="fas fa-cloud-upload-alt fa-3x text-primary mb-2"></i>
                  <p className="mb-1 fw-bold">Drag & drop files here</p>
                  <p className="text-secondary small mb-0">or click to select</p>
                  <small className="text-muted d-block mt-2" style={{ fontSize: '10px' }}>PHP, Python, JS, TS, Java, Go, Rust</small>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    multiple 
                    style={{ display: 'none' }} 
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </div>
                
                {/* File List */}
                <div id="fileList" className="mt-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {uploadedFiles.length === 0 ? (
                    <div className="text-muted text-center py-2" style={{ fontSize: '13px' }}>No files uploaded yet</div>
                  ) : (
                    <div className="list-group">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                          <div className="text-truncate me-2" style={{ maxWidth: '80%' }}>
                            <i className="fas fa-file-code text-primary me-2"></i>
                            <span>{file.filename}</span>
                          </div>
                          <span className="badge bg-secondary rounded-pill" style={{ fontSize: '10px' }}>
                            {file.content.length} chars
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  className="btn btn-primary-premium w-100 mt-3" 
                  onClick={generateDocumentation}
                  disabled={generating || uploading || !currentProjectId || uploadedFiles.length === 0}
                >
                  {generating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic me-1"></i> Generate Documentation
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="card shadow-sm">
              <div className="card-body py-3">
                <div className="row text-center">
                  <div className="col-4 border-end border-secondary">
                    <h3 id="fileCount" className="fw-bold mb-0 text-primary">{uploadedFiles.length}</h3>
                    <small class="text-secondary" style={{ fontSize: '11px' }}>Files</small>
                  </div>
                  <div className="col-4 border-end border-secondary">
                    <h3 id="docCount" className="fw-bold mb-0 text-success">
                      {(documents.api ? 1 : 0) + (documents.readme ? 1 : 0) + (diagramUrl ? 1 : 0)}
                    </h3>
                    <small class="text-secondary" style={{ fontSize: '11px' }}>Docs</small>
                  </div>
                  <div className="col-4">
                    <h3 id="projectCount" className="fw-bold mb-0 text-info">{projects.length}</h3>
                    <small class="text-secondary" style={{ fontSize: '11px' }}>Projects</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-lg-8 col-md-7">
            {/* Active Project Panel */}
            {currentProject && (
              <div id="activeProjectPanel" className="card mb-3 p-3 shadow-sm">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="badge bg-secondary mb-1">Active Project</span>
                    <h4 className="mb-1 fw-bold text-white">{currentProject.name}</h4>
                    <p className="text-secondary mb-0 small">{currentProject.description || 'No description provided.'}</p>
                  </div>
                  <div>
                    <button className="btn btn-sm btn-outline-danger" onClick={deleteCurrentProject}>
                      <i className="fas fa-trash-alt me-1"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs & Content */}
            <div className="card shadow-sm">
              <div className="card-header p-0">
                <ul className="nav nav-tabs" id="docTabs">
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'api' ? 'active' : ''}`}
                      onClick={() => setActiveTab('api')}
                    >
                      <i className="fas fa-code me-1"></i> API Docs
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'readme' ? 'active' : ''}`}
                      onClick={() => setActiveTab('readme')}
                    >
                      <i className="fab fa-readme me-1"></i> README
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'diagram' ? 'active' : ''}`}
                      onClick={() => setActiveTab('diagram')}
                    >
                      <i className="fas fa-project-diagram me-1"></i> Architecture
                    </button>
                  </li>
                </ul>
              </div>
              <div className="card-body">
                <div className="tab-content">
                  
                  {/* API Tab */}
                  {activeTab === 'api' && (
                    <div className="tab-pane show active">
                      <div 
                        id="apiContent" 
                        className="doc-content p-4"
                        dangerouslySetInnerHTML={{
                          __html: documents.api 
                            ? marked.parse(documents.api) 
                            : `<div class="text-muted text-center py-5">
                                <i class="fas fa-book-open fa-3x mb-3 text-secondary"></i>
                                <p>${currentProjectId ? 'No API documentation generated yet.' : 'No project selected. Choose or create a project from the sidebar to view or generate documentation.'}</p>
                               </div>`
                        }}
                      />
                      {documents.api && (
                        <div id="apiActions" className="mt-3 text-end">
                          <button className="btn btn-sm btn-outline-premium me-2" onClick={() => copyToClipboard('api')}>
                            <i className="fas fa-copy me-1"></i> Copy MD
                          </button>
                          <button className="btn btn-sm btn-outline-premium me-2" onClick={() => exportDoc('api', 'markdown')}>
                            <i className="fab fa-markdown me-1"></i> Export MD
                          </button>
                          <button className="btn btn-sm btn-outline-premium" onClick={() => exportDoc('api', 'pdf')}>
                            <i className="fas fa-file-pdf me-1"></i> Export PDF
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* README Tab */}
                  {activeTab === 'readme' && (
                    <div className="tab-pane show active">
                      <div 
                        id="readmeContent" 
                        className="doc-content p-4"
                        dangerouslySetInnerHTML={{
                          __html: documents.readme 
                            ? marked.parse(documents.readme) 
                            : `<div class="text-muted text-center py-5">
                                <i class="fab fa-readme fa-3x mb-3 text-secondary"></i>
                                <p>${currentProjectId ? 'No README generated yet.' : 'No project selected. Choose or create a project from the sidebar to view or generate documentation.'}</p>
                               </div>`
                        }}
                      />
                      {documents.readme && (
                        <div id="readmeActions" className="mt-3 text-end">
                          <button className="btn btn-sm btn-outline-premium me-2" onClick={() => copyToClipboard('readme')}>
                            <i className="fas fa-copy me-1"></i> Copy MD
                          </button>
                          <button className="btn btn-sm btn-outline-premium me-2" onClick={() => exportDoc('readme', 'markdown')}>
                            <i className="fab fa-markdown me-1"></i> Export MD
                          </button>
                          <button className="btn btn-sm btn-outline-premium" onClick={() => exportDoc('readme', 'pdf')}>
                            <i className="fas fa-file-pdf me-1"></i> Export PDF
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Diagram Tab */}
                  {activeTab === 'diagram' && (
                    <div className="tab-pane show active">
                      <div id="diagramContent" className="doc-content p-4 d-flex align-items-center justify-content-center">
                        <div className="text-center w-100">
                          {diagramUrl ? (
                            <img 
                              id="architectureDiagram" 
                              src={diagramUrl} 
                              alt="Architecture Diagram" 
                              style={{ maxWidth: '100%', borderRadius: '12px', display: 'block', margin: '0 auto' }} 
                            />
                          ) : (
                            <div className="alert bg-dark text-secondary border border-secondary mb-0">
                              <i className="fas fa-info-circle me-1"></i> 
                              {currentProjectId ? 'Architecture diagram will appear here after generation' : 'No project selected'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
