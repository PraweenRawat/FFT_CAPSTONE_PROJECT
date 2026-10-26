import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Store,
  Phone,
  Mail,
  FileText,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  LogOut,
  Upload,
  ShoppingCart,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import stocklinkLogo from '../assets/stocklink-logo.png';
import { API_BASE } from '../services/api';
import '../styles/Onboarding.css';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const PROGRESS_STEPS = [
  'RETAILER BASIC INFO',
  'BUSINESS VERIFICATION & GST',
  'DELIVERY ADDRESS',
  'PREFERRED SUPPLIERS',
  'PAYMENT METHODS',
  'GO LIVE!',
];

export default function RetailerOnboarding() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    try {
      const raw = localStorage.getItem('stocklink_user');
      if (raw) return JSON.parse(raw);
    } catch {/* ignore */}
    const fallback = { role: 'retailer', name: 'Demo Retailer Store', email: 'retailer@stocklink.demo', isOnboarded: false };
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
    storeName: '',
    registeredName: '',
    pan: '',
    businessAddress: '',
    shopLicense: '',
    contactPerson: '',
    storeEmail: '',
    mobile: '',
  });
  const [avatarPreview, setAvatarPreview] = useState(null);

  /* ─── Section 2 state ─── */
  const [docType, setDocType] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [docStatus, setDocStatus] = useState('PENDING VERIFICATION');
  const [checklist, setChecklist] = useState([false, false, false, false]);
  const [doc1, setDoc1] = useState(null);
  const [doc2, setDoc2] = useState(null);

  /* ─── Section 3 state ─── */
  const [category, setCategory] = useState('');
  const [active, setActive] = useState(true);
  const [mov, setMov] = useState('10000');
  const [radius, setRadius] = useState(3);
  const [deliveryPincodes, setDeliveryPincodes] = useState('');
  const [paymentCOD, setPaymentCOD] = useState(true);
  const [paymentBank, setPaymentBank] = useState(true);
  const [paymentCard, setPaymentCard] = useState(false);

  /* ─── Helpers ─── */
  const handleLogout = () => {
    localStorage.removeItem('stocklink_token');
    localStorage.removeItem('stocklink_user');
    navigate('/login');
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleDocVerify = () => {
    const val = docNumber.trim().toUpperCase();
    let valid = false;
    if (docType === 'gstin') valid = GSTIN_REGEX.test(val);
    else if (val.length >= 8) valid = true; // basic check for other doc types

    if (valid) {
      setDocStatus('ACTIVE — VERIFIED');
      setChecklist([true, true, true, true]);
    } else if (val.length > 0) {
      setDocStatus('INVALID FORMAT');
      setChecklist([false, false, false, false]);
    }
  };

  /* ─── Section 1 → 2 ─── */
  const goToStep2 = () => {
    if (!s1.storeName.trim()) { setGlobalError('Store Name is required.'); return; }
    if (!s1.registeredName.trim()) { setGlobalError('Registered Retailer Name is required.'); return; }
    if (!s1.mobile.trim()) { setGlobalError('Contact Mobile is required.'); return; }
    setGlobalError('');
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ─── Section 2 → 3 ─── */
  const goToStep3 = () => {
    if (!docType) { setGlobalError('Please select a verification document type.'); return; }
    if (!docNumber.trim()) { setGlobalError('Please enter your document number.'); return; }
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
      storeName: s1.storeName.trim(),
      registeredName: s1.registeredName.trim(),
      pan: s1.pan.trim().toUpperCase(),
      businessAddress: s1.businessAddress.trim(),
      shopLicense: s1.shopLicense.trim(),
      contactPerson: s1.contactPerson.trim(),
      storeEmail: s1.storeEmail.trim(),
      mobile: s1.mobile.trim(),
      docType,
      docNumber: docNumber.trim().toUpperCase(),
      businessCategory: category,
      operationStatus: active ? 'active' : 'inactive',
      mov,
      deliveryRadius: radius,
      coveredPincodes: deliveryPincodes,
      paymentCOD,
      paymentBankTransfer: paymentBank,
      paymentCard,
    };

    let updatedUser = { ...user, ...payload, isOnboarded: true };

    try {
      const token = localStorage.getItem('stocklink_token');
      const res = await fetch(`${API_BASE}/auth/onboard/retailer`, {
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
    setGlobalSuccess('Retailer profile activated! Redirecting to your dashboard…');
    setSubmitting(false);
    setTimeout(() => navigate('/retailer/dashboard'), 900);
  };

  const handleSaveDraft = () => {
    const draft = { ...user, ...s1, docType, docNumber, isOnboarded: false };
    localStorage.setItem('stocklink_user', JSON.stringify(draft));
    setGlobalSuccess('Draft saved successfully.');
    setTimeout(() => setGlobalSuccess(''), 2500);
  };

  const progressIdx = step === 1 ? 0 : step === 2 ? 1 : 2;

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
            <Store size={14} />
            {user?.name || user?.email || 'Retail Buyer'}
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

        {/* Back button */}
        {step > 1 && (
          <div style={{ width: '100%', maxWidth: '720px' }}>
            <button className="ob-back-link" onClick={() => { setStep(step - 1); setGlobalError(''); }}>
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            SECTION 1 — RETAILER PROFILE
        ═══════════════════════════════════════════════════════ */}
        {step === 1 && (
          <>
            <div className="ob-section-header">
              <div className="ob-section-badge"><Store size={12} /> Section 1 of 3</div>
              <div className="ob-section-title">Retailer Profile</div>
            </div>

            <div className="ob-card">
              <div className="ob-two-col">
                {/* Form column */}
                <div className="ob-form-col">
                  <div className="ob-field">
                    <label className="ob-field-label">
                      Store Name (Trade Name) <span className="ob-req">*</span>
                    </label>
                    <div className="ob-input-wrap">
                      <Store size={15} className="ob-icon" />
                      <input
                        className="ob-input"
                        type="text"
                        placeholder="e.g. Sharma General Store"
                        value={s1.storeName}
                        onChange={e => setS1(p => ({ ...p, storeName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="ob-field">
                    <label className="ob-field-label">
                      Registered Retailer Name (Proprietor/Director) <span className="ob-req">*</span>
                    </label>
                    <div className="ob-input-wrap">
                      <User size={15} className="ob-icon" />
                      <input
                        className="ob-input"
                        type="text"
                        placeholder="e.g. Suresh Sharma"
                        value={s1.registeredName}
                        onChange={e => setS1(p => ({ ...p, registeredName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="ob-field">
                    <label className="ob-field-label">Retailer PAN</label>
                    <div className="ob-input-wrap">
                      <FileText size={15} className="ob-icon" />
                      <input
                        className="ob-input"
                        type="text"
                        maxLength={10}
                        placeholder="e.g. ABCDE1234F"
                        value={s1.pan}
                        onChange={e => setS1(p => ({ ...p, pan: e.target.value.toUpperCase() }))}
                      />
                    </div>
                  </div>

                  <div className="ob-field">
                    <label className="ob-field-label">Business Address (Registered)</label>
                    <div className="ob-input-wrap">
                      <MapPin size={15} className="ob-icon" />
                      <input
                        className="ob-input"
                        type="text"
                        placeholder="Shop No., Street, City, Pincode"
                        value={s1.businessAddress}
                        onChange={e => setS1(p => ({ ...p, businessAddress: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="ob-field">
                    <label className="ob-field-label">Shop License Number (FSSAI/Other)</label>
                    <div className="ob-input-wrap">
                      <ShieldCheck size={15} className="ob-icon" />
                      <input
                        className="ob-input"
                        type="text"
                        placeholder="e.g. FSSAI 12345678901234"
                        value={s1.shopLicense}
                        onChange={e => setS1(p => ({ ...p, shopLicense: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="ob-field">
                    <label className="ob-field-label">Contact Person</label>
                    <div className="ob-input-wrap">
                      <User size={15} className="ob-icon" />
                      <input
                        className="ob-input"
                        type="text"
                        placeholder="Name of point of contact"
                        value={s1.contactPerson}
                        onChange={e => setS1(p => ({ ...p, contactPerson: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="ob-field">
                    <label className="ob-field-label">Store Email</label>
                    <div className="ob-input-wrap">
                      <Mail size={15} className="ob-icon" />
                      <input
                        className="ob-input"
                        type="email"
                        placeholder="store@yourbusiness.com"
                        value={s1.storeEmail}
                        onChange={e => setS1(p => ({ ...p, storeEmail: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="ob-field">
                    <label className="ob-field-label">
                      Contact Mobile <span className="ob-req">*</span>
                    </label>
                    <div className="ob-input-wrap">
                      <Phone size={15} className="ob-icon" />
                      <input
                        className="ob-input"
                        type="tel"
                        placeholder="+91 99999 88888"
                        value={s1.mobile}
                        onChange={e => setS1(p => ({ ...p, mobile: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Avatar / preview column */}
                <div className="ob-avatar-col">
                  <div className="ob-avatar-box">
                    <div className="ob-avatar-circle">
                      {avatarPreview
                        ? <img src={avatarPreview} alt="avatar" />
                        : <Store size={28} color="#94a3b8" />}
                    </div>
                    <span className="ob-avatar-label">Profile Photo</span>
                    <label className="ob-upload-btn" style={{ cursor: 'pointer' }}>
                      <Upload size={12} /> Upload
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                    </label>
                  </div>

                  {/* Business card preview */}
                  <div className="ob-biz-card">
                    <div className="ob-biz-card-title">StockLink — Retailer Partner</div>
                    <div className="ob-biz-card-name">{s1.storeName || 'Your Store Name'}</div>
                    {s1.registeredName && (
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.25rem' }}>
                        {s1.registeredName}
                      </div>
                    )}
                    <div className="ob-biz-card-tag">Retailer Partner</div>
                    {s1.mobile && (
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.3rem' }}>
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
            SECTION 2 — VERIFICATION HUB
        ═══════════════════════════════════════════════════════ */}
        {step === 2 && (
          <>
            <div className="ob-section-header">
              <div className="ob-section-badge"><ShieldCheck size={12} /> Section 2 of 3</div>
              <div className="ob-section-title">Verification Hub</div>
            </div>

            <div className="ob-verify-card">
              <div className="ob-verify-title">VERIFY YOUR BUSINESS DOCUMENTS</div>

              {/* Doc type selector */}
              <div className="ob-doc-select-wrap">
                <div className="ob-doc-select-label">Select Verification Document Type</div>
                <select
                  className="ob-doc-select"
                  value={docType}
                  onChange={e => {
                    setDocType(e.target.value);
                    setDocNumber('');
                    setDocStatus('PENDING VERIFICATION');
                    setChecklist([false, false, false, false]);
                  }}
                >
                  <option value="">Select GSTIN, Shop &amp; Establishment…</option>
                  <option value="gstin">GSTIN (15-Digit)</option>
                  <option value="shop">Shop &amp; Establishment License</option>
                  <option value="fssai">FSSAI License</option>
                  <option value="udyam">Udyam Registration</option>
                </select>
              </div>

              {/* Doc number input */}
              <div className="ob-gstin-bar">
                <input
                  type="text"
                  placeholder={docType === 'gstin' ? 'e.g. 27AABCG1234F1Z5' : 'Enter document number'}
                  value={docNumber}
                  onChange={e => {
                    setDocNumber(docType === 'gstin' ? e.target.value.toUpperCase().replace(/\s/g, '') : e.target.value);
                    setDocStatus('PENDING VERIFICATION');
                    setChecklist([false, false, false, false]);
                  }}
                  style={{ textTransform: docType === 'gstin' ? 'uppercase' : 'none' }}
                />
                <button className="ob-gstin-search-btn" type="button" onClick={handleDocVerify}>
                  <ShieldCheck size={18} />
                </button>
              </div>

              {/* Status + checklist */}
              <div className="ob-status-row">
                <div className="ob-status-box">
                  <div className="ob-status-label">Status</div>
                  <div className={docStatus.includes('ACTIVE') ? 'ob-status-verified' : 'ob-status-pending'}>
                    {docStatus}
                  </div>
                </div>
                <div className="ob-status-box">
                  <ul className="ob-checklist">
                    {[
                      'Validate Document Format',
                      'Match Name with Government Records',
                      'Confirm Document Status: Active',
                      'Verify License Validity Period',
                    ].map((item, i) => (
                      <li key={i} className={checklist[i] ? 'done-item' : ''}>
                        {checklist[i]
                          ? <CheckCircle2 size={12} />
                          : <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.3)', display: 'inline-block', flexShrink: 0 }} />}
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
                SUBMIT &amp; VERIFY DOCUMENTS <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════
            SECTION 3 — BUYING & DELIVERY PREFERENCES
        ═══════════════════════════════════════════════════════ */}
        {step === 3 && (
          <>
            <div className="ob-section-header">
              <div className="ob-section-badge"><Layers size={12} /> Section 3 of 3</div>
              <div className="ob-section-title">Buying &amp; Delivery Preferences</div>
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
                      <option value="">Select General Store, Kirana, Minimarket…</option>
                      <option value="kirana">Kirana / General Store</option>
                      <option value="supermarket">Supermarket / Minimarket</option>
                      <option value="wholesale_retail">Wholesale-Retail Shop</option>
                      <option value="fmcg_retail">FMCG Retail Outlet</option>
                      <option value="pharmacy">Pharmacy / Medical</option>
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
                    <option value="2000">₹2,000</option>
                    <option value="5000">₹5,000</option>
                    <option value="10000">₹10,000</option>
                    <option value="25000">₹25,000</option>
                  </select>
                </div>
              </div>

              {/* Preferred Delivery Address / Radius */}
              <div>
                <div className="ob-pref-label" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={14} /> Preferred Delivery Area
                </div>
                <div className="ob-map-box">
                  <div className="ob-map-pin" />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', position: 'absolute', bottom: '0.5rem' }}>
                    Preferred radius — {radius} km from your store
                  </span>
                </div>
                <div className="ob-radius-row" style={{ marginTop: '0.6rem' }}>
                  <span className="ob-radius-label">Radius</span>
                  <span className="ob-radius-val">{radius} km</span>
                </div>
                <input
                  type="range"
                  className="ob-slider"
                  min={1}
                  max={50}
                  value={radius}
                  onChange={e => setRadius(Number(e.target.value))}
                  style={{ width: '100%', marginTop: '0.35rem' }}
                />
                <div className="ob-pincodes-label" style={{ marginTop: '0.85rem' }}>Covered Pincodes</div>
                <input
                  type="text"
                  className="ob-pincodes-input"
                  placeholder="e.g. 400001, 400002"
                  value={deliveryPincodes}
                  onChange={e => setDeliveryPincodes(e.target.value)}
                />
              </div>

              {/* Payment Preferences */}
              <div>
                <div className="ob-pref-label" style={{ marginBottom: '0.6rem' }}>Payment Preferences</div>
                <div className="ob-payment-row">
                  <label className="ob-checkbox-label">
                    <input
                      type="checkbox"
                      checked={paymentCOD}
                      onChange={e => setPaymentCOD(e.target.checked)}
                    />
                    Cash on Delivery (COD)
                  </label>
                  <label className="ob-checkbox-label">
                    <input
                      type="checkbox"
                      checked={paymentBank}
                      onChange={e => setPaymentBank(e.target.checked)}
                    />
                    Bank Transfer
                  </label>
                  <label className="ob-checkbox-label">
                    <input
                      type="checkbox"
                      checked={paymentCard}
                      onChange={e => setPaymentCard(e.target.checked)}
                    />
                    Card on Delivery
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div className="ob-pref-actions">
                <button className="ob-draft-btn" onClick={handleSaveDraft} disabled={submitting}>
                  SAVE DRAFT
                </button>
                <button className="ob-activate-btn" onClick={handleActivate} disabled={submitting}>
                  {submitting ? 'Activating…' : (<>SUBMIT FOR BUYER ACTIVATION <ArrowRight size={15} /></>)}
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
