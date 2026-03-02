require('dotenv').config();
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static(__dirname));

// Serve static assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Default route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/send-enquiry', async (req, res) => {
    const {
        fullName,
        designation,
        companyName,
        address,
        email,
        phone,
        subject,
        message
    } = req.body;

    if (!fullName || !email || !phone) {
        return res.status(400).json({ ok: false, message: 'Full Name, Email Address, and Phone Number are required.' });
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        const missingVars = [];
        if (!process.env.GMAIL_USER) {
            missingVars.push('GMAIL_USER');
        }
        if (!process.env.GMAIL_APP_PASSWORD) {
            missingVars.push('GMAIL_APP_PASSWORD');
        }

        return res.status(500).json({
            ok: false,
            message: `SMTP is not configured on server. Missing: ${missingVars.join(', ')}`
        });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        const finalSubject = subject && subject.trim() ? subject.trim() : 'New Website Enquiry - RFAI';
        const toAddress = process.env.CONTACT_TO || 'sairamjr92@gmail.com';

        await transporter.sendMail({
            from: `RFAI Website <${process.env.GMAIL_USER}>`,
            to: toAddress,
            replyTo: email,
            subject: finalSubject,
            text:
`New enquiry received from website\n\nFull Name: ${fullName || ''}\nDesignation: ${designation || ''}\nCompany Name: ${companyName || ''}\nAddress: ${address || ''}\nEmail: ${email || ''}\nPhone: ${phone || ''}\n\nMessage:\n${message || ''}`,
            html:
`<h3>New enquiry received from website</h3>
<p><strong>Full Name:</strong> ${fullName || ''}</p>
<p><strong>Designation:</strong> ${designation || ''}</p>
<p><strong>Company Name:</strong> ${companyName || ''}</p>
<p><strong>Address:</strong> ${address || ''}</p>
<p><strong>Email:</strong> ${email || ''}</p>
<p><strong>Phone:</strong> ${phone || ''}</p>
<p><strong>Message:</strong><br>${(message || '').replace(/\n/g, '<br>')}</p>`
        });

        return res.json({ ok: true, message: 'Enquiry submitted successfully.' });
    } catch (error) {
        return res.status(500).json({ ok: false, message: 'Failed to send enquiry email.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
