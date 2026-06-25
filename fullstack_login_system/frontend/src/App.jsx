import { useState, useEffect } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:5000/api/auth";

function App() {
  // Views: 'login', 'register', 'forgot_request', 'forgot_reset', 'dashboard'
  const [view, setView] = useState(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    return savedToken && savedUser ? "dashboard" : "login";
  });

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Auth States
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // School Admission Form States
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

  // System States
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoCode, setDemoCode] = useState("");

  useEffect(() => {
    setError("");
    setSuccess("");
    setDemoCode("");
  }, [view]);

  const clearInputs = () => {
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setVerificationCode("");
    setNewPassword("");
  };

  // Restricts non-numeric values instantaneously during input keystrokes
  const handleNumericInput = (value, setter) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setter(cleaned);
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
  };

  const handleAdmissionSubmit = async (e) => {
    e.preventDefault();
    if (!declaration) {
      triggerErrorPopup("Oops! Please accept the declaration agreement checklist before submitting.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentEmail)) {
      triggerErrorPopup("Invalid Email! Please enter a valid email address structure.");
      return;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      triggerErrorPopup("Invalid Mobile Number! Phone number must be exactly 10 digits.");
      return;
    }
    const pincodeRegex = /^[0-9]{6}$/;
    if (!pincodeRegex.test(pincode)) {
      triggerErrorPopup("Invalid Pincode! Pincode must be exactly 6 digits.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          studentName, dob, gender, bloodGroup, selectedClass,
          fatherName, motherName, studentEmail, phone,
          prevSchool, address, city, pincode
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Database entry execution failed.");
      triggerSuccessPopup("You have successfully sent your information! Thank you for responding.");
      handleResetForm();
    } catch (err) {
      triggerErrorPopup(err.message || "Database process error or connection down.");
    } finally {
      setLoading(false);
    }
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
            <button onClick={() => setShowErrorModal(false)} className="close-popup-btn btn-danger-theme">Try Again</button>
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
            <button onClick={() => setShowSuccessModal(false)} className="close-popup-btn btn-success-theme">Back to homepage</button>
          </div>
        </div>
      )}

      {view === "dashboard" ? (
        <div className="dashboard-layout">
          <div className="dashboard-card header-bar">
            <div className="user-profile-summary">
              <div className="user-avatar">{user?.username ? user.username.charAt(0).toUpperCase() : "U"}</div>
              <div>
                <h1>Welcome Back, {user?.username}!</h1>
                <p>Logged in as: <span>{user?.email}</span> (ID: #{user?.id})</p>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>

          <div className="admission-container">
            <h2>School Admission Registration Form</h2>
            <p className="subtitle">Fill the correct information for Registration</p>

            <form onSubmit={handleAdmissionSubmit} className="admission-form">
              <h3 className="section-title">STUDENT INFORMATION</h3>
              <div className="form-row">
                <div className="form-group"><label>Student Name *</label><input type="text" placeholder="Student Full Name" value={studentName} onChange={(e) => setStudentName(e.target.value)} required /></div>
                <div className="form-group"><label>Date of Birth *</label><input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required /></div>
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
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Student Photo</label>
                  <input type="file" className="file-input" />
                </div>
              </div>

              <h3 className="section-title">PARENT INFORMATION</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Father's Name *</label>
                  <input type="text" placeholder="Father's Full Name" value={fatherName} onChange={(e) => setFatherName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Mother's Name *</label>
                  <input type="text" placeholder="Mother's Full Name" value={motherName} onChange={(e) => setMotherName(e.target.value)} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input type="text" maxLength="10" placeholder="Mobile Number (Only Numbers)" value={phone} onChange={(e) => handleNumericInput(e.target.value, setPhone)} required />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input type="text" placeholder="example@gmail.com" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} required />
                </div>
              </div>

              <h3 className="section-title">ACADEMIC INFORMATION</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Class Applying For *</label>
                  <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} required>
                    <option value="">Select Class</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={`Class ${i + 1}`}>{`Class ${i + 1}`}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Previous School Name</label>
                  <input type="text" placeholder="School Name" value={prevSchool} onChange={(e) => setPrevSchool(e.target.value)} />
                </div>
              </div>

              <h3 className="section-title">ADDRESS INFORMATION</h3>
              <div className="form-group full-width">
                <label>Address *</label>
                <textarea rows="2" placeholder="Enter Full Address" value={address} onChange={(e) => setAddress(e.target.value)} required></textarea>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input type="text" placeholder="City Name" value={city} onChange={(e) => setCity(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Pincode *</label>
                  <input type="text" maxLength="6" placeholder="000000" value={pincode} onChange={(e) => handleNumericInput(e.target.value, setPincode)} required />
                </div>
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
      ) : (
        <div className="login-card">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {view === "login" && (
            <form onSubmit={handleLogin}>
              <h1>Sign In</h1>
              <p>Enter your credentials to continue</p>
              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              <button type="submit" className="login-btn" disabled={loading}>{loading ? "Creating Account..." : "Create Account"}</button>
              <a href="#" className="back-link" onClick={(e) => { e.preventDefault(); setView("login"); }}>Back to Sign In</a>
            </form>
          )}

          {view === "forgot_request" && (
            <form onSubmit={handleForgotRequest}>
              <h1>Forgot Password</h1>
              <p>Enter your email to receive a verification code</p>
              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <button type="submit" className="login-btn" disabled={loading}>{loading ? "Sending..." : "Send Verification Code"}</button>
              <a href="#" className="back-link" onClick={(e) => { e.preventDefault(); clearInputs(); setEmail(""); setView("login"); }}>Back to Sign In</a>
            </form>
          )}

          {view === "forgot_reset" && (
            <form onSubmit={handleResetPassword}>
              <h1>Reset Password</h1>
              <p>Enter the verification code and your new password</p>
              {demoCode && (
                <div className="demo-code-box">
                  <span>Demo Code:</span> <strong>{demoCode}</strong>
                </div>
              )}
              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="text" placeholder="Verification Code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} required />
              <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
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