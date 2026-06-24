import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';

// Resolve Backend and AI service URLs dynamically
const HOST_IP = window.location.hostname || 'localhost';
const BACKEND_URL = `http://${HOST_IP}:8080`;
const AI_SERVICE_URL = `http://${HOST_IP}:5000`;

// Mock Demo Data for Guest Mode
const DEMO_PROJECT = {
  id: 'demo',
  name: 'Welcome & Demo Project',
  description: 'This is a read-only local demo project. Log in or create an account to create your own projects, upload files, and run AI generation!'
};

const DEMO_FILES = [
  {
    filename: 'main.py',
    content: `import math\n\nclass Calculator:\n    def add(self, a, b):\n        \"\"\"Adds two numbers together\"\"\"\n        return a + b\n    \n    def sqrt(self, x):\n        \"\"\"Returns the square root of a number\"\"\"\n        return math.sqrt(x)`
  },
  {
    filename: 'api.js',
    content: `import axios from 'axios';\n\nexport const fetchWeather = async (city) => {\n  // Fetches weather data for a specific city\n  const response = await axios.get(\`/api/weather?city=\${city}\`);\n  return response.data;\n};`
  }
];

const DEMO_DOCUMENTS = {
  api: `# API Documentation - Demo Project\n\nThis is a preview of the generated API documentation for the demo project.\n\n## Python module: \`main.py\`\n### Class: \`Calculator\`\nHelper class for basic arithmetic operations.\n\n#### Method: \`add(self, a, b)\`\n*   **Arguments:** \`a\` (number), \`b\` (number)\n*   **Returns:** Sum of the two parameters.\n\n#### Method: \`sqrt(self, x)\`\n*   **Arguments:** \`x\` (number)\n*   **Returns:** Square root of \`x\`.\n\n---\n\n## JavaScript module: \`api.js\`\n### Function: \`fetchWeather(city)\`\nFetches current weather information from the system endpoint.\n*   **Arguments:** \`city\` (string)\n*   **Returns:** Promise resolving to weather object.`,
  readme: `# Demo Project README\n\nWelcome to the Demo Project! This is a simple preview showing how Dokari structures your generated document.\n\n## Features\n- Mathematical utility classes in Python.\n- Weather API integration functions in ES6 JavaScript.\n\n## Setup Instructions\n1. Clone the repository.\n2. Install dependencies:\n   \`\`\`bash\n   npm install\n   pip install -r requirements.txt\n   \`\`\`\n3. Run test suites.`,
  architecture: ''
};

const DEMO_HEALTH = {
  score: 75,
  suggestions: [
    'Add type signatures to Calculator methods in main.py',
    'Add parameter details to api.js:fetchWeather'
  ]
};

// Local Q&A Knowledge Base for Dokari Help Chatbot
const DOKARI_KNOWLEDGE = [
  {
    keywords: ["what is", "about", "website", "system", "dokari", "purpose", "info", "general"],
    answer: "Dokari is an AI-powered technical documentation assistant. It analyzes your codebase to compute documentation health scores, generates comprehensive API docs and READMEs, builds architecture diagrams, and offers interactive code suggestions without using emojis or unnecessary clutter."
  },
  {
    keywords: ["help", "how to use", "how does this work", "guide", "tutorial", "instructions", "workspace", "dashboard", "features", "use"],
    answer: "You can use Dokari to analyze your code and generate documentation. In your workspace: 1. Upload source files (Python, JS, PHP, etc.) using the 'Upload Files' button. 2. View your 'Doc Health' rating and click 'Fix' on suggestions to copy generated docstrings. 3. Navigate to the 'Generate' tab to build your README.md or API docs, which can be exported to PDF."
  },
  {
    keywords: ["upload", "add", "file", "files", "source", "code", "import", "projects", "create project", "new project"],
    answer: "To document a project, navigate to your workspace and use the 'Upload Files' button. You can upload multiple code files (Python, PHP, JavaScript, etc.). Once uploaded, Dokari will scan them to calculate your Health Score and generate documentation. If you want to create multiple projects, click the project selector in the top-left and click 'New Project'."
  },
  {
    keywords: ["health", "score", "gauge", "rating", "analyzer", "quality", "metric", "measurement", "percent", "percentage"],
    answer: "The Dokari Health Score measures documentation coverage (comment density, docstring presence, and clarity) on a scale of 0 to 100. Check the 'Doc Health' sidebar to see specific suggestions for improvement."
  },
  {
    keywords: ["fix", "suggestion", "apply docstring", "generate fix", "recommendation", "docstring", "comment", "proposal", "improve"],
    answer: "If the Health Analyzer suggests improvements (e.g., 'Add class docstring'), click the 'Fix' button next to that suggestion. Dokari will generate a copyable, professional docstring or comment block to paste into your code."
  },
  {
    keywords: ["readme", "read me", "generate readme", "documentation", "doc", "docs"],
    answer: "To generate a README.md, upload your files in the workspace, verify the files summary, and click 'Generate README.md'. You will receive a complete, standard markdown README tailored to your project structure."
  },
  {
    keywords: ["api doc", "api documentation", "generate api", "route", "endpoints", "endpoint"],
    answer: "Upload your code files containing routes or functions, and click 'Generate API Docs'. Dokari will analyze the arguments, methods, and returns to produce a standard, comprehensive API specification in markdown."
  },
  {
    keywords: ["pdf", "export", "download", "save"],
    answer: "Once any documentation (API Docs or README) is generated, you can click 'Export PDF' at the bottom of the editor. This triggers a server-side PDF conversion and starts a download of your file."
  },
  {
    keywords: ["register", "login", "sign in", "account", "signup", "sign up", "log in", "auth", "username", "password", "session", "user"],
    answer: "You can click the 'Sign In' or 'Register' button on the navbar. Having an account allows you to create private projects, persist files, and manage your custom workspace. Write actions are locked in guest mode until you register."
  },
  {
    keywords: ["guest", "demo", "view only", "read only", "preview", "anonymous", "signin", "login"],
    answer: "Dokari provides a preloaded 'Welcome & Demo Project' in Guest Mode so you can preview the UI, explore features, view health gauges, and chat. To upload custom files or create new projects, please sign in or register."
  },
  {
    keywords: ["diagram", "architecture", "visualize", "map", "dependency", "dependencies", "imports", "flowchart", "relation", "structure"],
    answer: "You can generate an architecture diagram of your codebase. Dokari parses files to map imports, classes, and helper dependencies, generating a clean PNG architecture diagram for your documentation."
  }
];

const findLocalAnswer = (question) => {
  const query = question.toLowerCase().trim();
  
  // 1. Handle common greetings
  const greetings = ["hello", "hi", "hey", "good morning", "good afternoon", "yo", "greetings"];
  if (greetings.some(g => query === g || query.startsWith(g + " ") || query.endsWith(" " + g))) {
    return "Hello! I am the Dokari Companion. How can I assist you with using the Dokari documentation platform today? You can ask me how to upload files, generate READMEs, verify API specifications, or check documentation health.";
  }

  // 2. Handle thank you / compliments
  const compliments = ["thank you", "thanks", "awesome", "great", "cool", "perfect", "good job"];
  if (compliments.some(c => query.includes(c))) {
    return "You're very welcome! Please let me know if you have any other questions about how Dokari works or if you need assistance generating documentation.";
  }

  // 3. Score each knowledge item based on keyword matches
  let bestMatch = null;
  let highestScore = 0;

  for (const item of DOKARI_KNOWLEDGE) {
    let score = 0;
    for (const kw of item.keywords) {
      if (query.includes(kw)) {
        // Higher weight if the keyword is matched as a full word boundary
        const regex = new RegExp(`\\b${kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (regex.test(query)) {
          score += 3;
        } else {
          score += 1;
        }
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && highestScore > 0) {
    return bestMatch.answer;
  }

  // 4. Fallback for non-related topics
  return "I noticed your question might be about a topic outside the scope of this platform. As the Dokari Companion, I specialize in help queries about Dokari itself! \n\nDokari is an automated technical documentation workspace. It lets you upload source files, tracks code documentation health, and generates professional API specifications, README.md files, and architecture diagrams.\n\nCould you please ask me about one of these features or how to use the workspace?";
};

export default function App() {
  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Auth States
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // App States
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState('demo');
  const [currentProject, setCurrentProject] = useState(DEMO_PROJECT);
  const [uploadedFiles, setUploadedFiles] = useState(DEMO_FILES);
  const [documents, setDocuments] = useState(DEMO_DOCUMENTS);
  const [diagramUrl, setDiagramUrl] = useState('');
  const [activeTab, setActiveTab] = useState('api');
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);

  // AI Chatbot States
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello! I am the Dokari Companion. Ask me any question about how to use the Dokari platform, upload files, check documentation health, or generate files.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Documentation Health States
  const [docHealthScore, setDocHealthScore] = useState(DEMO_HEALTH.score);
  const [docHealthSuggestions, setDocHealthSuggestions] = useState(DEMO_HEALTH.suggestions);
  const [healthLoading, setHealthLoading] = useState(false);
  const [docFixProposal, setDocFixProposal] = useState('');
  const [selectedFixSuggestion, setSelectedFixSuggestion] = useState('');
  const [showFixModal, setShowFixModal] = useState(false);
  const [fixingLoading, setFixingLoading] = useState(false);

  // New Project Form State
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

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

  // Load projects list on startup / when user changes
  useEffect(() => {
    if (user) {
      loadProjects();
      setCurrentProjectId(null);
    } else {
      setProjects([DEMO_PROJECT]);
      setCurrentProjectId('demo');
      setCurrentProject(DEMO_PROJECT);
      setUploadedFiles(DEMO_FILES);
      setDocuments(DEMO_DOCUMENTS);
      setDiagramUrl('');
      setDocHealthScore(DEMO_HEALTH.score);
      setDocHealthSuggestions(DEMO_HEALTH.suggestions);
      setChatMessages([
        { sender: 'ai', text: 'Hello! I am the Dokari Companion. Ask me any question about how to use the Dokari platform, upload files, check documentation health, or generate files.' }
      ]);
    }
  }, [user]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Handle Loading files & documents when project changes
  useEffect(() => {
    if (!currentProjectId) {
      setCurrentProject(null);
      setUploadedFiles([]);
      setDocuments({ api: '', readme: '' });
      setDiagramUrl('');
      setDocHealthScore(0);
      setDocHealthSuggestions([]);
      return;
    }

    if (currentProjectId === 'demo') {
      setCurrentProject(DEMO_PROJECT);
      setUploadedFiles(DEMO_FILES);
      setDocuments(DEMO_DOCUMENTS);
      setDiagramUrl('');
      setDocHealthScore(DEMO_HEALTH.score);
      setDocHealthSuggestions(DEMO_HEALTH.suggestions);
      setChatMessages([
        { sender: 'ai', text: 'Hello! I am the Dokari Companion. Ask me any question about how to use the Dokari platform, upload files, check documentation health, or generate files.' }
      ]);
      return;
    }

    if (!user) return;

    const headers = {
      'Authorization': String(user.id)
    };

    // 1. Fetch Project Details
    fetch(`${BACKEND_URL}/api/projects/${currentProjectId}`, { headers })
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
    fetch(`${BACKEND_URL}/api/projects/${currentProjectId}/files`, { headers })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load files');
        return res.json();
      })
      .then(files => {
        const mapped = files.map(f => ({
          filename: f.filename,
          content: f.content || ''
        }));
        setUploadedFiles(mapped);
        fetchDocHealth(mapped);
      })
      .catch(err => {
        console.error(err);
        showToast('Failed to load project files', 'error');
      });

    // 3. Fetch Project Documents
    fetch(`${BACKEND_URL}/api/projects/${currentProjectId}/documents`, { headers })
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
  }, [currentProjectId, user]);

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

  // Trigger Auth modal opening with a message
  const triggerAuthPrompt = (message = 'Authentication required to use this feature.') => {
    showToast(message, 'warning');
    setAuthMode('login');
    setShowAuthModal(true);
  };

  // Handle Authentication (Login / Signup)
  const handleAuth = (e) => {
    e.preventDefault();
    if (!authUsername.trim() || !authPassword.trim()) {
      showToast('Please fill out all fields', 'warning');
      return;
    }

    setAuthLoading(true);
    const endpoint = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
    
    fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: authUsername, password: authPassword })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || 'Authentication failed'); });
        }
        return res.json();
      })
      .then(data => {
        setAuthLoading(false);
        if (authMode === 'signup') {
          showToast('Registration successful! Please login.', 'success');
          setAuthMode('login');
          setAuthPassword('');
        } else {
          showToast(`Welcome back, ${data.username}!`, 'success');
          const userData = { id: data.id, username: data.username };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          setShowAuthModal(false);
          setAuthUsername('');
          setAuthPassword('');
        }
      })
      .catch(err => {
        setAuthLoading(false);
        console.error(err);
        showToast(err.message || 'Authentication error', 'error');
      });
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentProjectId('demo');
    localStorage.removeItem('user');
    showToast('Logged out successfully', 'info');
  };

  // Load Projects from Database
  const loadProjects = () => {
    if (!user) return;
    fetch(`${BACKEND_URL}/api/projects`, {
      headers: { 'Authorization': String(user.id) }
    })
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
          showToast(`Unable to connect to PHP backend.`, 'error');
        }
      });
  };

  // Create Project
  const createProject = (e) => {
    e.preventDefault();
    if (!user) {
      triggerAuthPrompt('Please sign in or register to create custom projects.');
      return;
    }

    if (!newProjectName.trim()) {
      showToast('Please enter a project name', 'warning');
      return;
    }

    fetch(`${BACKEND_URL}/api/projects`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': String(user.id)
      },
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
        setShowNewProjectModal(false);
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
    if (currentProjectId === 'demo') {
      showToast('The demo project cannot be deleted.', 'warning');
      return;
    }
    if (!user) {
      triggerAuthPrompt('Please sign in to manage projects.');
      return;
    }

    if (!currentProjectId || !currentProject) return;

    if (!confirm(`Are you sure you want to delete project "${currentProject.name}"? This will permanently delete all uploaded files and generated documents.`)) {
      return;
    }

    fetch(`${BACKEND_URL}/api/projects/${currentProjectId}`, {
      method: 'DELETE',
      headers: { 'Authorization': String(user.id) }
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

  // Fetch Doc Health Score & Suggestions from Python AI Service
  const fetchDocHealth = (filesList) => {
    if (!filesList || filesList.length === 0) {
      setDocHealthScore(0);
      setDocHealthSuggestions(['No files uploaded yet. Upload files to calculate your health score.']);
      return;
    }

    setHealthLoading(true);
    fetch(`${AI_SERVICE_URL}/generate/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files_content: filesList })
    })
      .then(res => {
        if (!res.ok) throw new Error('Health check failed');
        return res.json();
      })
      .then(data => {
        setDocHealthScore(data.score);
        setDocHealthSuggestions(data.suggestions);
        setHealthLoading(false);
      })
      .catch(err => {
        console.error(err);
        setDocHealthScore(50);
        setDocHealthSuggestions(['Failed to run documentation static analysis.']);
        setHealthLoading(false);
      });
  };

  // Handle local File Reading & DB Upload
  const handleFiles = (filesList) => {
    if (!user) {
      triggerAuthPrompt('Please sign in to upload your project files.');
      return;
    }
    if (!currentProjectId || currentProjectId === 'demo') {
      showToast('Please select or create a custom project first!', 'warning');
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
    if (!user) return;
    showToast('Uploading files to database...', 'info');

    fetch(`${BACKEND_URL}/api/upload.php`, {
      method: 'POST',
      headers: { 'Authorization': String(user.id) },
      body: formData
    })
      .then(res => {
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
      })
      .then(response => {
        // Merge files in state without duplicate filenames
        let newFilesList = [];
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
          newFilesList = merged;
          return merged;
        });

        showToast(`${response.files.length} files uploaded successfully!`, 'success');
        setUploading(false);
        // Refresh health score
        fetchDocHealth(newFilesList);
      })
      .catch(err => {
        console.error(err);
        showToast('Upload failed. Please try again.', 'error');
        setUploading(false);
      });
  };

  // Generate Documentation
  const generateDocumentation = () => {
    if (!user) {
      triggerAuthPrompt('Please sign in or sign up to run AI generation.');
      return;
    }
    if (!currentProjectId || currentProjectId === 'demo') {
      showToast('Please select or create a custom project first!', 'warning');
      return;
    }
    if (uploadedFiles.length === 0) {
      showToast('Please upload some source files first!', 'warning');
      return;
    }

    setGenerating(true);
    showToast('AI is generating documentation...', 'info');

    const filesContentArray = uploadedFiles.map(f => ({
      name: f.filename,
      content: f.content
    }));

    if (activeTab === 'api') {
      fetch(`${AI_SERVICE_URL}/generate/api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: currentProjectId, files_content: filesContentArray })
      })
        .then(res => {
          if (!res.ok) throw new Error('Generation failed');
          return res.json();
        })
        .then(data => {
          const mdContent = data.documentation;
          setDocuments(prev => ({ ...prev, api: mdContent }));
          return saveDocToDB('api', mdContent);
        })
        .catch(err => {
          console.error(err);
          showToast('Failed to generate API docs.', 'error');
          setGenerating(false);
        });
    } else if (activeTab === 'readme') {
      fetch(`${AI_SERVICE_URL}/generate/readme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_info: { name: currentProject.name, description: currentProject.description },
          files_content: filesContentArray
        })
      })
        .then(res => {
          if (!res.ok) throw new Error('Generation failed');
          return res.json();
        })
        .then(data => {
          const mdContent = data.readme;
          setDocuments(prev => ({ ...prev, readme: mdContent }));
          return saveDocToDB('readme', mdContent);
        })
        .catch(err => {
          console.error(err);
          showToast('Failed to generate README.', 'error');
          setGenerating(false);
        });
    } else if (activeTab === 'architecture') {
      const code_structure = {
        project_name: currentProject.name,
        files: uploadedFiles.map(f => ({
          filename: f.filename,
          content: f.content
        }))
      };

      fetch(`${AI_SERVICE_URL}/generate/diagram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code_structure })
      })
        .then(res => {
          if (!res.ok) throw new Error('Diagram generation failed');
          return res.json();
        })
        .then(data => {
          const url = data.diagram_url.replace('localhost', HOST_IP);
          setDiagramUrl(url);
          return saveDocToDB('architecture', url);
        })
        .catch(err => {
          console.error(err);
          showToast('Failed to generate Architecture Diagram.', 'error');
          setGenerating(false);
        });
    }
  };

  // Save generated document to database
  const saveDocToDB = (type, content) => {
    if (!user) return;
    return fetch(`${BACKEND_URL}/api/projects/${currentProjectId}/documents`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': String(user.id)
      },
      body: JSON.stringify({ type, content, format: 'markdown' })
    })
      .then(res => {
        if (!res.ok) throw new Error('Save failed');
        return res.json();
      })
      .then(() => {
        showToast('Documentation saved to project database!', 'success');
        setGenerating(false);
      });
  };

  // AI Q&A Companion Chat Handler - Runs 100% locally to answer questions about Dokari itself
  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsgText = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsgText }]);
    setChatLoading(true);

    setTimeout(() => {
      const answer = findLocalAnswer(userMsgText);
      setChatMessages(prev => [...prev, { sender: 'ai', text: answer }]);
      setChatLoading(false);
    }, 400);
  };

  // Generate code docstring fix modal
  const generateDocFix = (suggestion) => {
    setSelectedFixSuggestion(suggestion);
    setShowFixModal(true);
    setFixingLoading(true);
    setDocFixProposal('');

    const filesPayload = uploadedFiles.map(f => ({
      name: f.filename,
      content: f.content
    }));

    fetch(`${AI_SERVICE_URL}/generate/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files_content: filesPayload,
        question: `Generate the precise comment or docstring to fix this technical recommendation: "${suggestion}". Return ONLY the code block or comments, with no extra text or markdown explanations. Make sure it is clean.`,
        chat_history: []
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Fix failed');
        return res.json();
      })
      .then(data => {
        setDocFixProposal(data.answer);
        setFixingLoading(false);
      })
      .catch(err => {
        console.error(err);
        setDocFixProposal('Failed to generate fix recommendations.');
        setFixingLoading(false);
      });
  };

  // Copy fix to clipboard
  const copyDocFix = () => {
    if (!docFixProposal) return;
    navigator.clipboard.writeText(docFixProposal).then(() => {
      showToast('Copied documentation fix to clipboard!', 'success');
    });
  };

  // Clipboard Copier
  const copyToClipboard = () => {
    const content = documents[activeTab];
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      showToast('Copied markdown to clipboard!', 'success');
    });
  };

  // Export File Download Handler
  const exportDoc = (format) => {
    const content = documents[activeTab];
    if (!content) return;

    if (format === 'markdown') {
      const element = document.createElement("a");
      const file = new Blob([content], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `dokari_${activeTab}.md`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      showToast('Markdown downloaded!', 'success');
    } else if (format === 'pdf') {
      showToast('Generating PDF file...', 'info');
      fetch(`${AI_SERVICE_URL}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, format: 'pdf' })
      })
        .then(res => {
          if (!res.ok) throw new Error('PDF Generation failed');
          return res.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `dokari_${activeTab}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          showToast('PDF downloaded successfully!', 'success');
        })
        .catch(err => {
          console.error(err);
          showToast('Failed to export PDF.', 'error');
        });
    }
  };

  // File Drag-Drop Event handlers
  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => {
    setDragOver(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!user) {
      triggerAuthPrompt('Please sign in to upload your project files.');
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleCreateProjectBtnClick = () => {
    if (!user) {
      triggerAuthPrompt('Please sign in to create new projects.');
    } else {
      setShowNewProjectModal(true);
    }
  };

  // Style score color
  const getScoreColorClass = (score) => {
    if (score >= 80) return 'health-excellent';
    if (score >= 50) return 'health-average';
    return 'health-poor';
  };

  return (
    <div className="app-container">
      {/* Toast notifications */}
      <div className="toast-wrapper">
        {toasts.map(t => (
          <div key={t.id} className={`toast-item toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="main-header d-flex justify-content-between align-items-center px-4 py-3">
        <div className="logo-section d-flex align-items-center">
          <div className="brand-logo-container me-2">
            <i className="fa-solid fa-cubes-stacked text-primary"></i>
          </div>
          <span className="brand-name">Dokari</span>
          <span className="badge bg-secondary ms-2 text-uppercase">v1.0</span>
        </div>

        <div className="user-controls-section d-flex align-items-center gap-3">
          {user ? (
            <>
              <div className={`connection-status d-flex align-items-center gap-1.5 ${backendOnline ? 'online' : 'offline'}`}>
                <span className="status-dot"></span>
                <span className="status-text">{backendOnline ? 'API Connected' : 'API Offline'}</span>
              </div>

              <div className="user-profile d-flex align-items-center gap-2">
                <div className="user-avatar">
                  <i className="fa-solid fa-user"></i>
                </div>
                <span className="user-name">{user.username}</span>
              </div>

              <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle theme">
                <i className={theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun'}></i>
              </button>

              <button onClick={handleLogout} className="btn-logout" title="Logout">
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </>
          ) : (
            <>
              <div className="connection-status d-flex align-items-center gap-1.5 online">
                <span className="status-dot"></span>
                <span className="status-text">Guest Mode</span>
              </div>

              <button 
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} 
                className="btn btn-secondary px-3 py-1.5 fw-semibold"
              >
                Sign In
              </button>

              <button 
                onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }} 
                className="btn btn-primary px-3 py-1.5 fw-semibold"
              >
                Register
              </button>

              <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle theme">
                <i className={theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun'}></i>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Workspace */}
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
                  if (val === 'demo') {
                    setCurrentProjectId('demo');
                  } else {
                    setCurrentProjectId(val ? Number(val) : null);
                  }
                }}
              >
                {!user && <option value="demo">Welcome & Demo Project</option>}
                {user && (
                  <>
                    <option value="">-- Choose Project --</option>
                    <option value="demo">Welcome & Demo Project</option>
                    {projects.filter(p => p.id !== 'demo').map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Project Details Card */}
          {currentProject && (
            <div className="project-details-card d-flex flex-column gap-3">
              <div>
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <h6 className="project-detail-name m-0 text-truncate">{currentProject.name}</h6>
                  {currentProjectId !== 'demo' && (
                    <button onClick={deleteCurrentProject} className="btn-delete-project" title="Delete Project">
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  )}
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
                    {((documents.api ? 1 : 0) + (documents.readme ? 1 : 0) + (diagramUrl ? 1 : 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Doc Health Analyzer Card */}
          {currentProject && (
            <div className="project-details-card d-flex flex-column gap-2.5">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="sidebar-title m-0">Doc Health Score</h5>
                {healthLoading ? (
                  <span className="spinner-border spinner-border-sm text-muted" role="status"></span>
                ) : (
                  <span className={`badge-health ${getScoreColorClass(docHealthScore)}`}>
                    {docHealthScore}%
                  </span>
                )}
              </div>

              <div className="doc-suggestions-feed">
                {docHealthSuggestions.length === 0 ? (
                  <p className="fs-7 text-muted m-0">No suggestions available.</p>
                ) : (
                  docHealthSuggestions.map((suggestion, idx) => (
                    <div key={idx} className="doc-suggestion-item border-bottom py-2.5 d-flex justify-content-between align-items-start gap-2">
                      <span className="fs-7 text-secondary lh-sm">{suggestion}</span>
                      {uploadedFiles.length > 0 && currentProjectId !== 'demo' && user && (
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
            </div>
          )}
        </aside>

        {/* Content Panel */}
        <main className="content-container flex-grow-1 p-4">
          {!currentProjectId ? (
            <div className="empty-state-card text-center d-flex flex-column align-items-center justify-content-center py-5">
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
            </div>
          ) : (
            <div className="row g-4 h-100 align-items-stretch">
              {/* Left Column: File Manager */}
              <div className="col-12 col-xl-4 d-flex flex-column">
                <div className="dashboard-card flex-grow-1 d-flex flex-column p-4">
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

                  {/* File List */}
                  <div className="file-list-wrapper flex-grow-1">
                    {uploadedFiles.length === 0 ? (
                      <div className="no-files-placeholder text-center text-muted py-5">
                        <i className="fa-solid fa-inbox d-block fs-3 mb-2"></i>
                        <span>No files uploaded yet</span>
                      </div>
                    ) : (
                      <div className="file-items-container">
                        {uploadedFiles.map((file, idx) => {
                          const ext = file.filename.split('.').pop();
                          let iconClass = 'fa-file-lines';
                          if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) iconClass = 'fa-js text-warning';
                          if (ext === 'py') iconClass = 'fa-python text-info';
                          if (ext === 'php') iconClass = 'fa-php text-primary';

                          return (
                            <div key={idx} className="file-item-row d-flex align-items-center justify-content-between py-2 px-3 mb-2 border rounded">
                              <div className="d-flex align-items-center text-truncate">
                                <i className={`fa-solid ${iconClass} me-2.5`}></i>
                                <span className="file-item-name text-truncate" title={file.filename}>{file.filename}</span>
                              </div>
                              <span className="file-item-size text-muted">{Math.round(file.content.length / 1024 * 10) / 10} KB</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: AI Generator & Workspace Displays */}
              <div className="col-12 col-xl-8 d-flex flex-column">
                <div className="dashboard-card flex-grow-1 d-flex flex-column p-4">
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
                      <button 
                        onClick={() => setActiveTab('chat')} 
                        className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                      >
                        <i className="fa-solid fa-comments me-2"></i>AI Companion
                      </button>
                    </div>

                    <div className="tab-actions d-flex gap-2">
                      {activeTab !== 'chat' && (
                        <button 
                          onClick={generateDocumentation} 
                          className="btn btn-primary"
                          disabled={generating || uploadedFiles.length === 0}
                        >
                          {generating ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Generating...
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-wand-magic-sparkles me-2"></i>AI Generate
                            </>
                          )}
                        </button>
                      )}

                      {activeTab !== 'architecture' && activeTab !== 'chat' && documents[activeTab] && (
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

                  {/* Main Document / Chat Output Area */}
                  <div className="document-output-wrapper flex-grow-1">
                    {activeTab === 'chat' ? (
                      /* Chatbot Panel */
                      <div className="chat-viewport-panel border rounded d-flex flex-column h-100 bg-light-panel">
                        <div className="chat-messages-container flex-grow-1 p-3 overflow-auto">
                          {chatMessages.map((msg, idx) => (
                            <div key={idx} className={`chat-message-row d-flex ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'} mb-3`}>
                              <div className={`chat-message-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-ai'}`}>
                                <div className="bubble-sender-name mb-1">
                                  {msg.sender === 'user' ? 'You' : 'Dokari AI'}
                                </div>
                                <div className="bubble-text">{msg.text}</div>
                              </div>
                            </div>
                          ))}
                          {chatLoading && (
                            <div className="chat-message-row d-flex justify-content-start mb-3">
                              <div className="chat-message-bubble bubble-ai">
                                <div className="bubble-sender-name mb-1">Dokari AI</div>
                                <div className="d-flex align-items-center gap-2">
                                  <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                                  <span className="fs-7 text-muted">Reading codebase...</span>
                                </div>
                              </div>
                            </div>
                          )}
                          <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={sendChatMessage} className="chat-input-bar border-top p-3 d-flex gap-2 bg-light">
                          <input 
                            type="text" 
                            className="form-control"
                            value={chatInput} 
                            onChange={(e) => setChatInput(e.target.value)} 
                            placeholder={uploadedFiles.length === 0 ? "Upload code files to chat..." : "Ask AI about the code (e.g. 'What does main.py do?')..."}
                            disabled={chatLoading || uploadedFiles.length === 0}
                          />
                          <button type="submit" className="btn btn-primary px-4" disabled={chatLoading || !chatInput.trim() || uploadedFiles.length === 0}>
                            Send
                          </button>
                        </form>
                      </div>
                    ) : activeTab === 'architecture' ? (
                      /* Diagram Panel */
                      <div className="diagram-display-panel h-100 d-flex align-items-center justify-content-center border rounded p-3 bg-light-panel">
                        {diagramUrl ? (
                          <div className="diagram-image-container text-center">
                            <img src={diagramUrl} alt="Architecture Diagram" className="img-fluid rounded border shadow-sm" />
                            <a href={diagramUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary mt-3">
                              <i className="fa-solid fa-up-right-from-square me-2"></i>Open in New Tab
                            </a>
                          </div>
                        ) : (
                          <div className="no-docs-placeholder text-center text-muted py-5">
                            <i className="fa-solid fa-network-wired d-block fs-3 mb-2"></i>
                            <span>No diagram generated yet. Click "AI Generate" to render structure.</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Document Markdown Panel */
                      <div className="markdown-render-panel h-100 border rounded p-4 overflow-auto bg-light-panel">
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
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Auth Modal overlay */}
      {showAuthModal && (
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center">
          <div className="modal-card auth-card">
            <div className="modal-header-custom d-flex justify-content-between align-items-center pb-3 border-bottom mb-3">
              <div className="auth-logo">
                <i className="fa-solid fa-cubes-stacked me-2"></i>
                <span>Dokari</span>
              </div>
              <button onClick={() => setShowAuthModal(false)} className="btn-modal-close" title="Close">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <p className="auth-subtitle text-muted text-center mb-3">
              {authMode === 'login' ? 'Log in to your account' : 'Register a new account'}
            </p>

            <form onSubmit={handleAuth} className="auth-form mt-2">
              <div className="form-group mb-3">
                <label htmlFor="username">Username</label>
                <div className="input-group-custom">
                  <i className="fa-solid fa-user"></i>
                  <input
                    type="text"
                    id="username"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    placeholder="Enter username"
                    autoComplete="off"
                    disabled={authLoading}
                  />
                </div>
              </div>

              <div className="form-group mb-4">
                <label htmlFor="password">Password</label>
                <div className="input-group-custom">
                  <i className="fa-solid fa-lock"></i>
                  <input
                    type="password"
                    id="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Enter password"
                    disabled={authLoading}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100 py-2.5 auth-submit-btn" disabled={authLoading}>
                {authLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  authMode === 'login' ? 'Login' : 'Create Account'
                )}
              </button>
            </form>

            <div className="auth-footer text-center mt-4 border-top pt-3">
              {authMode === 'login' ? (
                <p className="m-0 fs-7">
                  Don't have an account?{' '}
                  <span onClick={() => { setAuthMode('signup'); }} className="auth-toggle-link">
                    Sign Up
                  </span>
                </p>
              ) : (
                <p className="m-0 fs-7">
                  Already have an account?{' '}
                  <span onClick={() => { setAuthMode('login'); }} className="auth-toggle-link">
                    Log In
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showNewProjectModal && (
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center">
          <div className="modal-card">
            <div className="modal-header-custom d-flex justify-content-between align-items-center pb-3 border-bottom mb-3">
              <h5 className="modal-title m-0">Create New Project</h5>
              <button onClick={() => setShowNewProjectModal(false)} className="btn-modal-close">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={createProject}>
              <div className="form-group mb-3">
                <label htmlFor="projectName" className="form-label-custom">Project Name</label>
                <input 
                  type="text" 
                  id="projectName" 
                  className="form-control-custom"
                  value={newProjectName} 
                  onChange={(e) => setNewProjectName(e.target.value)} 
                  placeholder="e.g. Dokari Web App"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group mb-4">
                <label htmlFor="projectDesc" className="form-label-custom">Description (Optional)</label>
                <textarea 
                  id="projectDesc" 
                  className="form-control-custom"
                  value={newProjectDesc} 
                  onChange={(e) => setNewProjectDesc(e.target.value)} 
                  placeholder="What is this project about?"
                  rows="3"
                />
              </div>

              <div className="modal-actions-custom d-flex justify-content-end gap-2">
                <button type="button" onClick={() => setShowNewProjectModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Code Documentation Fix Recommendation Modal */}
      {showFixModal && (
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center">
          <div className="modal-card" style={{ maxWidth: '600px', width: '100%' }}>
            <div className="modal-header-custom d-flex justify-content-between align-items-center pb-3 border-bottom mb-3">
              <h5 className="modal-title m-0">Suggested Documentation Fix</h5>
              <button onClick={() => setShowFixModal(false)} className="btn-modal-close">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body-content">
              <p className="fs-7 text-muted mb-2">Recommendation:</p>
              <div className="p-2.5 bg-light rounded border mb-3">
                <span className="fs-7 fw-semibold text-secondary">{selectedFixSuggestion}</span>
              </div>

              <p className="fs-7 text-muted mb-2">AI-Generated Code/Comment Fix Proposal:</p>
              <div className="position-relative">
                {fixingLoading ? (
                  <div className="border rounded p-4 text-center bg-light-panel">
                    <span className="spinner-border spinner-border-sm text-primary me-2" role="status"></span>
                    <span className="fs-7 text-muted">Generating documentation fix...</span>
                  </div>
                ) : (
                  <>
                    <pre className="border rounded p-3 overflow-auto bg-dark text-white fs-7" style={{ maxHeight: '250px' }}>
                      <code>{docFixProposal || 'No fix proposal generated.'}</code>
                    </pre>
                    {docFixProposal && (
                      <button 
                        onClick={copyDocFix} 
                        className="btn btn-secondary btn-sm position-absolute" 
                        style={{ top: '10px', right: '10px', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        Copy
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="modal-actions-custom d-flex justify-content-end gap-2 mt-4 border-top pt-3">
              <button type="button" onClick={() => setShowFixModal(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
