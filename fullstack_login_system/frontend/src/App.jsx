import { useState, useEffect } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:5000/api/auth";

function App() {
  // Views: 'login', 'register', 'forgot_request', 'forgot_reset', 'dashboard', 'profile_settings'
  const [view, setView] = useState(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    return savedToken && savedUser ? "dashboard" : "login";
  });

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Profile & Dynamic Tab Routing States
  const [profilePic, setProfilePic] = useState(null);
  const [profileUsername, setProfileUsername] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [activeTab, setActiveTab] = useState("profile"); // profile, applications, documents, fees

  // Form States for Document Status Tracking
  const [isPhotoSelected, setIsPhotoSelected] = useState(false);
  const [isBirthCertSelected, setIsBirthCertSelected] = useState(false);
  const [isReportCardSelected, setIsReportCardSelected] = useState(false);

  // Sync profile fields on view change
  useEffect(() => {
    if (user) {
      setProfileUsername(user.username || "");
      setProfileEmail(user.email || "");
    }
  }, [user, view]);

  // Auth Input States
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // School Admission Form Input States
  const [studentName, setStudentName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [prevSchool, setPrevSchool] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [declaration, setDeclaration] = useState(false);

  // Popup Modals Visibility States
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // System Utility States
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoCode, setDemoCode] = useState("");

  useEffect(() => {
    if (view !== "dashboard" && view !== "profile_settings") {
      setError("");
      setSuccess("");
      setDemoCode("");
    }
  }, [view]);

  const clearInputs = () => {
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setVerificationCode("");
    setNewPassword("");
  };
  // Profile Picture File Upload Handlers
  const handleProfilePicChange = (e) => {
    const file = e.target.files;
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfilePic(imageUrl);
    }
  };

  const handleDeleteProfilePic = () => {
    setProfilePic(null);
  };

  // Profile Save LocalStorage Sync
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!profileUsername || !profileEmail) {
      triggerErrorPopup("Username and Email cannot be empty.");
      return;
    }
    const updatedUser = { ...user, username: profileUsername, email: profileEmail };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setView("dashboard");
    triggerSuccessPopup("Profile updated successfully!");
  };

  // Restricts non-numeric values instantaneously during input keystrokes
  const handleNumericInput = (value, setter) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setter(cleaned);
  };

  // Restricts non-alphabet values instantaneously during input keystrokes
  const handleAlphabetInput = (value, setter) => {
    const cleaned = value.replace(/[^A-Za-z ]/g, "");
    setter(cleaned);
  };

  // Gets yesterday's date in YYYY-MM-DD format to disable today and future dates
  const getMaximumDate = () => {
    const today = new Date();
    today.setDate(today.getDate() - 1);
    return today.toISOString().split("T");
  };

  const triggerErrorPopup = (msg) => {
    setModalMessage(msg);
    setShowErrorModal(true);
  };

  const triggerSuccessPopup = (msg) => {
    setModalMessage(msg);
    setShowSuccessModal(true);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter both email and password."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user); clearInputs(); setView("dashboard");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !email || !password || !confirmPassword) { setError("All fields are required."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed");
      setSuccess("Account created successfully! Please log in."); clearInputs(); setView("login");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("user");
    setUser(null); clearInputs(); setEmail(""); setView("login");
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");
      setSuccess("Verification code sent! Check below.");
      if (data.code) setDemoCode(data.code);
      setView("forgot_reset");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email || !verificationCode || !newPassword) { setError("All fields are required."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Reset failed");
      setSuccess("Password reset successful! Please log in with your new password.");
      clearInputs(); setEmail(""); setDemoCode("");
      setView("login");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleResetForm = () => {
    setStudentName(""); setDob(""); setGender(""); setBloodGroup(""); setSelectedClass("");
    setFatherName(""); setMotherName(""); setStudentEmail(""); setPhone(""); setPrevSchool("");
    setAddress(""); setCity(""); setPincode(""); setDeclaration(false);
    setIsPhotoSelected(false); setIsBirthCertSelected(false); setIsReportCardSelected(false);
  };

  const handleAdmissionSubmit = async (e) => {
    e.preventDefault();
    if (!declaration) { triggerErrorPopup("Oops! Please accept the declaration checklist."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentEmail)) { triggerErrorPopup("Invalid Email Address structure."); return; }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) { triggerErrorPopup("Phone number must be exactly 10 digits."); return; }
    const pincodeRegex = /^[0-9]{6}$/;
    if (!pincodeRegex.test(pincode)) { triggerErrorPopup("Pincode must be exactly 6 digits."); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admission`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          studentName, dob, gender, bloodGroup, selectedClass,
          fatherName, motherName, studentEmail, phone, prevSchool, address, city, pincode
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Database entry failed.");
      triggerSuccessPopup("You have successfully sent your information!");
      handleResetForm();
    } catch (err) { triggerErrorPopup(err.message); } finally { setLoading(false); }
  };
  return (
    <div className="container">
      {/* 🛑 Oops! Error Popup Window View Modal */}
      {showErrorModal && (
        <div className="popup-overlay animate-fade">
          <div className="popup-card">
            <div className="close-cross-x" onClick={() => setShowErrorModal(false)}>✕</div>
            <div className="popup-icon-wrap red-glow">✕</div>
            <h2>Oops!</h2>
            <p>{modalMessage}</p>
            <button type="button" onClick={() => setShowErrorModal(false)} className="close-popup-btn btn-danger-theme">Try Again</button>
          </div>
        </div>
      )}

      {/* 🎉 Thank You! Success Popup Window View Modal */}
      {showSuccessModal && (
        <div className="popup-overlay animate-fade">
          <div className="popup-card">
            <div className="close-cross-x" onClick={() => setShowSuccessModal(false)}>✕</div>
            <div className="popup-icon-wrap green-glow">✓</div>
            <h2>Thank you</h2>
            <p>{modalMessage}</p>
            <button type="button" onClick={() => setShowSuccessModal(false)} className="close-popup-btn btn-success-theme">Back to homepage</button>
          </div>
        </div>
      )}

      {view === "dashboard" && (
        <div className="dashboard-layout">
          <div className="dashboard-card header-bar">
            <div className="avatar-profile-section">
              <label htmlFor="header-avatar-upload" className="user-avatar-label">
                <div className="user-avatar gradient-box">
                  {profilePic ? <img src={profilePic} alt="User Profile" className="profile-img-preview" /> : (user?.username ? user.username.charAt(0).toUpperCase() : "U")}
                </div>
              </label>
              <input type="file" id="header-avatar-upload" style={{ display: "none" }} accept="image/*" onChange={handleProfilePicChange} />
              <button type="button" className="profile-btn" onClick={() => { setView("profile_settings"); setActiveTab("profile"); }}>My Profile</button>
            </div>

            <div className="user-profile-summary-centered">
              <h1>Welcome Back, {user?.username}!</h1>
              <p>Logged in as: <span>{user?.email}</span> (ID: #{user?.id})</p>
            </div>

            <div className="header-action-buttons">
              <button type="button" className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>

          <div className="admission-container">
            <h2>School Admission Registration Form</h2>
            <p className="subtitle">Fill the correct information for Registration</p>

            <form onSubmit={handleAdmissionSubmit} className="admission-form">
              <h3 className="section-title">STUDENT INFORMATION</h3>
              <div className="form-row">
                <div className="form-group"><label>Student Name *</label><input type="text" placeholder="Student Full Name" value={studentName} onChange={(e) => handleAlphabetInput(e.target.value, setStudentName)} required /></div>
                <div className="form-group"><label>Date of Birth *</label><input type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={getMaximumDate()} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Gender *</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} required>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Blood Group</label>
                  <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option>
                    <option value="O+">O+</option><option value="O-">O-</option><option value="AB+">AB+</option><option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              {/* 📂 REQUIRED DOCUMENTS INPUTS (All fields required back again) */}
              <h3 className="section-title">REQUIRED ATTACHMENTS</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Student Passport Photo *</label>
                  <input type="file" className="file-input" accept="image/*" onChange={(e) => setIsPhotoSelected(!!e.target.files)} required />
                </div>
                <div className="form-group">
                  <label>Birth Certificate (PDF/JPG) *</label>
                  <input type="file" className="file-input" accept=".pdf,image/*" onChange={(e) => setIsBirthCertSelected(!!e.target.files)} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Previous School Report Card (PDF/JPG) *</label>
                  <input type="file" className="file-input" accept=".pdf,image/*" onChange={(e) => setIsReportCardSelected(!!e.target.files)} required />
                </div>
              </div>

              <h3 className="section-title">PARENT INFORMATION</h3>
              <div className="form-row">
                <div className="form-group"><label>Father's Name *</label><input type="text" placeholder="Father's Name" value={fatherName} onChange={(e) => handleAlphabetInput(e.target.value, setFatherName)} required /></div>
                <div className="form-group"><label>Mother's Name *</label><input type="text" placeholder="Mother's Name" value={motherName} onChange={(e) => handleAlphabetInput(e.target.value, setMotherName)} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Mobile Number *</label><input type="text" maxLength="10" placeholder="Mobile" value={phone} onChange={(e) => handleNumericInput(e.target.value, setPhone)} required /></div>
                <div className="form-group"><label>Email Address *</label><input type="text" placeholder="example@gmail.com" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} required /></div>
              </div>

              <h3 className="section-title">ACADEMIC INFORMATION</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Class Applying For *</label>
                  <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} required>
                    <option value="">Select Class</option>
                    {[...Array(12)].map((_, i) => (<option key={i + 1} value={`Class ${i + 1}`}>{`Class ${i + 1}`}</option>))}
                  </select>
                </div>
                <div className="form-group"><label>Previous School Name</label><input type="text" placeholder="School Name" value={prevSchool} onChange={(e) => handleAlphabetInput(e.target.value, setPrevSchool)} /></div>
              </div>

              <h3 className="section-title">ADDRESS INFORMATION</h3>
              <div className="form-group full-width"><label>Address *</label><textarea rows="2" placeholder="Full Address" value={address} onChange={(e) => setAddress(e.target.value)} required></textarea></div>
              <div className="form-row">
                <div className="form-group"><label>City *</label><input type="text" placeholder="City" value={city} onChange={(e) => handleAlphabetInput(e.target.value, setCity)} required /></div>
                <div className="form-group"><label>Pincode *</label><input type="text" maxLength="6" placeholder="000000" value={pincode} onChange={(e) => handleNumericInput(e.target.value, setPincode)} required /></div>
              </div>

              <div className="declaration-row">
                <input type="checkbox" id="declare" checked={declaration} onChange={(e) => setDeclaration(e.target.checked)} />
                <label htmlFor="declare">I hereby declare that the above information is true and correct.</label>
              </div>
              <div className="button-group">
                <button type="button" onClick={handleResetForm} className="reset-btn">Reset Form</button>
                <button type="submit" className="submit-btn spec-submit">Submit Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {view === "profile_settings" && (
        <div className="settings-page-layout">
          <div className="settings-tabs-navbar">
            <span className={`tab-item ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>My Profile</span>
            <span className={`tab-item ${activeTab === "applications" ? "active" : ""}`} onClick={() => setActiveTab("applications")}>My Applications</span>
            <span className={`tab-item ${activeTab === "documents" ? "active" : ""}`} onClick={() => setActiveTab("documents")}>Uploaded Documents</span>
            <span className={`tab-item ${activeTab === "fees" ? "active" : ""}`} onClick={() => setActiveTab("fees")}>Fee Status</span>
          </div>

          <div className="settings-content-wrapper">
            {/* TAB 1: USER PROFILE FORM */}
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} className="settings-inner-form">
                <div className="settings-section">
                  <h3 className="settings-section-title">Profile Picture</h3>
                  <div className="profile-upload-row">
                    <div className="user-avatar circular-avatar-frame">
                      {profilePic ? <img src={profilePic} alt="Profile" /> : (user?.username ? user.username.charAt(0).toUpperCase() : "U")}
                    </div>
                    <div className="upload-controls-block">
                      <p className="upload-hint-text">We only support PNG or JPG pictures.</p>
                      <div className="upload-btn-container">
                        <label htmlFor="settings-avatar-input" className="custom-upload-file-btn">Upload Photo</label>
                        <input type="file" id="settings-avatar-input" style={{ display: "none" }} accept="image/*" onChange={handleProfilePicChange} />
                        {profilePic && <button type="button" onClick={handleDeleteProfilePic} className="delete-photo-btn">Delete</button>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="settings-section">
                  <h3 className="settings-section-title">Basic Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input type="text" value={profileUsername} onChange={(e) => handleAlphabetInput(e.target.value, setProfileUsername)} required />
                    </div>
                    <div className="form-group">
                      <label>Class Applying For</label>
                      <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                        <option value="">Select Class</option>
                        {[...Array(12)].map((_, i) => (<option key={i + 1} value={`Class ${i + 1}`}>{`Class ${i + 1}`}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="form-row" style={{ marginTop: "15px" }}>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Account Security</label>
                      <button type="button" className="custom-security-action-btn" onClick={(e) => { e.preventDefault(); setView("forgot_request"); }}>Change Account Password →</button>
                    </div>
                  </div>
                </div>

                <div className="settings-section team-role-section">
                  <span className="role-title">Academic Year</span>
                  <p className="role-details"><span className="owner-tag" style={{ background: "#2563eb", color: "#fff" }}>2026-27</span> Current Session</p>
                </div>
                <div className="button-group settings-action-group">
                  <button type="button" onClick={() => setView("dashboard")} className="reset-btn">Cancel</button>
                  <button type="submit" className="submit-btn spec-submit">Save Changes</button>
                </div>
              </form>
            )}

            {/* TAB 2: APPLICATIONS STATUS */}
            {activeTab === "applications" && (
              <div className="settings-section">
                <h3 className="settings-section-title">My Admission Forms</h3>
                <div className="custom-info-data-row">
                  <p><strong>Form ID:</strong> #ADM-{user?.id || "99"}2026</p>
                  <p><strong>Submitted On:</strong> {new Date().toLocaleDateString()}</p>
                  <p><strong>Class Profile:</strong> {selectedClass || "Class Not Selected Yet"}</p>
                  <p><strong>Current Status:</strong> <span className="owner-tag" style={{ background: "#f59e0b", margin: 0 }}>PENDING VERIFICATION</span></p>
                </div>
              </div>
            )}

            {/* TAB 3: DOCUMENTS CHECKLIST - Linked status */}
            {activeTab === "documents" && (
              <div className="settings-section">
                <h3 className="settings-section-title">Verified Documents Checklist</h3>
                <ul className="custom-doc-list" style={{ color: "#94a3b8", fontSize: "14px", paddingLeft: "0", listStyle: "none" }}>
                  <li style={{ color: isPhotoSelected ? "#22c55e" : "#ef4444", fontWeight: "600", marginBottom: "10px" }}>
                    {isPhotoSelected ? "✓ Student Passport Photo (Uploaded)" : "✕ Student Passport Photo (Missing)"}
                  </li>
                  <li style={{ color: isBirthCertSelected ? "#22c55e" : "#ef4444", fontWeight: "600", marginBottom: "10px" }}>
                    {isBirthCertSelected ? "✓ Birth Certificate Document (Uploaded)" : "✕ Birth Certificate Document (Missing)"}
                  </li>
                  <li style={{ color: isReportCardSelected ? "#22c55e" : "#ef4444", fontWeight: "600" }}>
                    {isReportCardSelected ? "✓ Previous School Report Card (Uploaded)" : "✕ Previous School Report Card (Missing)"}
                  </li>
                </ul>
              </div>
            )}

            {/* TAB 4: FEE STATUS INVOICES */}
            {activeTab === "fees" && (
              <div className="settings-section">
                <h3 className="settings-section-title">Financial Invoice Sheet</h3>
                <div className="custom-info-data-row">
                  <p><strong>Registration Charges:</strong> ₹500 <span style={{ color: "#22c55e" }}>(PAID)</span></p>
                  <p><strong>Admission Processing Fee:</strong> ₹10,000 <span style={{ color: "#f59e0b" }}>(PENDING)</span></p>
                  <hr style={{ borderColor: "rgba(255,255,255,0.05)", margin: "10px 0" }} />
                  <button type="button" className="custom-upload-file-btn" onClick={() => triggerSuccessPopup("Redirecting to Bank Gateway Payment Portal...")}>Pay Pending Fees Now</button>
                </div>
              </div>
            )}

            {activeTab !== "profile" && (
              <div className="button-group settings-action-group">
                <button type="button" onClick={() => setView("dashboard")} className="submit-btn spec-submit">Return to Form</button>
              </div>
            )}
          </div>
        </div>
      )}
      {(view !== "dashboard" && view !== "profile_settings") && (
        <div className="login-card">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {view === "login" && (
            <form onSubmit={handleLogin}>
              <h1>Sign In</h1>
              <p>Enter your credentials to continue</p>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="submit" className="login-btn" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
              <a href="#" className="forgot-link" onClick={(e) => { e.preventDefault(); setView("forgot_request"); }}>Forgot Password?</a>
              <div className="divider"><span>OR</span></div>
              <button type="button" className="signup-btn" onClick={() => setView("register")}>Create New Account</button>
            </form>
          )}

          {view === "register" && (
            <form onSubmit={handleRegister}>
              <h1>Sign Up</h1>
              <p>Create an account to get started</p>
              <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              <button type="submit" className="login-btn" disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>
              <a href="#" className="back-link" onClick={(e) => { e.preventDefault(); setView("login"); }}>Back to Sign In</a>
            </form>
          )}

          {view === "forgot_request" && (
            <form onSubmit={handleForgotRequest}>
              <h1>Forgot Password</h1>
              <p>Enter your email to receive a verification code</p>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <button type="submit" className="login-btn" disabled={loading}>{loading ? "Sending..." : "Send Verification Code"}</button>
              <a href="#" className="back-link" onClick={(e) => { e.preventDefault(); clearInputs(); setEmail(""); setView("login"); }}>Back to Sign In</a>
            </form>
          )}

          {view === "forgot_reset" && (
            <form onSubmit={handleResetPassword} autoComplete="off">
              <h1>Reset Password</h1>
              <p>Enter the verification code and your new password</p>

              {/* Demo Code Box permanently deleted from here */}

              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" />

              {/* Inside embedded system - strict 6-digit handling single parenthesis (e) fix */}
              <div className="code-input-container-inside">
                <input
                  type="text"
                  maxLength="6"
                  placeholder="Code"
                  value={verificationCode}
                  onChange={(e) => handleNumericInput(e.target.value, setVerificationCode)}
                  required
                />
                <button
                  type="button"
                  className="inner-send-text-btn"
                  onClick={handleForgotRequest}
                  disabled={loading}
                >
                  {loading ? "..." : "Send"}
                </button>
              </div>

              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
              />

              <button type="submit" className="login-btn" disabled={loading}>{loading ? "Resetting..." : "Reset Password"}</button>
              <a href="#" className="back-link" onClick={(e) => { e.preventDefault(); clearInputs(); setEmail(""); setDemoCode(""); setView("login"); }}>Back to Sign In</a>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
