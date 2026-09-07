import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import DecryptedText from './DecryptedText';

function SplashLandingPage({ onLoginClick, onRegisterClick, onGetStarted }) {
  const [demoTab, setDemoTab] = useState('raw');
  const [isHovered, setIsHovered] = useState(false);
  const [displayedScore, setDisplayedScore] = useState(42);

  const rawCodeSample = `class UserAuthentication:
    def __init__(self, db_session):
        self.db = db_session

    def login(self, username, password):
        user = self.db.query(username)
        if user and user.verify_password(password):
            return {"status": "success", "token": "jwt_token_xyz"}
        return {"status": "error", "message": "Invalid credentials"}`;

  const apiDocSample = `class UserAuthentication:
    """
    Handles system credentials validation and session token generation.
    
    Attributes:
        db (Session): Database connection context session.
    """
    def __init__(self, db_session):
        """Initializes database session context."""
        self.db = db_session

    def login(self, username, password):
        """
        Validates user credentials against the database store.
        
        Args:
            username (str): The login credential username query.
            password (str): The raw text password to verify.
            
        Returns:
            dict: Status code with JWT session token or error payload.
        """
        user = self.db.query(username)
        if user and user.verify_password(password):
            return {"status": "success", "token": "jwt_token_xyz"}
        return {"status": "error", "message": "Invalid credentials"}`;

  const healthMetrics = [
    { label: 'Comment Density', value: 74, color: 'var(--warning)' },
    { label: 'Docstring Coverage', value: 85, color: 'var(--success)' },
    { label: 'Parameter Clarity', value: 90, color: 'var(--success)' },
    { label: 'Naming Consistency', value: 96, color: 'var(--success)' },
    { label: 'Overall Quality Score', value: 92, color: 'var(--success)' }
  ];

  // Auto-cycling tabs
  useEffect(() => {
    if (isHovered) return;
    const tabs = ['raw', 'docs', 'health'];
    const interval = setInterval(() => {
      setDemoTab(prev => {
        const idx = tabs.indexOf(prev);
        return tabs[(idx + 1) % tabs.length];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered]);

  // Score count-up logic
  useEffect(() => {
    let start = 0;
    const end = demoTab === 'raw' ? 42 : 92;
    const duration = 800;
    const stepTime = Math.abs(Math.floor(duration / (end || 1)));
    
    const timer = setInterval(() => {
      start += 1;
      if (start >= end) {
        setDisplayedScore(end);
        clearInterval(timer);
      } else {
        setDisplayedScore(start);
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [demoTab]);

  // Card cursor-following radial glow tracking
  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    const targets = document.querySelectorAll('.reveal-on-scroll');
    targets.forEach(t => observer.observe(t));

    return () => observer.disconnect();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { y: 24, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 16
      }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="splash-landing-container"
    >
      {/* Hero Section */}
      <section className="splash-hero text-center py-5 px-3">
        <div className="container" style={{ maxWidth: '1000px' }}>
          <motion.h1 variants={itemVariants} className="hero-title fw-bold mb-3 display-4">
            Automate Your Codebase <span className="text-primary-gradient">Documentation & Health</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="hero-subtitle mx-auto text-secondary mb-4 lead" style={{ maxWidth: '750px' }}>
            Dokari analyzes raw source code to compute instant documentation quality ratings, recommend precise AI docstring fixes, generate comprehensive API specs and READMEs, and render architectural visual diagrams.
          </motion.p>
          
          <motion.div variants={itemVariants} className="hero-cta-group d-flex justify-content-center gap-3 mb-5">
            <motion.button 
              whileTap={{ scale: 0.96 }}
              onClick={onGetStarted} 
              className="btn btn-primary btn-lg px-4 py-2.5 fw-bold shadow-lg btn-primary-glow"
            >
              Get Started Free <i className="fa-solid fa-arrow-right ms-2"></i>
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.96 }}
              onClick={onLoginClick} 
              className="btn btn-secondary btn-lg px-4 py-2.5 fw-semibold"
            >
              Sign In to Workspace
            </motion.button>
          </motion.div>

          {/* Interactive Live Demo Transformation Widget */}
          <motion.div 
            variants={itemVariants} 
            className="live-demo-card p-4 rounded-4 bg-card border shadow-lg text-start mx-auto" 
            style={{ maxWidth: '850px' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Floating Circular Doc Health Badge */}
            <div className="floating-score-badge">
              <svg width="70" height="70" className="progress-ring-badge">
                <circle cx="35" cy="35" r="30" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                <motion.circle 
                  cx="35" 
                  cy="35" 
                  r="30" 
                  fill="transparent" 
                  stroke={demoTab === 'raw' ? 'var(--error)' : 'var(--success)'}
                  strokeWidth="4"
                  strokeDasharray="188.4"
                  animate={{ strokeDashoffset: 188.4 - (188.4 * (demoTab === 'raw' ? 42 : 92)) / 100 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </svg>
              <div className="d-flex flex-column align-items-center justify-content-center" style={{ zIndex: 2 }}>
                <span className="fw-bold fs-5" style={{ color: demoTab === 'raw' ? 'var(--error)' : 'var(--success)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {displayedScore}%
                </span>
                <span className="text-muted" style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', marginTop: '2px' }}>
                  Doc Health
                </span>
              </div>
            </div>

            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 pb-3 gap-2 live-demo-card-header">
              <div className="d-flex align-items-center gap-2">
                <span className="dot bg-danger rounded-circle d-inline-block" style={{ width: 8, height: 8 }}></span>
                <span className="dot bg-warning rounded-circle d-inline-block" style={{ width: 8, height: 8 }}></span>
                <span className="dot bg-success rounded-circle d-inline-block" style={{ width: 8, height: 8 }}></span>
                <span className="ms-2 fw-semibold fs-7 text-muted" style={{ fontFamily: 'var(--font-mono)' }}>auth_service.py — Live Preview</span>
              </div>

              <div className="demo-tab-switcher d-flex gap-1 p-1 bg-panel rounded-3">
                <button 
                  onClick={() => setDemoTab('raw')} 
                  className={`demo-tab-btn ${demoTab === 'raw' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-code me-2"></i>Raw Code
                </button>
                <button 
                  onClick={() => setDemoTab('docs')} 
                  className={`demo-tab-btn ${demoTab === 'docs' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-file-lines me-2"></i>AI Spec
                </button>
                <button 
                  onClick={() => setDemoTab('health')} 
                  className={`demo-tab-btn ${demoTab === 'health' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-heart-pulse me-2"></i>Health Report
                </button>
              </div>
            </div>

            <div style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <AnimatePresence mode="wait">
                {demoTab === 'health' ? (
                  <motion.div 
                    key="health"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="health-report-panel d-flex flex-column p-3 bg-panel rounded-3 text-start"
                  >
                    <div className="health-metric-list">
                      {healthMetrics.map((m, idx) => (
                        <div key={idx} className="metric-row">
                          <div className="health-metric-header d-flex justify-content-between align-items-center" style={{ fontFamily: 'var(--font-mono)' }}>
                            <span className="health-metric-label fw-semibold text-secondary">{m.label}</span>
                            <span className="health-metric-value fw-bold" style={{ color: m.color }}>{m.value}%</span>
                          </div>
                          <div className="progress-bar-bg health-progress-track rounded-pill">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${m.value}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="progress-bar-fill health-progress-fill h-100 rounded-pill"
                              style={{ backgroundColor: m.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.pre 
                    key={demoTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="demo-code-block"
                  >
                    <code>
                      {demoTab === 'raw' && rawCodeSample}
                      {demoTab === 'docs' && apiDocSample}
                    </code>
                  </motion.pre>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tech Stack Pills Bar */}
      <motion.section variants={itemVariants} className="tech-stack-bar py-3 border-top border-bottom bg-panel text-center mb-5">
        {/* <div className="container d-flex flex-wrap align-items-center justify-content-center gap-4 fs-7 text-muted fw-medium" style={{ fontFamily: 'var(--font-mono)' }}>
          <span><i className="fa-brands fa-python me-1.5 text-info"></i>Python 3.x</span>
          <span><i className="fa-brands fa-js me-1.5 text-warning"></i>JavaScript & TypeScript</span>
          <span><i className="fa-brands fa-php me-1.5 text-primary"></i>PHP 8.x</span>
          <span><i className="fa-solid fa-robot me-1.5 text-success"></i>Google Gemini 2.5 AI</span>
        </div> */}
      </motion.section>

      {/* Features Grid */}
      <motion.section variants={itemVariants} id="features" className="splash-features py-4 px-4 container mb-5 reveal-on-scroll">
        <div className="text-center mb-5">
          <h2 className="section-title h3 fw-bold mb-2">Everything You Need for Clean Code Docs</h2>
          <p className="text-muted">Built for modern software developers, powered by Google Gemini.</p>
        </div>

        <div className="row g-4">
          <div className="col-md-6 col-lg-3 reveal-on-scroll">
            <div className="splash-feature-card p-4 rounded-3 h-100 border" onMouseMove={handleCardMouseMove}>
              <div className="feature-icon-wrapper mb-3 text-primary fs-3">
                <i className="fa-solid fa-heart-pulse"></i>
              </div>
              <h4 className="h5 fw-bold mb-2">Doc Health Score</h4>
              <p className="text-secondary small m-0">
                Automatic 0–100 quality scoring that checks comment densities, parameter explanations, and docstrings.
              </p>
            </div>
          </div>

          <div className="col-md-6 col-lg-3 reveal-on-scroll">
            <div className="splash-feature-card p-4 rounded-3 h-100 border" onMouseMove={handleCardMouseMove}>
              <div className="feature-icon-wrapper mb-3 text-primary fs-3">
                <i className="fa-solid fa-code"></i>
              </div>
              <h4 className="h5 fw-bold mb-2">Interactive Fixes</h4>
              <p className="text-secondary small m-0">
                Click "Fix" on any quality suggestion to generate copy-pasteable docstrings and comments instantly.
              </p>
            </div>
          </div>

          <div className="col-md-6 col-lg-3 reveal-on-scroll">
            <div className="splash-feature-card p-4 rounded-3 h-100 border" onMouseMove={handleCardMouseMove}>
              <div className="feature-icon-wrapper mb-3 text-primary fs-3">
                <i className="fa-solid fa-file-lines"></i>
              </div>
              <h4 className="h5 fw-bold mb-2">API & README Builder</h4>
              <p className="text-secondary small m-0">
                Parses Python, JavaScript, and PHP files to write tailored markdown documentation and export to PDF.
              </p>
            </div>
          </div>

          <div className="col-md-6 col-lg-3 reveal-on-scroll">
            <div className="splash-feature-card p-4 rounded-3 h-100 border" onMouseMove={handleCardMouseMove}>
              <div className="feature-icon-wrapper mb-3 text-primary fs-3">
                <i className="fa-solid fa-diagram-project"></i>
              </div>
              <h4 className="h5 fw-bold mb-2">Architecture Maps</h4>
              <p className="text-secondary small m-0">
                Renders component dependencies, classes, and helper relations into clean, visual flowchart PNG diagrams.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section variants={itemVariants} id="workflow" className="splash-workflow py-4 px-4 container mb-5 reveal-on-scroll">
        <div className="p-5 rounded-3 bg-panel border text-center">
          <h3 className="fw-bold mb-4">Three Simple Steps to Documentation Mastery</h3>
          <div className="row g-4 text-start">
            <div className="col-md-4 reveal-on-scroll">
              <div className="d-flex align-items-start gap-3">
                <span className="step-number badge fs-5 px-3 py-2 rounded-circle">1</span>
                <div>
                  <h5 className="fw-bold mb-1">Create a Workspace</h5>
                  <p className="text-secondary small m-0">Register an account and start a private cloud project to keep your files secure.</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 reveal-on-scroll">
              <div className="d-flex align-items-start gap-3">
                <span className="step-number badge fs-5 px-3 py-2 rounded-circle">2</span>
                <div>
                  <h5 className="fw-bold mb-1">Upload Code Files</h5>
                  <p className="text-secondary small m-0">Drag and drop your Python, JS, or PHP files to run instant static code analysis.</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 reveal-on-scroll">
              <div className="d-flex align-items-start gap-3">
                <span className="step-number badge fs-5 px-3 py-2 rounded-circle">3</span>
                <div>
                  <h5 className="fw-bold mb-1">Generate & Export</h5>
                  <p className="text-secondary small m-0">Click AI Generate to create your README or API spec and export directly to PDF.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer Section */}
      <footer className="splash-footer py-5 border-top bg-panel text-center reveal-on-scroll">
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-4">
            <div className="logo-section d-flex align-items-center">
              <div className="brand-logo-container me-2">
                <i className="fa-solid fa-cubes-stacked text-primary"></i>
              </div>
              <span className="brand-name"><DecryptedText text="Dokari" hoverTrigger={true} interval={45} /></span>
            </div>
            <div className="d-flex gap-4">
              <a href="#features" className="nav-link-custom fs-7">Features</a>
              <a href="#workflow" className="nav-link-custom fs-7">How it Works</a>
              <a href="#privacy" className="nav-link-custom fs-7">Privacy Policy</a>
            </div>
            <div className="fs-7 text-muted" style={{ fontFamily: 'var(--font-mono)' }}>
              &copy; {new Date().getFullYear()} Dokari Workspace. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}

export default SplashLandingPage;
