```javascript
const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

// In-memory store for verification codes (use Redis or DB in production)
const verificationCodes = {};

// Generate a 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Endpoint to send verification code
app.post('/api/send-verification', async (req, res) => {
  const { mobileNumber } = req.body;

  // Validate mobile number
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(mobileNumber)) {
    return res.status(400).json({ error: 'Invalid mobile number' });
  }

  // Generate and store code
  const code = generateCode();
  verificationCodes[mobileNumber] = code;

  try {
    // Send SMS via Twilio
    await client.messages.create({
      body: `Your verification code is ${code}`,
      from: twilioPhone,
      to: mobileNumber,
    });

    res.json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Endpoint to verify code
app.post('/api/verify-code', (req, res) => {
  const { mobileNumber, code } = req.body;

  if (!mobileNumber || !code) {
    return res.status(400).json({ error: 'Mobile number and code are required' });
  }

  if (verificationCodes[mobileNumber] === code) {
    // Clear the code after successful verification
    delete verificationCodes[mobileNumber];
    res.json({ message: 'Verification successful' });
  } else {
    res.status(400).json({ error: 'Invalid code' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```