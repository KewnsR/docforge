// DocForge Main Application
let currentProjectId = null;
let uploadedFiles = [];

// Initialize on page load
$(document).ready(function() {
    loadProjects();
    setupDragAndDrop();
    setupAutoRefresh();
});

// Create new project
function createProject() {
    const name = $('#projectName').val();
    const description = $('#projectDesc').val();
    
    if (!name) {
        showToast('Please enter a project name', 'warning');
        return;
    }
    
    $.ajax({
        url: 'http://localhost:8080/api/projects',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({name: name, description: description}),
        success: function(response) {
            currentProjectId = response.id;
            showToast(`Project "${name}" created successfully!`, 'success');
            loadProjects();
            updateStats();
            
            // Reset form
            $('#projectName').val('');
            $('#projectDesc').val('');
        },
        error: function() {
            showToast('Failed to create project', 'error');
        }
    });
}

// Handle file upload
function handleFiles(files) {
    if (!currentProjectId) {
        showToast('Please create a project first!', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('project_id', currentProjectId);
    
    for(let i = 0; i < files.length; i++) {
        formData.append('files[]', files[i]);
        uploadedFiles.push(files[i].name);
    }
    
    showToast(`Uploading ${files.length} file(s)...`, 'info');
    
    $.ajax({
        url: 'http://localhost:8080/api/upload.php',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            displayFileList();
            showToast(`${response.files.length} files uploaded successfully!`, 'success');
            updateStats();
        },
        error: function() {
            showToast('Upload failed. Please try again.', 'error');
        }
    });
}

// Display uploaded files
function displayFileList() {
    const fileListDiv = $('#fileList');
    if (uploadedFiles.length === 0) {
        fileListDiv.html('<div class="text-muted text-center">No files uploaded yet</div>');
        return;
    }
    
    let html = '<div class="list-group">';
    uploadedFiles.forEach(file => {
        html += `
            <div class="list-group-item list-group-item-action">
                <i class="fas fa-file-code text-primary"></i>
                <span class="ms-2">${file}</span>
            </div>
        `;
    });
    html += '</div>';
    fileListDiv.html(html);
}

// Generate all documentation
function generateDocumentation() {
    if (!currentProjectId) {
        showToast('Please create a project first!', 'warning');
        return;
    }
    
    if (uploadedFiles.length === 0) {
        showToast('Please upload some files first!', 'warning');
        return;
    }
    
    showToast('Generating documentation with AI... This may take a moment.', 'info');
    
    // Generate API documentation
    generateAPIDocs();
    
    // Generate README
    generateREADME();
    
    // Generate Architecture Diagram
    generateDiagram();
}

// Generate API documentation
function generateAPIDocs() {
    $.ajax({
        url: 'http://localhost:5000/generate/api',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            project_id: currentProjectId,
            files_content: uploadedFiles.map(f => ({filename: f, content: 'Sample content'}))
        }),
        success: function(response) {
            if (response.success) {
                const html = marked.parse(response.documentation);
                $('#apiContent').html(html);
                showToast('API documentation generated!', 'success');
            }
        },
        error: function() {
            $('#apiContent').html('<div class="alert alert-warning">Failed to generate API documentation. Please check your OpenAI API key.</div>');
        }
    });
}

// Generate README
function generateREADME() {
    $.ajax({
        url: 'http://localhost:5000/generate/readme',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            project_info: {
                name: $('#projectName').val() || 'DocForge Project',
                description: $('#projectDesc').val() || 'Generated with DocForge'
            },
            files_summary: `Project contains ${uploadedFiles.length} files`
        }),
        success: function(response) {
            if (response.success) {
                const html = marked.parse(response.readme);
                $('#readmeContent').html(html);
                showToast('README generated!', 'success');
            }
        },
        error: function() {
            $('#readmeContent').html('<div class="alert alert-warning">Failed to generate README. Please check your configuration.</div>');
        }
    });
}

// Generate architecture diagram
function generateDiagram() {
    $.ajax({
        url: 'http://localhost:5000/generate/diagram',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            code_structure: {
                files: uploadedFiles,
                project_name: $('#projectName').val()
            }
        }),
        success: function(response) {
            if (response.success) {
                $('#architectureDiagram').attr('src', response.diagram_url).show();
                $('#diagramContent .alert').hide();
                showToast('Architecture diagram generated!', 'success');
            }
        },
        error: function() {
            $('#diagramContent .alert').removeClass('alert-info').addClass('alert-warning')
                .html('<i class="fas fa-exclamation-triangle"></i> Diagram generation requires Graphviz. Install with: apt-get install graphviz');
        }
    });
}

// Export documentation
function exportDoc(type, format) {
    const content = type === 'api' ? $('#apiContent').text() : $('#readmeContent').text();
    
    if (!content || content.trim() === '') {
        showToast('No content to export', 'warning');
        return;
    }
    
    if (format === 'pdf') {
        // For PDF, we'll use the backend service
        $.ajax({
            url: 'http://localhost:5000/export',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({content: content, format: 'pdf'}),
            xhrFields: {
                responseType: 'blob'
            },
            success: function(blob) {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `docforge_${type}_documentation.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                showToast('PDF exported successfully!', 'success');
            },
            error: function() {
                showToast('PDF export failed', 'error');
            }
        });
    } else {
        // Export as Markdown
        const blob = new Blob([content], {type: 'text/markdown'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `docforge_${type}_documentation.md`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        showToast('Markdown exported successfully!', 'success');
    }
}

// Load all projects
function loadProjects() {
    $.ajax({
        url: 'http://localhost:8080/api/projects',
        method: 'GET',
        success: function(projects) {
            $('#projectCount').text(projects.length);
        }
    });
}

// Update statistics
function updateStats() {
    $('#fileCount').text(uploadedFiles.length);
}

// Setup drag and drop
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        handleFiles(files);
    });
}

// Auto refresh stats
function setupAutoRefresh() {
    setInterval(() => {
        if (currentProjectId) {
            updateStats();
        }
    }, 30000);
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = new bootstrap.Toast($('#liveToast')[0]);
    const toastBody = $('#toastMessage');
    
    let icon = 'fas fa-info-circle';
    if (type === 'success') icon = 'fas fa-check-circle';
    if (type === 'error') icon = 'fas fa-exclamation-circle';
    if (type === 'warning') icon = 'fas fa-exclamation-triangle';
    
    toastBody.html(`<i class="${icon} me-2"></i>${message}`);
    toast.show();
}

// Export global functions
window.createProject = createProject;
window.handleFiles = handleFiles;
window.generateDocumentation = generateDocumentation;
window.exportDoc = exportDoc;