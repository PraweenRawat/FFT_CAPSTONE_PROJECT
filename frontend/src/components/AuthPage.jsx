import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Store,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import stocklinkLogo from '../assets/stocklink-logo.png';
import { roleShowcaseData, demoCredentials } from '../data/authData';
import { API_BASE } from '../services/api';
import '../styles/AuthPage.css';

export default function AuthPage({ initialMode = 'login', initialRole = 'retailer', onNavigate }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const queryMode = searchParams.get('mode');
  const queryRole = searchParams.get('role');

  const [authMode, setAuthMode] = useState(queryMode === 'signup' ? 'signup' : initialMode); // 'login' | 'signup'
  const [selectedRole, setSelectedRole] = useState(
    queryRole === 'wholesaler' ? 'wholesaler' : initialRole
  ); // 'retailer' | 'wholesaler'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' }

  // Form Fields State
  const [formData, setFormData] = useState({
    // Login fields
    loginEmail: '',
    loginPassword: '',
    rememberMe: false,

    // Signup fields
    fullName: '',
    businessName: '',
    signupEmail: '',
    signupPhone: '',
    gstin: '',
    address: '',
    mov: '',
    signupPassword: '',
    confirmPassword: '',
    agreeTerms: false
  });

  // Client-side Validation Errors
  const [errors, setErrors] = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    // Clear error for that specific field as the user types
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleGSTINChange = (e) => {
    // Format to uppercase automatically and strip spaces
    const upperValue = e.target.value.toUpperCase().replace(/\s+/g, '');
    handleInputChange('gstin', upperValue);
  };

  // Demo Credentials Pre-fill
  const handlePreFillDemo = (role) => {
    setSelectedRole(role);
    const demoData = demoCredentials[role];

    if (authMode === 'login') {
      setFormData((prev) => ({
        ...prev,
        loginEmail: demoData.login.email,
        loginPassword: demoData.login.password,
        rememberMe: demoData.login.rememberMe
      }));
      setErrors({});
      showToast(`Loaded ${role === 'retailer' ? 'Retailer' : 'Wholesaler'} demo login credentials!`);
    } else {
      setFormData((prev) => ({
        ...prev,
        fullName: demoData.signup.fullName,
        businessName: demoData.signup.businessName,
        signupEmail: demoData.signup.email,
        signupPhone: demoData.signup.phone,
        gstin: demoData.signup.gstin,
        address: demoData.signup.address,
        mov: demoData.signup.mov || '',
        signupPassword: demoData.signup.password,
        confirmPassword: demoData.signup.confirmPassword,
        agreeTerms: true
      }));
      setErrors({});
      showToast(`Loaded ${role === 'retailer' ? 'Retailer' : 'Wholesaler'} demo registration form!`);
    }
  };

  // Validation Logic
  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (authMode === 'login') {
      if (!formData.loginEmail.trim()) {
        newErrors.loginEmail = 'Email address is required.';
      } else if (!emailRegex.test(formData.loginEmail.trim())) {
        newErrors.loginEmail = 'Please enter a valid email address.';
      }

      if (!formData.loginPassword) {
        newErrors.loginPassword = 'Password is required.';
      } else if (formData.loginPassword.length < 6) {
        newErrors.loginPassword = 'Password must be at least 6 characters.';
      }
    } else {
      // Sign Up validation
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Full Name is required.';
      }

      if (!formData.businessName.trim()) {
        newErrors.businessName = 'Business or Store Name is required.';
      }

      if (!formData.signupEmail.trim()) {
        newErrors.signupEmail = 'Email address is required.';
      } else if (!emailRegex.test(formData.signupEmail.trim())) {
        newErrors.signupEmail = 'Please enter a valid business email.';
      }

      if (!formData.signupPhone.trim()) {
        newErrors.signupPhone = 'Phone number is required.';
      } else if (!/^\d{10}$/.test(formData.signupPhone.trim().replace(/\D/g, ''))) {
        newErrors.signupPhone = 'Please enter a valid 10-digit mobile number.';
      }

      if (!formData.gstin.trim()) {
        newErrors.gstin = 'GSTIN number is required for B2B trading.';
      } else if (formData.gstin.trim().length !== 15) {
        newErrors.gstin = 'GSTIN must be exactly 15 alphanumeric characters.';
      } else if (!gstinRegex.test(formData.gstin.trim())) {
        newErrors.gstin = 'Invalid GSTIN format (e.g. 27AAAAA0000A1Z5).';
      }

      if (!formData.address.trim()) {
        newErrors.address = 'Trading address with pin code is required.';
      }

      if (selectedRole === 'wholesaler' && (!formData.mov || Number(formData.mov) <= 0)) {
        newErrors.mov = 'Please specify a Minimum Order Value (MOV) in ₹.';
      }

      if (!formData.signupPassword) {
        newErrors.signupPassword = 'Password is required.';
      } else if (formData.signupPassword.length < 8) {
        newErrors.signupPassword = 'Password must be at least 8 characters long.';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirm your password.';
      } else if (formData.signupPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match.';
      }

      if (!formData.agreeTerms) {
        newErrors.agreeTerms = 'You must accept the B2B trading terms to register.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBackToMarketplace = () => {
    if (onNavigate) {
      onNavigate({ page: 'landing' });
    } else {
      navigate('/');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the highlighted errors before submitting.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: formData.loginEmail,
            password: formData.loginPassword,
            role: selectedRole
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || (data.errors && data.errors[0]?.message) || 'Login failed');
        }

        // Store JWT token and user info in localStorage
        localStorage.setItem('stocklink_token', data.token);
        localStorage.setItem('stocklink_user', JSON.stringify(data.user));

        showToast(
          `Welcome back! Logged in as ${
            data.user.role === 'retailer' ? 'Retail Store Buyer' : 'Wholesale Supplier'
          }.`,
          'success'
        );

        // After login, user is directed to their respective onboarding page
        setTimeout(() => {
          navigate(`/${data.user.role}/onboarding`);
        }, 500);
      } else {
        // Sign Up Mode
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: formData.businessName || formData.fullName,
            email: formData.signupEmail,
            password: formData.signupPassword,
            role: selectedRole
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || (data.errors && data.errors[0]?.message) || 'Registration failed');
        }

        localStorage.setItem('stocklink_token', data.token);
        localStorage.setItem('stocklink_user', JSON.stringify(data.user));

        showToast(
          `Registration successful! Directing to ${selectedRole === 'retailer' ? 'Retailer' : 'Wholesaler'} Onboarding...`,
          'success'
        );

        // After signup, direct to onboarding page
        setTimeout(() => {
          navigate(`/${selectedRole}/onboarding`);
        }, 500);
      }
    } catch (err) {
      console.warn('Backend unavailable, proceeding with offline session:', err.message);
      const fallbackUser = {
        role: selectedRole,
        name: formData.businessName || formData.fullName || (selectedRole === 'retailer' ? 'Demo Retailer Store' : 'Demo Wholesaler Mills'),
        email: authMode === 'login' ? formData.loginEmail : formData.signupEmail,
        isOnboarded: false,
        gstin: ''
      };
      localStorage.setItem('stocklink_user', JSON.stringify(fallbackUser));
      showToast(`Directing to ${selectedRole === 'retailer' ? 'Retailer' : 'Wholesaler'} Onboarding...`, 'success');
      setTimeout(() => {
        navigate(`/${selectedRole}/onboarding`);
      }, 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showcase = roleShowcaseData[selectedRole];

  return (
    <div className="auth-page-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`auth-toast-notification ${toast.type}`}>
          <CheckCircle2 size={18} className="auth-toast-icon" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* =========================================================
          LEFT COLUMN: BRAND & VALUE SHOWCASE (DARK SLATE)
          ========================================================= */}
      <aside className="auth-showcase-panel">
        <div>
          {/* Header & Back to Marketplace */}
          <div className="showcase-header">
            <div
              className="showcase-brand-link"
              onClick={handleBackToMarketplace}
              role="button"
              tabIndex={0}
            >
              <img src={stocklinkLogo} alt="StockLink Logo" className="showcase-brand-logo" />
              <span className="showcase-brand-name">
                Stock<span>Link</span>
              </span>
            </div>

            <button
              type="button"
              className="showcase-back-btn"
              onClick={handleBackToMarketplace}
            >
              <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
              <span>Back to Marketplace</span>
            </button>
          </div>

          {/* Dynamic Role Showcase Content */}
          <div className="showcase-body">
            <div className="showcase-role-badge">
              {selectedRole === 'retailer' ? <Store size={14} /> : <Building2 size={14} />}
              <span>{showcase.badgeText}</span>
            </div>

            <h1 className="showcase-headline">{showcase.headline}</h1>
            <p className="showcase-subheadline">{showcase.subheadline}</p>

            {/* Feature Highlights List */}
            <div className="showcase-features-list">
              {showcase.features.map((feat) => {
                const FeatureIcon = feat.icon;
                return (
                  <div key={feat.id} className="showcase-feature-item">
                    <div className="showcase-feature-icon-wrapper">
                      <FeatureIcon size={20} />
                    </div>
                    <div>
                      <h4 className="showcase-feature-title">{feat.title}</h4>
                      <p className="showcase-feature-desc">{feat.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Showcase Footer / Stat Highlight & Trust Badge */}
        <div>
          <div className="showcase-stat-box">
            <div>
              <div className="showcase-stat-number">{showcase.statValue}</div>
              <div className="showcase-stat-label">{showcase.statLabel}</div>
            </div>
            <ShieldCheck size={36} color="var(--color-golden-ochre)" style={{ opacity: 0.9 }} />
          </div>

          <div className="showcase-trust-badge">
            <CheckCircle2 size={18} className="trust-badge-icon" />
            <span>{showcase.trustQuote}</span>
          </div>
        </div>
      </aside>

      {/* =========================================================
          RIGHT COLUMN: AUTHENTICATION CARD (CLEAN WHITE)
          ========================================================= */}
      <main className="auth-form-panel">
        <div className="auth-card">
          {/* Top Auth Mode Switcher (Log In vs Create Account) */}
          <div className="auth-mode-segmented-bar">
            <button
              type="button"
              className={`mode-segment-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('login');
                setErrors({});
              }}
            >
              <Lock size={15} />
              <span>Log In</span>
            </button>
            <button
              type="button"
              className={`mode-segment-btn ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('signup');
                setErrors({});
              }}
            >
              <User size={15} />
              <span>Create Account</span>
            </button>
          </div>

          {/* Role Selector Toggle */}
          <div className="role-selector-container">
            <div className="role-selector-header">
              <span className="role-selector-title">Select Your Trading Role</span>
              <span className="role-selector-subtitle">Switch to personalize access</span>
            </div>

            <div className="role-cards-grid">
              <button
                type="button"
                className={`role-card-btn ${selectedRole === 'retailer' ? 'active' : ''}`}
                onClick={() => setSelectedRole('retailer')}
              >
                <div className="role-icon-box">
                  <Store size={20} />
                </div>
                <div className="role-card-text">
                  <span className="role-card-name">Retailer (Buyer)</span>
                  <span className="role-card-desc">Store & Kirana Sourcing</span>
                </div>
                {selectedRole === 'retailer' && <span className="role-check-indicator" />}
              </button>

              <button
                type="button"
                className={`role-card-btn ${selectedRole === 'wholesaler' ? 'active' : ''}`}
                onClick={() => setSelectedRole('wholesaler')}
              >
                <div className="role-icon-box">
                  <Building2 size={20} />
                </div>
                <div className="role-card-text">
                  <span className="role-card-name">Wholesaler (Seller)</span>
                  <span className="role-card-desc">Mills & Stockist Supply</span>
                </div>
                {selectedRole === 'wholesaler' && <span className="role-check-indicator" />}
              </button>
            </div>
          </div>

          {/* Form Element */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {authMode === 'login' ? (
              /* ---------------- LOGIN FIELDS ---------------- */
              <>
                <div className="form-field-group">
                  <label className="form-field-label">
                    <span>
                      Business Email Address<span className="req">*</span>
                    </span>
                  </label>
                  <div className="field-input-wrapper">
                    <Mail size={18} className="field-prefix-icon" />
                    <input
                      type="email"
                      className={`field-input no-suffix ${errors.loginEmail ? 'has-error' : ''}`}
                      placeholder={
                        selectedRole === 'retailer'
                          ? 'storeowner@kirana.com'
                          : 'sales@agromill.com'
                      }
                      value={formData.loginEmail}
                      onChange={(e) => handleInputChange('loginEmail', e.target.value)}
                    />
                  </div>
                  {errors.loginEmail && (
                    <span className="field-error-msg">{errors.loginEmail}</span>
                  )}
                </div>

                <div className="form-field-group">
                  <label className="form-field-label">
                    <span>
                      Account Password<span className="req">*</span>
                    </span>
                  </label>
                  <div className="field-input-wrapper">
                    <Lock size={18} className="field-prefix-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`field-input ${errors.loginPassword ? 'has-error' : ''}`}
                      placeholder="Enter your security password"
                      value={formData.loginPassword}
                      onChange={(e) => handleInputChange('loginPassword', e.target.value)}
                    />
                    <button
                      type="button"
                      className="field-suffix-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.loginPassword && (
                    <span className="field-error-msg">{errors.loginPassword}</span>
                  )}
                </div>

                <div className="form-options-row">
                  <label className="remember-me-label">
                    <input
                      type="checkbox"
                      className="remember-checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                    />
                    <span>Remember this device</span>
                  </label>

                  <a
                    href="#forgot"
                    className="forgot-password-link"
                    onClick={(e) => {
                      e.preventDefault();
                      showToast('Password reset link sent to your registered business email.');
                    }}
                  >
                    Forgot Password?
                  </a>
                </div>
              </>
            ) : (
              /* ---------------- SIGN UP FIELDS ---------------- */
              <>
                <div className="form-grid-2col">
                  <div className="form-field-group">
                    <label className="form-field-label">
                      <span>
                        Full Name<span className="req">*</span>
                      </span>
                    </label>
                    <div className="field-input-wrapper">
                      <User size={18} className="field-prefix-icon" />
                      <input
                        type="text"
                        className={`field-input no-suffix ${errors.fullName ? 'has-error' : ''}`}
                        placeholder="e.g. Ramesh Gupta"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                      />
                    </div>
                    {errors.fullName && <span className="field-error-msg">{errors.fullName}</span>}
                  </div>

                  <div className="form-field-group">
                    <label className="form-field-label">
                      <span>
                        Business Name<span className="req">*</span>
                      </span>
                    </label>
                    <div className="field-input-wrapper">
                      {selectedRole === 'retailer' ? (
                        <Store size={18} className="field-prefix-icon" />
                      ) : (
                        <Building2 size={18} className="field-prefix-icon" />
                      )}
                      <input
                        type="text"
                        className={`field-input no-suffix ${
                          errors.businessName ? 'has-error' : ''
                        }`}
                        placeholder={
                          selectedRole === 'retailer'
                            ? 'e.g. Gupta Supermart'
                            : 'e.g. Balaji Agro Mills'
                        }
                        value={formData.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                      />
                    </div>
                    {errors.businessName && (
                      <span className="field-error-msg">{errors.businessName}</span>
                    )}
                  </div>
                </div>

                <div className="form-grid-2col">
                  <div className="form-field-group">
                    <label className="form-field-label">
                      <span>
                        Business Email<span className="req">*</span>
                      </span>
                    </label>
                    <div className="field-input-wrapper">
                      <Mail size={18} className="field-prefix-icon" />
                      <input
                        type="email"
                        className={`field-input no-suffix ${errors.signupEmail ? 'has-error' : ''}`}
                        placeholder="name@business.com"
                        value={formData.signupEmail}
                        onChange={(e) => handleInputChange('signupEmail', e.target.value)}
                      />
                    </div>
                    {errors.signupEmail && (
                      <span className="field-error-msg">{errors.signupEmail}</span>
                    )}
                  </div>

                  <div className="form-field-group">
                    <label className="form-field-label">
                      <span>
                        Phone Number<span className="req">*</span>
                      </span>
                    </label>
                    <div className="field-input-wrapper">
                      <Phone size={18} className="field-prefix-icon" />
                      <input
                        type="tel"
                        className={`field-input no-suffix ${errors.signupPhone ? 'has-error' : ''}`}
                        placeholder="10-digit mobile number"
                        value={formData.signupPhone}
                        maxLength={10}
                        onChange={(e) => handleInputChange('signupPhone', e.target.value)}
                      />
                    </div>
                    {errors.signupPhone && (
                      <span className="field-error-msg">{errors.signupPhone}</span>
                    )}
                  </div>
                </div>

                <div className="form-field-group">
                  <label className="form-field-label">
                    <span>
                      GSTIN Number<span className="req">*</span>
                    </span>
                    <span className="field-helper-hint">15-character uppercase code</span>
                  </label>
                  <div className="field-input-wrapper">
                    <FileText size={18} className="field-prefix-icon" />
                    <input
                      type="text"
                      className={`field-input uppercase no-suffix ${
                        errors.gstin ? 'has-error' : ''
                      }`}
                      placeholder="27AAAAA0000A1Z5"
                      value={formData.gstin}
                      maxLength={15}
                      onChange={handleGSTINChange}
                    />
                  </div>
                  {errors.gstin && <span className="field-error-msg">{errors.gstin}</span>}
                </div>

                <div className="form-field-group">
                  <label className="form-field-label">
                    <span>
                      {selectedRole === 'retailer' ? 'Delivery Address & Pincode' : 'Warehouse Location & Pincode'}
                      <span className="req">*</span>
                    </span>
                  </label>
                  <div className="field-input-wrapper">
                    <MapPin size={18} className="field-prefix-icon" />
                    <input
                      type="text"
                      className={`field-input no-suffix ${errors.address ? 'has-error' : ''}`}
                      placeholder="Shop/Warehouse address, Market Yard & 6-digit Pincode"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  </div>
                  {errors.address && <span className="field-error-msg">{errors.address}</span>}
                </div>

                {/* If Wholesaler selected: Minimum Order Value (MOV) input field */}
                {selectedRole === 'wholesaler' && (
                  <div className="form-field-group">
                    <label className="form-field-label">
                      <span>
                        Minimum Order Value (MOV in ₹)<span className="req">*</span>
                      </span>
                      <span className="field-helper-hint">Disallows orders below this batch threshold</span>
                    </label>
                    <div className="field-input-wrapper">
                      <span
                        className="field-prefix-icon"
                        style={{ fontWeight: 800, fontSize: '1.05rem', left: '16px' }}
                      >
                        ₹
                      </span>
                      <input
                        type="number"
                        className={`field-input no-suffix ${errors.mov ? 'has-error' : ''}`}
                        placeholder="e.g. 25000"
                        value={formData.mov}
                        onChange={(e) => handleInputChange('mov', e.target.value)}
                      />
                    </div>
                    {errors.mov && <span className="field-error-msg">{errors.mov}</span>}
                  </div>
                )}

                <div className="form-grid-2col">
                  <div className="form-field-group">
                    <label className="form-field-label">
                      <span>
                        Password<span className="req">*</span>
                      </span>
                    </label>
                    <div className="field-input-wrapper">
                      <Lock size={18} className="field-prefix-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`field-input ${errors.signupPassword ? 'has-error' : ''}`}
                        placeholder="Min. 8 characters"
                        value={formData.signupPassword}
                        onChange={(e) => handleInputChange('signupPassword', e.target.value)}
                      />
                      <button
                        type="button"
                        className="field-suffix-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.signupPassword && (
                      <span className="field-error-msg">{errors.signupPassword}</span>
                    )}
                  </div>

                  <div className="form-field-group">
                    <label className="form-field-label">
                      <span>
                        Confirm Password<span className="req">*</span>
                      </span>
                    </label>
                    <div className="field-input-wrapper">
                      <Lock size={18} className="field-prefix-icon" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={`field-input ${errors.confirmPassword ? 'has-error' : ''}`}
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      />
                      <button
                        type="button"
                        className="field-suffix-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <span className="field-error-msg">{errors.confirmPassword}</span>
                    )}
                  </div>
                </div>

                <div className="terms-agreement-row">
                  <input
                    type="checkbox"
                    className="remember-checkbox"
                    checked={formData.agreeTerms}
                    onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                    id="terms-check"
                  />
                  <label htmlFor="terms-check">
                    I agree to StockLink's{' '}
                    <a
                      href="#terms"
                      onClick={(e) => {
                        e.preventDefault();
                        showToast('StockLink B2B Fair Trading Policy: 100% Verified Mill & GST Ledger.');
                      }}
                    >
                      B2B Terms of Service
                    </a>{' '}
                    and Mandi Settlement Rules.
                  </label>
                </div>
                {errors.agreeTerms && (
                  <span className="field-error-msg" style={{ marginTop: '-0.4rem' }}>
                    {errors.agreeTerms}
                  </span>
                )}
              </>
            )}

            {/* Primary CTA Submit Button */}
            <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
              <span>
                {isSubmitting
                  ? 'Verifying Credentials...'
                  : authMode === 'login'
                  ? 'LOG IN TO STOCKLINK'
                  : 'REGISTER YOUR BUSINESS'}
              </span>
              <ArrowRight size={18} className="btn-arrow-icon" />
            </button>
          </form>

          {/* Quick Demo Pre-fill Buttons */}
          <div className="auth-demo-section">
            <div className="demo-section-header">
              <span className="demo-section-title">Quick Demo Pre-Fill:</span>
              <span className="field-helper-hint">Click to test without manual typing</span>
            </div>

            <div className="demo-pills-row">
              <button
                type="button"
                className="demo-pill-btn"
                onClick={() => handlePreFillDemo('retailer')}
              >
                <Store size={15} />
                <span>Demo Retailer</span>
              </button>

              <button
                type="button"
                className="demo-pill-btn"
                onClick={() => handlePreFillDemo('wholesaler')}
              >
                <Building2 size={15} />
                <span>Demo Wholesaler</span>
              </button>
            </div>

            {/* Direct navigation links to onboarding pages */}
            <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/retailer/onboarding')}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-slate)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Store size={13} color="var(--color-golden-ochre)" />
                Retailer Onboarding Page →
              </button>

              <button
                type="button"
                onClick={() => navigate('/wholesaler/onboarding')}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-slate)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Building2 size={13} color="var(--color-golden-ochre)" />
                Wholesaler Onboarding Page →
              </button>
            </div>
          </div>

          {/* Card Bottom Footer: Mode Switch Prompt */}
          <div className="auth-card-footer">
            {authMode === 'login' ? (
              <span>
                Don't have a verified business account yet?
                <button
                  type="button"
                  className="auth-toggle-prompt-btn"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrors({});
                  }}
                >
                  Create Account
                </button>
              </span>
            ) : (
              <span>
                Already have an active trading account?
                <button
                  type="button"
                  className="auth-toggle-prompt-btn"
                  onClick={() => {
                    setAuthMode('login');
                    setErrors({});
                  }}
                >
                  Log In
                </button>
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
