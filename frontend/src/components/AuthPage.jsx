import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import DecryptedText from './DecryptedText';

function AuthPage({
  authMode,
  setAuthMode,
  authUsername,
  setAuthUsername,
  authPassword,
  setAuthPassword,
  authLoading,
  handleAuth,
  showToast,
  onBackToHome,
  keepMeSignedIn,
  setKeepMeSignedIn
}) {
  const [retryPassword, setRetryPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRetryPassword, setShowRetryPassword] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Reset fields on mode switch
  useEffect(() => {
    setRetryPassword('');
    setShowPassword(false);
    setShowRetryPassword(false);
  }, [authMode]);

  // Password requirements validations
  const validations = {
    length: authPassword.length >= 8,
    capital: /[A-Z]/.test(authPassword),
    number: /[0-9]/.test(authPassword),
    special: /[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(authPassword),
  };

  const strengthScore = Object.values(validations).filter(Boolean).length;

  // Generate strong password
  const generateStrongPassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '@$!%*?&#';
    
    let generated = '';
    generated += uppercase[Math.floor(Math.random() * uppercase.length)];
    generated += lowercase[Math.floor(Math.random() * lowercase.length)];
    generated += numbers[Math.floor(Math.random() * numbers.length)];
    generated += symbols[Math.floor(Math.random() * symbols.length)];
    
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 0; i < 10; i++) {
      generated += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the string
    generated = generated.split('').sort(() => 0.5 - Math.random()).join('');
    
    setAuthPassword(generated);
    setRetryPassword(generated);
    if (showToast) {
      showToast('Strong password generated and applied!', 'success');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (authMode === 'signup') {
      if (authPassword !== retryPassword) {
        if (showToast) showToast('Passwords do not match.', 'error');
        return;
      }
      if (strengthScore < 4) {
        if (showToast) showToast('Password is too weak. Please satisfy all requirements.', 'warning');
        return;
      }
    }
    handleAuth(e);
  };

  return (
    <div className="auth-page-container d-flex justify-content-center align-items-center position-relative overflow-hidden">
      {/* Decorative background grid and glow */}
      <div className="auth-grid-bg position-absolute inset-0"></div>
      <div className="auth-glow-effect position-absolute"></div>

      <div className="auth-form-panel-centered d-flex flex-column justify-content-center align-items-center p-4 bg-card rounded-4 border shadow-lg" style={{ zIndex: 10 }}>
        <div className="auth-form-card" style={{ maxWidth: '380px', width: '100%' }}>
          <div className="d-flex align-items-center justify-content-between mb-4 w-100">
            <button 
              type="button" 
              onClick={onBackToHome} 
              className="btn-back-home text-secondary fs-7.5 fw-medium d-flex align-items-center gap-1.5 p-0"
              style={{ border: 'none', background: 'none' }}
            >
              <i className="fa-solid fa-arrow-left"></i>Back to Home
            </button>
          </div>

          <h2 className="fw-bold tracking-tight mb-1 h3">
            {authMode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-secondary fs-7.5 mb-4">
            {authMode === 'login' 
              ? 'Enter your credentials to access your workspaces.' 
              : 'Register a security-compliant cloud workspace in seconds.'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group mb-3">
              <label htmlFor="username" className="form-label fs-8 fw-semibold text-secondary">Username</label>
              <div className="input-group-custom">
                <i className="fa-solid fa-user text-muted"></i>
                <input
                  type="text"
                  id="username"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  disabled={authLoading}
                  required
                />
              </div>
            </div>

            <div className="form-group mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label htmlFor="password" className="form-label fs-8 fw-semibold text-secondary" style={{ margin: 0 }}>Password</label>
                {authMode === 'signup' && (
                  <button
                    type="button"
                    className="btn-suggest-password fs-8 text-primary fw-semibold"
                    onClick={generateStrongPassword}
                    style={{ textDecoration: 'none', border: 'none', background: 'none', padding: 0 }}
                  >
                    <i className="fa-solid fa-wand-magic-sparkles me-1"></i>Suggest Password
                  </button>
                )}
              </div>
              <div className="input-group-custom">
                <i className="fa-solid fa-lock text-muted"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete={authMode === 'login' ? "current-password" : "new-password"}
                  disabled={authLoading}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn-toggle-password text-muted"
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                </button>
              </div>

              {authMode === 'signup' && authPassword.length > 0 && (
                <div className="password-strength-container mt-2">
                  <div className="d-flex justify-content-between align-items-center mb-1 fs-8">
                    <span className="text-secondary">Password Strength:</span>
                    <span className="fw-bold" style={{
                      color: strengthScore <= 1 ? 'var(--error)' : strengthScore <= 3 ? 'var(--warning)' : 'var(--success)'
                    }}>
                      {strengthScore === 0 && 'Very Weak'}
                      {strengthScore === 1 && 'Weak'}
                      {strengthScore === 2 && 'Fair'}
                      {strengthScore === 3 && 'Good'}
                      {strengthScore === 4 && 'Strong'}
                    </span>
                  </div>
                  <div className="password-strength-bar rounded-pill" style={{ height: '5px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div 
                      className="password-strength-fill h-100 transition-all"
                      style={{
                        width: `${(strengthScore / 4) * 100}%`,
                        backgroundColor: strengthScore <= 1 ? 'var(--error)' : strengthScore <= 3 ? 'var(--warning)' : 'var(--success)',
                        transition: 'width 0.3s ease, background-color 0.3s ease'
                      }}
                    />
                  </div>

                  <div className="password-checklist mt-3 p-2 bg-panel rounded-3 fs-8">
                    <div className="checklist-grid row g-2">
                      <div className={`col-6 d-flex align-items-center gap-1.5 ${validations.length ? 'text-success' : 'text-muted'}`}>
                        <i className={`fa-solid ${validations.length ? 'fa-circle-check' : 'fa-circle-dot'}`} style={{ fontSize: '0.75rem' }}></i>
                        <span style={{ fontSize: '0.7rem' }}>Min. 8 characters</span>
                      </div>
                      <div className={`col-6 d-flex align-items-center gap-1.5 ${validations.capital ? 'text-success' : 'text-muted'}`}>
                        <i className={`fa-solid ${validations.capital ? 'fa-circle-check' : 'fa-circle-dot'}`} style={{ fontSize: '0.75rem' }}></i>
                        <span style={{ fontSize: '0.7rem' }}>At least 1 Capital letter</span>
                      </div>
                      <div className={`col-6 d-flex align-items-center gap-1.5 ${validations.number ? 'text-success' : 'text-muted'}`}>
                        <i className={`fa-solid ${validations.number ? 'fa-circle-check' : 'fa-circle-dot'}`} style={{ fontSize: '0.75rem' }}></i>
                        <span style={{ fontSize: '0.7rem' }}>At least 1 Number</span>
                      </div>
                      <div className={`col-6 d-flex align-items-center gap-1.5 ${validations.special ? 'text-success' : 'text-muted'}`}>
                        <i className={`fa-solid ${validations.special ? 'fa-circle-check' : 'fa-circle-dot'}`} style={{ fontSize: '0.75rem' }}></i>
                        <span style={{ fontSize: '0.7rem' }}>At least 1 Special char</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {authMode === 'login' && (
              <div className="form-group mb-3.5 d-flex align-items-center justify-content-between">
                <div className="form-check d-flex align-items-center gap-2 p-0 m-0">
                  <input
                    type="checkbox"
                    id="keepMeSignedIn"
                    className="form-check-input-custom"
                    checked={keepMeSignedIn}
                    onChange={(e) => setKeepMeSignedIn(e.target.checked)}
                    disabled={authLoading}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="keepMeSignedIn" className="form-check-label-custom select-none" style={{ cursor: 'pointer', margin: 0 }}>
                    Keep me signed in
                  </label>
                </div>
              </div>
            )}

            {authMode === 'signup' && (
              <div className="form-group mb-3">
                <label htmlFor="confirmPassword" className="form-label fs-8 fw-semibold text-secondary">Confirm Password</label>
                <div className="input-group-custom">
                  <i className="fa-solid fa-lock-open text-muted"></i>
                  <input
                    type={showRetryPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={retryPassword}
                    onChange={(e) => setRetryPassword(e.target.value)}
                    placeholder="Confirm your password"
                    disabled={authLoading}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowRetryPassword(!showRetryPassword)}
                    className="btn-toggle-password text-muted"
                    title={showRetryPassword ? "Hide Password" : "Show Password"}
                  >
                    <i className={showRetryPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                  </button>
                </div>
              </div>
            )}

            {authMode === 'signup' && (
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <button
                    type="button"
                    className="btn btn-link p-0 fs-8 text-secondary"
                    onClick={() => setShowInfo(!showInfo)}
                    style={{ textDecoration: 'none', border: 'none', background: 'none' }}
                  >
                  </button>
                </div>

                <AnimatePresence>
                  {showInfo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="auth-info-panel mt-2 p-2 bg-panel rounded-3 text-start fs-8 text-muted overflow-hidden"
                    >
                      <p className="m-0 mb-1.5"><i className="fa-solid fa-user-shield text-success me-1"></i><strong>Credentials Security</strong></p>
                      <p className="m-0">Dokari implements industrial security measures. Your passwords are never stored in raw readable text. They are encrypted using server-side modern salted hashes (bcrypt) prior to database insertion.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-100 py-2.5 auth-submit-btn mt-2" disabled={authLoading}>
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
              <p className="m-0 fs-7.5 text-secondary">
                Don't have an account?{' '}
                <span onClick={() => setAuthMode('signup')} className="auth-toggle-link text-primary fw-semibold cursor-pointer">
                  Sign Up
                </span>
              </p>
            ) : (
              <p className="m-0 fs-7.5 text-secondary">
                Already have an account?{' '}
                <span onClick={() => setAuthMode('login')} className="auth-toggle-link text-primary fw-semibold cursor-pointer">
                  Log In
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
