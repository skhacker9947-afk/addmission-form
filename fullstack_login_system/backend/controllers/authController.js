const bcrypt = require('bcryptjs');
const db = require('../config/db');
const jwtUtils = require('../utils/jwtUtils');

// In-memory store for verification codes (for demo purposes)
const resetCodes = new Map(); // email -> { code, expiresAt }

/**
 * Registers a new user.
 */
const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if user already exists
    const userExists = await db.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Email or username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
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
 * Log in an existing user.
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find user
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

    if (userRes.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = userRes.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
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
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Initiates the password reset flow.
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Check if user exists
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Code expires in 10 minutes
    const expiresAt = Date.now() + 10 * 60 * 1000;
    resetCodes.set(email.toLowerCase(), { code, expiresAt });

    console.log(`Password reset code for ${email}: ${code}`);

    // In production, send this code via email.
    // For demo, we return it in the response so the frontend can show it to the user.
    return res.status(200).json({
      message: 'Reset code generated successfully.',
      code: code // Returning to frontend for demo convenience!
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Resets password using verification code.
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

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update DB
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
      [passwordHash, email.toLowerCase()]
    );

    // Clear the reset code
    resetCodes.delete(email.toLowerCase());

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Submits a school admission registration form.
 */
const admissionSubmit = async (req, res) => {
  const {
    studentName,
    dob,
    gender,
    bloodGroup,
    selectedClass,
    fatherName,
    motherName,
    studentEmail,
    phone,
    prevSchool,
    address,
    city,
    pincode
  } = req.body;

  // Validate required fields (bloodGroup and prevSchool are optional)
  if (
    !studentName || !dob || !gender || !selectedClass ||
    !fatherName || !motherName || !studentEmail || !phone ||
    !address || !city || !pincode
  ) {
    return res.status(400).json({ success: false, message: 'All required fields must be filled' });
  }

  try {
    const result = await db.query(
      `INSERT INTO admissions
        (student_name, dob, gender, blood_group, selected_class,
         father_name, mother_name, student_email, phone,
         prev_school, address, city, pincode)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        studentName.trim(),
        dob,
        gender,
        bloodGroup ? bloodGroup.trim() : null,
        selectedClass,
        fatherName.trim(),
        motherName.trim(),
        studentEmail.trim().toLowerCase(),
        phone.trim(),
        prevSchool ? prevSchool.trim() : null,
        address.trim(),
        city.trim(),
        pincode.trim()
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Admission submitted successfully',
      admissionId: result.rows[0].id
    });
  } catch (error) {
    console.error('Admission submit error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  admissionSubmit
};
