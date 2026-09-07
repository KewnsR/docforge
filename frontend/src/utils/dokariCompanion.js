// Local Q&A Knowledge Base for Dokari Help Chatbot
export const DOKARI_KNOWLEDGE = [
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

export const findLocalAnswer = (question) => {
  const query = question.toLowerCase().trim();
  
  // 1. Handle common greetings
  const greetings = ["hello", "hi", "hey", "good morning", "good afternoon", "yo", "greetings"];
  if (greetings.some(g => query === g || query.startsWith(g + " ") || query.endsWith(" " + g))) {
    return "Hello! I am the Dokari Companion. How can I assist you with using the Dokari documentation platform today? You can ask me how to upload files, generate READMEs, verify API specifications, or check documentation health.";
  }

  // 2. Handle thank you / compliments
  const compliments = ["thank you", "thanks", "awesome", "great", "cool", "perfect", "good job", "nice", "wow", "tnx"];
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
