import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { marked } from 'marked';
import ArchitectureFlow from './ArchitectureFlow.jsx';

function WorkspaceDashboard({
  currentProjectId,
  currentProject,
  uploadedFiles,
  documents,
  activeTab,
  generating,
  fileSearchQuery,
  setFileSearchQuery,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  user,
  fileInputRef,
  uploading,
  showToast,
  handleFiles,
  deleteFile,
  generateDocumentation,
  copyToClipboard,
  exportDoc,
  generateDocFix,
  deleteCurrentProject,
  handleCreateProjectBtnClick,
  docHealthScore,
  docHealthSuggestions,
  healthLoading,
  setActiveTab,
  setSelectedFileInspector,
  projects,
  setCurrentProjectId,
  triggerAuthPrompt,
}) {
  const missingDocumentTypes = ['api', 'readme', 'architecture'].filter(type => !documents[type]);
  const activeDocumentMissing = !documents[activeTab];
  const activeDocumentLabels = {
    api: 'API Docs',
    readme: 'README',
    architecture: 'Architecture',
  };
  const generationLabel = missingDocumentTypes.length === 0 ? 'Generate Again' : 'Generate Missing';
  const activeGenerationLabel = activeDocumentMissing ? 'Generate' : 'Regenerate';

  return (
    // Main Workspace
      (
        <div className="main-layout d-flex">
          {/* Sidebar */}
          <aside className="sidebar-section px-3 py-4 d-flex flex-column gap-3 overflow-auto">
            {/* Projects Card */}
            <div className="project-control-card">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="sidebar-title m-0">Projects</h5>
                <button 
                  onClick={handleCreateProjectBtnClick} 
                  className="btn-new-project" 
                  title="Create Project"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>

              <div className="project-selector-wrapper">
                <select 
                  className="project-select form-select"
                  value={currentProjectId || ''} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setCurrentProjectId(val ? Number(val) : null);
                  }}
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Project Details Card */}
            <AnimatePresence>
              {currentProject && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="project-details-card d-flex flex-column gap-3"
                >
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <h6 className="project-detail-name m-0 text-truncate">{currentProject.name}</h6>
                      <button onClick={deleteCurrentProject} className="btn-delete-project" title="Delete Project">
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                    <p className="project-detail-desc text-muted m-0">{currentProject.description}</p>
                  </div>
                  
                  <div className="project-stats text-muted">
                    <div className="d-flex justify-content-between py-1 border-bottom">
                      <span>Files uploaded:</span>
                      <span className="fw-bold">{uploadedFiles.length}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1">
                      <span>Generated docs:</span>
                      <span className="fw-bold">
                        {((documents.api ? 1 : 0) + (documents.readme ? 1 : 0) + (documents.architecture ? 1 : 0))}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Doc Health Score Card */}
            <AnimatePresence>
              {currentProject && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="project-details-card d-flex flex-column gap-3"
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className="position-relative d-inline-flex">
                      <svg className="health-ring-svg" width="60" height="60">
                        <circle className="health-ring-bg" cx="30" cy="30" r="26" />
                        <circle 
                          className="health-ring-indicator" 
                          cx="30" 
                          cy="30" 
                          r="26" 
                          stroke={
                            docHealthScore >= 80 ? 'var(--success)' : 
                            docHealthScore >= 50 ? 'var(--warning)' : 
                            'var(--error)'
                          }
                          strokeDasharray="163.3"
                          strokeDashoffset={163.3 - (163.3 * docHealthScore) / 100}
                        />
                      </svg>
                      <div className="position-absolute top-50 start-50 translate-middle fw-bold fs-7" style={{ transform: 'translate(-50%, -50%)', letterSpacing: '-0.02em' }}>
                        {healthLoading ? (
                          <span className="spinner-border spinner-border-sm text-primary" style={{ width: '12px', height: '12px', borderWidth: '2px' }} role="status"></span>
                        ) : (
                          `${docHealthScore}%`
                        )}
                      </div>
                    </div>
                    <div>
                      <h6 className="sidebar-title m-0">Documentation Health</h6>
                      <span className="fs-7 text-muted fw-semibold">
                        {docHealthScore >= 80 ? 'Excellent Coverage' : 
                         docHealthScore >= 50 ? 'Needs Attention' : 
                         'Critical Deficit'}
                      </span>
                    </div>
                  </div>

                  <div className="doc-suggestions-feed">
                    {docHealthSuggestions.length === 0 ? (
                      <p className="fs-7 text-muted m-0">No suggestions available.</p>
                    ) : (
                      docHealthSuggestions.map((suggestion, idx) => (
                        <div key={idx} className="doc-suggestion-item border-bottom py-2.5 d-flex justify-content-between align-items-start gap-2">
                          <span className="fs-7 text-secondary lh-sm">{suggestion}</span>
                          {uploadedFiles.length > 0 && user && (
                            <button 
                              onClick={() => generateDocFix(suggestion)} 
                              className="btn-fix-issue" 
                              title="Generate Fix"
                            >
                              Fix
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>

          {/* Main Content Area */}
          <main className="content-container grow px-3 pt-2 pb-4">
            <AnimatePresence mode="wait">
              {!currentProjectId ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="empty-state-card text-center d-flex flex-column align-items-center justify-content-center py-5"
                >
                  <div className="empty-icon-container mb-3">
                    <i className="fa-solid fa-folder-open text-muted"></i>
                  </div>
                  <h4>No Active Project Selected</h4>
                  <p className="text-muted max-w-sm mb-4">
                    Please select an existing project from the sidebar dropdown or create a new project to start uploading source files and generating technical documentation.
                  </p>
                  <button onClick={handleCreateProjectBtnClick} className="btn btn-primary">
                    <i className="fa-solid fa-plus me-2"></i>Create Project
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="row g-4 h-100 align-items-stretch"
                >
              {/* Left Column: File Manager */}
              <div className="col-12 col-xl-3 d-flex flex-column">
                <div className="dashboard-card grow d-flex flex-column p-3 animate-delay-1">
                  <h5 className="card-section-title mb-3">
                    <i className="fa-solid fa-file-code me-2 text-primary"></i>Source Code Files
                  </h5>

                  {/* Drag and Drop Box */}
                  <div 
                    className={`dropzone-area text-center py-4 px-3 mb-3 d-flex flex-column align-items-center justify-content-center ${dragOver ? 'dragover' : ''}`}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => {
                      if (!user) {
                        triggerAuthPrompt('Please sign in to upload files.');
                      } else if (currentProjectId === 'demo') {
                        showToast('Files cannot be uploaded to the demo project. Please create a new project first!', 'warning');
                      } else {
                        fileInputRef.current.click();
                      }
                    }}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={(e) => handleFiles(e.target.files)} 
                      multiple 
                      className="d-none" 
                    />
                    <div className="dropzone-icon mb-2">
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                    </div>
                    <span className="dropzone-text fw-semibold text-muted">
                      {uploading ? 'Reading files...' : 'Drag & Drop files or click to browse'}
                    </span>
                    <span className="dropzone-subtext text-muted mt-1">.py, .js, .jsx, .ts, .tsx, .php</span>
                  </div>

                  {/* File Search Input */}
                  {uploadedFiles.length > 0 && (
                    <div className="input-group input-group-sm mb-3">
                      <span className="input-group-text bg-panel border-end-0 text-muted">
                        <i className="fa-solid fa-magnifying-glass fs-7"></i>
                      </span>
                      <input 
                        type="text" 
                        className="form-control form-control-sm bg-panel border-start-0 ps-0 fs-7" 
                        placeholder="Search workspace files..."
                        value={fileSearchQuery}
                        onChange={(e) => setFileSearchQuery(e.target.value)}
                      />
                    </div>
                  )}

                  {/* File List */}
                  <div className="file-list-wrapper grow overflow-auto" style={{ maxHeight: '320px' }}>
                    {uploadedFiles.length === 0 ? (
                      <div className="no-files-placeholder text-center text-muted py-5">
                        <i className="fa-solid fa-inbox d-block fs-3 mb-2"></i>
                        <span>No files uploaded yet</span>
                      </div>
                    ) : (
                      <div className="file-items-container">
                        <AnimatePresence initial={false}>
                          {uploadedFiles
                            .filter(f => f.filename.toLowerCase().includes(fileSearchQuery.toLowerCase()))
                            .map((file) => {
                              const ext = file.filename.split('.').pop();
                              let iconClass = 'fa-file-lines';
                              if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) iconClass = 'fa-js text-warning';
                              if (ext === 'py') iconClass = 'fa-python text-info';
                              if (ext === 'php') iconClass = 'fa-php text-primary';

                              return (
                                <motion.div 
                                  key={file.filename}
                                  initial={{ opacity: 0, x: -12 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 12 }}
                                  layout
                                  onClick={() => setSelectedFileInspector(file)}
                                  className="file-item-row d-flex align-items-center justify-content-between py-2 px-3 mb-2 border rounded"
                                  title="Click to inspect source code"
                                >
                                  <div className="d-flex align-items-center text-truncate me-2">
                                    <i className={`fa-solid ${iconClass} me-2.5`}></i>
                                    <span className="file-item-name text-truncate fw-medium fs-7">{file.filename}</span>
                                  </div>
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="file-item-size text-muted fs-7">{Math.round((file.content ? file.content.length : 0) / 1024 * 10) / 10} KB</span>
                                    <button 
                                      type="button" 
                                      onClick={() => setSelectedFileInspector(file)} 
                                      className="btn btn-sm btn-outline-primary p-1 px-2 border-0"
                                      title="Inspect Source Code"
                                    >
                                      <i className="fa-solid fa-eye fs-7"></i>
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={(e) => { e.stopPropagation(); deleteFile(file.filename); }} 
                                      className="btn btn-sm btn-outline-danger p-1 px-2 border-0"
                                      title="Delete File"
                                    >
                                      <i className="fa-solid fa-trash fs-7"></i>
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: AI Generator & Workspace Displays */}
              <div className="col-12 col-xl-9 d-flex flex-column">
                <div className="dashboard-card grow d-flex flex-column p-3 animate-delay-2">
                  {/* Tabs & Actions */}
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 border-bottom pb-3 mb-3">
                    <div className="custom-tabs-container d-flex gap-2">
                      <button 
                        onClick={() => setActiveTab('api')} 
                        className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
                      >
                        <i className="fa-solid fa-code me-2"></i>API Docs
                      </button>
                      <button 
                        onClick={() => setActiveTab('readme')} 
                        className={`tab-btn ${activeTab === 'readme' ? 'active' : ''}`}
                      >
                        <i className="fa-solid fa-book-open me-2"></i>README.md
                      </button>
                      <button 
                        onClick={() => setActiveTab('architecture')} 
                        className={`tab-btn ${activeTab === 'architecture' ? 'active' : ''}`}
                      >
                        <i className="fa-solid fa-diagram-project me-2"></i>Architecture
                      </button>
                    </div>

                    <div className="tab-actions d-flex gap-2">
                      {uploadedFiles.length > 0 && (
                        <button 
                          onClick={() => generateDocumentation(missingDocumentTypes.length === 0 ? 'all' : null)}
                          className="btn btn-primary"
                          disabled={generating}
                        >
                          {generating ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Generating...
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-wand-magic-sparkles me-2"></i>{generationLabel}
                            </>
                          )}
                        </button>
                      )}

                      {uploadedFiles.length > 0 && (
                        <button
                          onClick={() => generateDocumentation(activeTab)}
                          className="btn btn-secondary"
                          disabled={generating || uploadedFiles.length === 0}
                        >
                          <i className="fa-solid fa-file-circle-plus me-2"></i>
                          {activeGenerationLabel} {activeDocumentLabels[activeTab]}
                        </button>
                      )}

                      {activeTab !== 'architecture' && documents[activeTab] && (
                        <>
                          <button onClick={copyToClipboard} className="btn btn-secondary" title="Copy Markdown">
                            <i className="fa-solid fa-copy"></i>
                          </button>
                          <button onClick={() => exportDoc('markdown')} className="btn btn-secondary" title="Export Markdown">
                            <i className="fa-solid fa-file-arrow-down"></i>
                          </button>
                          <button onClick={() => exportDoc('pdf')} className="btn btn-secondary" title="Export PDF">
                            <i className="fa-solid fa-file-pdf"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Main Document Output Area */}
                  <div className="document-output-wrapper grow">
                    <AnimatePresence mode="wait">
                      {activeTab === 'architecture' ? (
                        /* Diagram Panel */
                        <motion.div
                          key="architecture"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.22 }}
                          className="diagram-display-panel h-100 d-flex flex-column align-items-center justify-content-center border rounded p-3 bg-light-panel overflow-auto"
                        >
                          {documents.architecture ? (
                            documents.architecture.startsWith('IMAGE_URL:') ? (
                              <div className="diagram-image-container text-center">
                                <img src={documents.architecture.substring(10)} alt="Architecture Diagram" className="img-fluid rounded border shadow-sm" style={{ maxHeight: '420px', objectFit: 'contain' }} />
                                <div className="mt-3">
                                  <a href={documents.architecture.substring(10)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary">
                                    <i className="fa-solid fa-up-right-from-square me-2"></i>Open in New Tab
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <ArchitectureFlow content={documents.architecture} />
                            )
                          ) : (
                            <div className="no-docs-placeholder text-center text-muted py-5">
                              <i className="fa-solid fa-network-wired d-block fs-3 mb-2"></i>
                              <span>No diagram generated yet. Click "AI Generate" to render structure.</span>
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        /* Document Markdown Panel */
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.22 }}
                          className="markdown-render-panel h-100 border rounded p-4 overflow-auto bg-light-panel"
                        >
                          {documents[activeTab] ? (
                            <div 
                              className="markdown-body" 
                              dangerouslySetInnerHTML={{ __html: marked.parse(documents[activeTab]) }} 
                            />
                          ) : (
                            <div className="no-docs-placeholder text-center text-muted py-5 d-flex flex-column align-items-center justify-content-center h-100">
                              <i className="fa-solid fa-pen-nib d-block fs-3 mb-2"></i>
                              <span>No documentation generated yet.</span>
                              <span className="text-muted fs-7 mt-1">Upload code files and click "AI Generate" to begin.</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      </div>
      )
  );
}

export default WorkspaceDashboard;
