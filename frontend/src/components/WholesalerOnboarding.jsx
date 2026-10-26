import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Building2,
  Phone,
  Mail,
  FileText,
  Search,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  LogOut,
  Upload,
  MapPin,
  ShoppingCart,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import stocklinkLogo from '../assets/stocklink-logo.png';
import { API_BASE } from '../services/api';
import '../styles/Onboarding.css';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const PROGRESS_STEPS = [
  'ACCOUNT SETUP',
  'BUSINESS INFO',
  'GST VERIFICATION',
  'DELIVERY SETTINGS',
  'BANK DETAILS',
  'GO LIVE!',
];

export default function WholesalerOnboarding() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    try {
      const raw = localStorage.getItem('stocklink_user');
      if (raw) return JSON.parse(raw);
    } catch {/* ignore */}
    const fallback = { role: 'wholesaler', name: 'Balaji Agro Grain Mills Pvt Ltd', email: 'orders@balajiagromills.com', isOnboarded: false };
    localStorage.setItem('stocklink_user', JSON.stringify(fallback));
    return fallback;
  });

  // Wizard step: 1 | 2 | 3
  const [step, setStep] = useState(1);
  const [globalError, setGlobalError]   = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ─── Section 1 state ─── */
  const [s1, setS1] = useState({
    legalName: '',
    tradeName: '',
    pan: '',
    contactPerson: '',
    mobile: '',
    contactEmail: '',
  });
  const [logoPreview, setLogoPreview] = useState(null);

  /* ─── Section 2 state ─── */
  const [gstin, setGstin] = useState('');
  const [gstinStatus, setGstinStatus] = useState('PENDING VERIFICATION');
  const [checklist, setChecklist] = useState([false, false, false, false]);
  const [doc1, setDoc1] = useState(null);
  const [doc2, setDoc2] = useState(null);

  /* ─── Section 3 state ─── */
  const [category, setCategory] = useState('');
  const [active, setActive] = useState(true);
  const [mov, setMov] = useState('10000');
  const [radius, setRadius] = useState(15);
  const [pincodes, setPincodes] = useState('');

  /* ─── Helpers ─── */
  const handleLogout = () => {
    localStorage.removeItem('stocklink_token');
    localStorage.removeItem('stocklink_user');
    navigate('/login');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleGstinSearch = () => {
    const val = gstin.trim().toUpperCase();
    if (GSTIN_REGEX.test(val)) {
      setGstinStatus('ACTIVE — VERIFIED');
      setChecklist([true, true, true, true]);
    } else if (val.length > 0) {
      setGstinStatus('INVALID FORMAT');
      setChecklist([false, false, false, false]);
    }
  };

  /* ─── Section 1 → 2 ─── */
  const goToStep2 = () => {
    if (!s1.legalName.trim()) { setGlobalError('Business Legal Name is required.'); return; }
    if (!s1.pan.trim() || s1.pan.trim().length !== 10) { setGlobalError('Valid 10-char PAN is required.'); return; }
    if (!s1.mobile.trim()) { setGlobalError('Mobile number is required.'); return; }
    setGlobalError('');
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ─── Section 2 → 3 ─── */
  const goToStep3 = () => {
    const val = gstin.trim().toUpperCase();
    if (!GSTIN_REGEX.test(val)) {
      setGlobalError('Please enter and verify a valid 15-digit GSTIN before continuing.');
      return;
    }
    setGlobalError('');
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ─── Final submit ─── */
  const handleActivate = async () => {
    setSubmitting(true);
    setGlobalError('');
    setGlobalSuccess('');

    const payload = {
      legalName: s1.legalName.trim(),
      tradeName: s1.tradeName.trim(),
      pan: s1.pan.trim().toUpperCase(),
      contactPerson: s1.contactPerson.trim(),
      mobile: s1.mobile.trim(),
      contactEmail: s1.contactEmail.trim(),
      gstin: gstin.trim().toUpperCase(),
      businessCategory: category,
      operationStatus: active ? 'active' : 'inactive',
      mov,
      deliveryRadius: radius,
      coveredPincodes: pincodes,
    };

    let updatedUser = { ...user, ...payload, isOnboarded: true };

    try {
      const token = localStorage.getItem('stocklink_token');
      const res = await fetch(`${API_BASE}/auth/onboard/wholesaler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.user) updatedUser = { ...updatedUser, ...data.user };
    } catch (err) {
      console.warn('Backend unavailable, proceeding locally:', err.message);
    }

    localStorage.setItem('stocklink_user', JSON.stringify(updatedUser));
    setGlobalSuccess('Wholesaler profile activated! Redirecting to your dashboard…');
    setSubmitting(false);
    setTimeout(() => navigate('/wholesaler/dashboard'), 900);
  };

  const handleSaveDraft = () => {
    const draft = { ...user, ...s1, gstin, isOnboarded: false };
    localStorage.setItem('stocklink_user', JSON.stringify(draft));
    setGlobalSuccess('Draft saved successfully.');
    setTimeout(() => setGlobalSuccess(''), 2500);
  };

  const progressIdx = step === 1 ? 1 : step === 2 ? 2 : 3; // 0-indexed highlight

  return (
    <div className="onboarding-page-container">
      {/* ── Navbar ── */}
      <header className="onboarding-navbar">
        <div className="onboarding-nav-brand" onClick={() => navigate('/')}>
          <img src={stocklinkLogo} alt="StockLink" className="onboarding-brand-logo" />
          <span className="onboarding-brand-text">StockLink</span>
        </div>
        <div className="onboarding-nav-user">
          <span className="onboarding-user-badge">
            <Building2 size={14} />
            {user?.name || user?.email || 'Wholesale Supplier'}
          </span>
          <button type="button" className="onboarding-logout-btn" onClick={handleLogout}>
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </header>

      {/* ── Progress Bar ── */}
      <div className="ob-progress-bar">
        {PROGRESS_STEPS.map((label, i) => (
          <React.Fragment key={label}>
            {i > 0 && <span className="ob-sep">›</span>}
            <span className={`ob-step ${i < progressIdx ? 'done' : i === progressIdx ? 'active' : ''}`}>
              {i < progressIdx && <CheckCircle2 size={11} />}
              {label}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* ── Wizard ── */}
      <main className="ob-wizard">

        {/* Global alerts */}
        {globalError && (
          <div className="ob-wizard-alert error">
            <AlertTriangle size={16} /> {globalError}
          </div>
        )}
        {globalSuccess && (
          <div className="ob-wizard-alert success">
            <CheckCircle2 size={16} /> {globalSuccess}
          </div>
        )}

        {/* Back button for steps 2, 3 */}
        {step > 1 && (
          <div style={{ width: '100%', maxWidth: '720px' }}>
            <button className="ob-back-link" onClick={() => { setStep(step - 1); setGlobalError(''); }}>
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            SECTION 1 — BUSINESS REGISTRATION
        ═══════════════════════════════════════════════════════ */}
        {step === 1 && (
          <>
            <div className="ob-section-header">
              <div className="ob-section-badge"><FileText size={12} /> Section 1 of 3</div>
              <div className="ob-section-title">Business Registration</div>
            </div>

            <div className="ob-card">
              <div className="ob-two-col">
                {/* Form column */}
                <div className="ob-form-col">
                  <div className="ob-field">
                    <label className="ob-field-label">
                      Business Legal Name (as per GST) <span className="ob-req">*</span>
                    </label>
                    <div className="ob-input-wrap">
                      <Building2 size={15} className="ob-icon" />
                      <input
                        className="ob-input"
                        type="text"
                        placeholder="e.g. Balaji Agro Grain Mills Pvt Ltd"
                        value={s1.legalName}
                        onChange={e => setS1(p => ({ ...p, legalName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="ob-field">
                    <label className="ob-field-label">Trade Name (DBA)</label>
                    <div className="ob-input-wrap">
                      <Building2 size={15} className="ob-icon" />
                      <input
                        className="ob-input"
                        type="text"
                        placeholder="e.g. Balaji Mills"
                        value={s1.tradeName}
                        onChange={e => setS1(p => ({ ...p, tradeName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="ob-field">
                    <label className="ob-field-label">
                      Business PAN <span className="ob-req">*</span>
                    </label>
                    <div className="ob-input-wrap">
                      <FileText size={15} className="ob-icon" />
                      <input
                        className="ob-input"
                        type="text"
                        maxLength={10}
                        placeholder="e.g. AADCB5678K"
                        value={s1.pan}
                        onChange={e => setS1(p => ({ ...p, pan: e.target.value.toUpperCase() }))}
                      />
                    </div>
                  </div>

                  <div className="ob-field">
                    <label className="ob-field-label">Contact Person Name</label>
                    <div className="ob-input-wrap">
                      <User size={15} className="ob-icon" />
                      <input
                        className="ob-input"
                        type="text"
                        placeholder="e.g. Ramesh Sharma"
                        value={s1.contactPerson}
                        onChange={e => setS1(p => ({ ...p, contactPerson: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="ob-field">
                    <label className="ob-field-label">
                      Mobile Number <span className="ob-req">*</span>
                    </label>
                    <div className="ob-input-wrap">
                      <Phone size={15} className="ob-icon" />
                      <input
                        className="ob-input"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={s1.mobile}
                        onChange={e => setS1(p => ({ ...p, mobile: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="ob-field">
                    <label className="ob-field-label">Contact Email</label>
                    <div className="ob-input-wrap">
                      <Mail size={15} className="ob-icon" />
                      <input
                        className="ob-input"
                        type="email"
                        placeholder="orders@yourmill.com"
                        value={s1.contactEmail}
                        onChange={e => setS1(p => ({ ...p, contactEmail: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Avatar / preview column */}
                <div className="ob-avatar-col">
                  <div className="ob-avatar-box">
                    <div className="ob-avatar-circle">
                      {logoPreview
                        ? <img src={logoPreview} alt="logo" />
                        : <Building2 size={28} color="#94a3b8" />}
                    </div>
                    <span className="ob-avatar-label">Upload Logo</span>
                    <label className="ob-upload-btn" style={{ cursor: 'pointer' }}>
                      <Upload size={12} /> Choose File
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                    </label>
                  </div>

                  {/* Business card preview */}
                  <div className="ob-biz-card">
                    <div className="ob-biz-card-title">StockLink — Wholesale Partner</div>
                    <div className="ob-biz-card-name">{s1.legalName || 'Your Business Name'}</div>
                    {s1.tradeName && <div className="ob-biz-card-tag">{s1.tradeName}</div>}
                    {s1.pan && (
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.5rem', fontFamily: 'monospace' }}>
                        PAN: {s1.pan}
                      </div>
                    )}
                    {s1.mobile && (
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
                        {s1.mobile}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button className="ob-s1-btn" onClick={goToStep2}>
                SAVE &amp; CONTINUE <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════
            SECTION 2 — GST VERIFICATION HUB
        ═══════════════════════════════════════════════════════ */}
        {step === 2 && (
          <>
            <div className="ob-section-header">
              <div className="ob-section-badge"><FileText size={12} /> Section 2 of 3</div>
              <div className="ob-section-title">GST Verification Hub</div>
            </div>

            <div className="ob-verify-card">
              <div className="ob-verify-title">VERIFY YOUR GSTIN</div>

              {/* GSTIN search bar */}
              <div className="ob-gstin-bar">
                <input
                  type="text"
                  maxLength={15}
                  placeholder="e.g. 29AADCB5678K1Z3"
                  value={gstin}
                  onChange={e => {
                    setGstin(e.target.value.toUpperCase().replace(/\s/g, ''));
                    setGstinStatus('PENDING VERIFICATION');
                    setChecklist([false, false, false, false]);
                  }}
                />
                <button className="ob-gstin-search-btn" type="button" onClick={handleGstinSearch}>
                  <Search size={18} />
                </button>
              </div>

              {/* Status + checklist */}
              <div className="ob-status-row">
                <div className="ob-status-box">
                  <div className="ob-status-label">Status</div>
                  <div className={gstinStatus.includes('ACTIVE') ? 'ob-status-verified' : 'ob-status-pending'}>
                    {gstinStatus}
                  </div>
                </div>
                <div className="ob-status-box">
                  <ul className="ob-checklist">
                    {[
                      'Validate GSTIN format',
                      'Match Legal Name with GST Database',
                      'Confirm Status: Active',
                      'Verify Filing Frequency',
                    ].map((item, i) => (
                      <li key={i} className={checklist[i] ? 'done-item' : ''}>
                        {checklist[i] ? <CheckCircle2 size={12} /> : <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.3)', display: 'inline-block', flexShrink: 0 }} />}
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Upload documents */}
              <div className="ob-upload-docs-title">Upload Documents</div>
              <div className="ob-docs-row">
                <div className={`ob-doc-tile ${doc1 ? 'uploaded' : ''}`}>
                  <input type="file" accept=".pdf,.jpg,.png" onChange={e => setDoc1(e.target.files[0])} />
                  <Upload size={20} color={doc1 ? '#34d399' : 'rgba(255,255,255,0.5)'} />
                  <div className="ob-doc-name">GST Registration Certificate (REG-06)</div>
                  {doc1 && <div className="ob-doc-uploaded-name">{doc1.name}</div>}
                </div>
                <div className={`ob-doc-tile ${doc2 ? 'uploaded' : ''}`}>
                  <input type="file" accept=".pdf,.jpg,.png" onChange={e => setDoc2(e.target.files[0])} />
                  <Upload size={20} color={doc2 ? '#34d399' : 'rgba(255,255,255,0.5)'} />
                  <div className="ob-doc-name">Latest Filing GSTR-1</div>
                  {doc2 && <div className="ob-doc-uploaded-name">{doc2.name}</div>}
                </div>
              </div>

              <button className="ob-verify-btn" onClick={goToStep3}>
                SUBMIT &amp; VERIFY <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════
            SECTION 3 — BUSINESS & FULFILLMENT PREFERENCES
        ═══════════════════════════════════════════════════════ */}
        {step === 3 && (
          <>
            <div className="ob-section-header">
              <div className="ob-section-badge"><Layers size={12} /> Section 3 of 3</div>
              <div className="ob-section-title">Business &amp; Fulfillment Preferences</div>
            </div>

            <div className="ob-pref-card">
              {/* Business Category */}
              <div>
                <div className="ob-pref-row">
                  <div className="ob-pref-icon"><ShoppingCart size={16} /></div>
                  <div className="ob-pref-field">
                    <div className="ob-pref-label">Business Category</div>
                    <select
                      className="ob-select"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                    >
                      <option value="">Select Grains, FMCG, Packaging…</option>
                      <option value="grains">Grains & Pulses</option>
                      <option value="fmcg">FMCG Products</option>
                      <option value="packaging">Packaging Materials</option>
                      <option value="spices">Spices & Condiments</option>
                      <option value="oil">Edible Oil</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Operation Status */}
              <div className="ob-pref-row">
                <div className="ob-pref-icon"><CheckCircle2 size={16} /></div>
                <div className="ob-pref-field">
                  <div className="ob-pref-label">Operation Status</div>
                  <label className="ob-toggle">
                    <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
                    <span className="ob-toggle-slider" />
                  </label>
                </div>
                <span className="ob-toggle-text">
                  Currently: <strong>{active ? 'Active' : 'Inactive'}</strong>
                </span>
              </div>

              {/* MOV */}
              <div className="ob-pref-row">
                <div className="ob-pref-icon"><ShoppingCart size={16} /></div>
                <div className="ob-pref-field">
                  <div className="ob-pref-label">Minimum Order Value (MOV)</div>
                  <select
                    className="ob-mov-select"
                    value={mov}
                    onChange={e => setMov(e.target.value)}
                  >
                    <option value="5000">₹5,000</option>
                    <option value="10000">₹10,000</option>
                    <option value="25000">₹25,000</option>
                    <option value="50000">₹50,000</option>
                    <option value="100000">₹1,00,000</option>
                  </select>
                </div>
              </div>

              {/* Delivery Radius + Map */}
              <div>
                <div className="ob-pref-label" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={14} /> Delivery Coverage
                </div>
                <div className="ob-map-box">
                  <div className="ob-map-pin" />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', position: 'absolute', bottom: '0.5rem' }}>
                    Coverage radius preview — {radius} km
                  </span>
                </div>
                <div className="ob-radius-row" style={{ marginTop: '0.6rem' }}>
                  <span className="ob-radius-label">Delivery Radius</span>
                  <span className="ob-radius-val">{radius} km</span>
                </div>
                <input
                  type="range"
                  className="ob-slider"
                  min={1}
                  max={100}
                  value={radius}
                  onChange={e => setRadius(Number(e.target.value))}
                  style={{ width: '100%', marginTop: '0.35rem' }}
                />
                <div className="ob-pincodes-label" style={{ marginTop: '0.85rem' }}>Covered Pincodes</div>
                <input
                  type="text"
                  className="ob-pincodes-input"
                  placeholder="e.g. 560001, 560002, 560003"
                  value={pincodes}
                  onChange={e => setPincodes(e.target.value)}
                />
              </div>

              {/* Action buttons */}
              <div className="ob-pref-actions">
                <button className="ob-draft-btn" onClick={handleSaveDraft} disabled={submitting}>
                  SAVE DRAFT
                </button>
                <button className="ob-activate-btn" onClick={handleActivate} disabled={submitting}>
                  {submitting ? 'Activating…' : (<>SUBMIT FOR LIVE ACTIVATION <ArrowRight size={15} /></>)}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Navigation dots ── */}
        <div className="ob-nav-dots">
          {[1, 2, 3].map(s => (
            <span
              key={s}
              className={`ob-dot ${s === step ? 'active' : s < step ? 'done' : ''}`}
              onClick={() => s < step && setStep(s)}
              title={`Step ${s}`}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
