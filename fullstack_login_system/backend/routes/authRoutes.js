const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const authController = require('../controllers/authController');

// Shared runtime memory map for codes link validation
const localResetCodes = new Map();

// 📧 NODEMAILER SMTP TRANSPORTER
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || '://gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/'); },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Core base routing triggers mapped to controllers
router.post('/register', authController.register);
router.post('/login', authController.login);
router.put('/update-profile', upload.single('profilePic'), authController.updateProfile);
router.post('/admission', upload.fields([
    { name: 'studentPhoto', maxCount: 1 },
    { name: 'birthCertificate', maxCount: 1 },
    { name: 'reportCard', maxCount: 1 }
]), authController.admissionSubmit);


// 🚨 1. DIRECT INTERCEPT FOR FORGOT PASSWORD ROUTE
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000;

        localResetCodes.set(email.toLowerCase(), { code, expiresAt });
        await db.query('UPDATE users SET verification_code = $1 WHERE email = $2', [code, email.toLowerCase()]);

        console.log(`!!! ROUTER SYSTEM TRIGGER !!! Sending Real Email OTP ${code} to ${email}...`);

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

        await transporter.sendMail(mailOptions);
        console.log(`>>> SUCCESS <<< Real Verification mail successfully transmitted to: ${email}`);

        return res.status(200).json({ message: 'Verification code successfully sent to your email.' });
    } catch (error) {
        console.error('Direct Router Forgot password execution error:', error);
        return res.status(500).json({ message: 'Internal server error or SMTP connection down' });
    }
});


// 🚨 2. DIRECT INTERCEPT FOR RESET PASSWORD ROUTE (Sync Fix)
router.post('/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Ab ye direct humare local map se verify karega bina mismatch ke
        const storedData = localResetCodes.get(email.toLowerCase());

        if (!storedData) {
            return res.status(400).json({ message: 'No reset code requested for this email' });
        }

        if (storedData.code !== code.trim()) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        if (Date.now() > storedData.expiresAt) {
            localResetCodes.delete(email.toLowerCase());
            return res.status(400).json({ message: 'Verification code has expired' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update database credentials query state
        await db.query(
            'UPDATE users SET password_hash = $1, verification_code = NULL WHERE email = $2',
            [passwordHash, email.toLowerCase()]
        );

        localResetCodes.delete(email.toLowerCase());
        console.log(`>>> SUCCESS <<< Password successfully reset for user: ${email}`);

        return res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Direct Router Reset password execution error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
