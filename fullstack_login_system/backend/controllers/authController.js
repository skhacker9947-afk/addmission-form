const bcrypt = require('bcryptjs');
const db = require('../config/db');
const jwtUtils = require('../utils/jwtUtils');

// In-memory store for verification codes (kept for fallback verification state sync)
const resetCodes = new Map(); // email -> { code, expiresAt }

/**
 * Registers a new user account.
 */
const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if user already exists in public schema
    const userExists = await db.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Email or username already exists' });
    }

    // Hash password credentials
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert new student user account state
    const newUser = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email.toLowerCase(), passwordHash]
    );

    return res.status(201).json({
      message: 'User registered successfully',
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
/**
 * Log in an existing student account.
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find matching records inside database rows
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

    if (userRes.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = userRes.rows[0];

    // Compare encrypted hash values
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate security verification token
    const token = jwtUtils.generateToken({
      id: user.id,
      username: user.username,
      email: user.email
    });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profilePic: user.profile_pic
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const nodemailer = require('nodemailer');

// 📧 Nodemailer SMTP Transporter setup (Iske liye .env file load hona zaroori hai)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '://gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Initiates the password reset flow and sends REAL email code.
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    // Generate strict random 6-digit numeric validation constraint
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    // Save code to local runtime store and update database instance row field
    resetCodes.set(email.toLowerCase(), { code, expiresAt });
    await db.query('UPDATE users SET verification_code = $1 WHERE email = $2', [code, email.toLowerCase()]);

    console.log(`Sending real verification email with code ${code} to ${email}...`);

    // 📩 Real Email Send Mail Execution Engine Trigger
    const mailOptions = {
      from: `"School Portal Support" <${process.env.SMTP_USER}>`,
      to: email.toLowerCase(),
      subject: 'Password Reset Verification Code',
      text: `Your 6-digit password reset verification code is: ${code}. This code is valid for 10 minutes.`,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f1123; color: #ffffff; border-radius: 12px; max-width: 500px;">
              <h2 style="color: #38bdf8;">Password Reset Request</h2>
              <p style="color: #94a3b8;">Use the following strict 6-digit numeric validation code to reset your account security:</p>
              <div style="background-color: #0b0f19; padding: 15px; text-align: center; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #38bdf8; margin: 20px 0; border: 1px solid #1e293b;">
                ${code}
              </div>
              <p style="font-size: 12px; color: #64748b;">If you did not request this, please ignore this email secure verification alert notification.</p>
            </div>`
    };

    // Real main trigger invocation
    await transporter.sendMail(mailOptions);
    console.log(`Real Verification mail successfully transmitted to: ${email}`);

    // Frontend layout clean update -> data response code text payload safely blocked!
    return res.status(200).json({
      message: 'Verification code successfully sent to your email.'
    });
  } catch (error) {
    console.error('Forgot password email system execution error:', error);
    return res.status(500).json({ message: 'Internal server error or SMTP connection down' });
  }
};

/**
 * Resets password using valid code credentials.
 */
const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const storedData = resetCodes.get(email.toLowerCase());

    if (!storedData) {
      return res.status(400).json({ message: 'No reset code requested for this email' });
    }

    if (storedData.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (Date.now() > storedData.expiresAt) {
      resetCodes.delete(email.toLowerCase());
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update login credentials parameter and flush code state
    await db.query(
      'UPDATE users SET password_hash = $1, verification_code = NULL WHERE email = $2',
      [passwordHash, email.toLowerCase()]
    );

    resetCodes.delete(email.toLowerCase());
    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Submits high-school registration forms with binary multer documents links.
 */
const admissionSubmit = async (req, res) => {
  const {
    studentName, dob, gender, bloodGroup, selectedClass,
    fatherName, motherName, studentEmail, phone, prevSchool, address, city, pincode
  } = req.body;

  if (
    !studentName || !dob || !gender || !selectedClass ||
    !fatherName || !motherName || !studentEmail || !phone || !address || !city || !pincode
  ) {
    return res.status(400).json({ success: false, message: 'All required fields must be filled' });
  }

  try {
    // Capture dynamic file upload links using req.files object mapping structure safely
    const photoPath = req.files && req.files['studentPhoto'] ? req.files['studentPhoto'][0].path : null;
    const certPath = req.files && req.files['birthCertificate'] ? req.files['birthCertificate'][0].path : null;
    const reportPath = req.files && req.files['reportCard'] ? req.files['reportCard'][0].path : null;

    const result = await db.query(
      `INSERT INTO admissions
        (student_name, dob, gender, blood_group, selected_class,
         father_name, mother_name, student_email, phone, prev_school, 
         address, city, pincode, student_photo, birth_certificate, report_card)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING id`,
      [
        studentName.trim(), dob, gender, bloodGroup ? bloodGroup.trim() : null, selectedClass,
        fatherName.trim(), motherName.trim(), studentEmail.trim().toLowerCase(), phone.trim(),
        prevSchool ? prevSchool.trim() : null, address.trim(), city.trim(), pincode.trim(),
        photoPath, certPath, reportPath
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Admission submitted successfully with uploaded documents!',
      admissionId: result.rows[0].id
    });
  } catch (error) {
    console.error('Admission submit error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Updates dynamic user values and profile picture settings paths inside public scheme table rows.
 */
const updateProfile = async (req, res) => {
  const { username, email } = req.body;
  const userId = req.user ? req.user.id : null; // Extracted using authentication login token context

  if (!username || !email) {
    return res.status(400).json({ message: 'Username and Email are required' });
  }

  try {
    let query = 'UPDATE users SET username = $1, email = $2';
    const params = [username, email.toLowerCase()];

    // Catch single profile pic location parameter update
    if (req.file) {
      query += ', profile_pic = $3';
      params.push(req.file.path);
    }

    // Dynamic ID clause appending condition framework check
    if (userId) {
      query += ` WHERE id = $${params.length + 1} RETURNING id, username, email, profile_pic`;
      params.push(userId);
    } else {
      query += ' WHERE email = $2 RETURNING id, username, email, profile_pic';
    }

    const updatedUser = await db.query(query, params);
    return res.status(200).json({
      message: 'Profile records updated successfully!',
      user: updatedUser.rows[0]
    });
  } catch (error) {
    console.error('Update profile system controller tracking error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  admissionSubmit,
  updateProfile
};
