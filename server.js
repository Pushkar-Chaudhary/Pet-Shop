require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const OTP_FILE = path.join(DATA_DIR, 'auth-challenges.json');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_HOSTED_DOMAIN = process.env.GOOGLE_HOSTED_DOMAIN || '';
const OTP_TTL_MS = parseInt(process.env.OTP_TTL_MS || '600000', 10);
const OTP_SECRET = process.env.OTP_SECRET || 'pet-shop-otp-secret';
const DEFAULT_SELLER_EMAIL = process.env.DEFAULT_SELLER_EMAIL || 'seller@petshop.com';

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const defaultProducts = [
  { id: 'judging-cat', name: 'Judging Cat', price: 300, category: 'pet', subcategory: 'cat', description: 'A judging cat who questions your life decisions.', image: 'cat1.jpeg' },
  { id: 'lazy-cat', name: 'Lazy Cat', price: 280, category: 'pet', subcategory: 'cat', description: 'A lazy cat who will help you to lie on the floor.', image: 'cat2.jpeg' },
  { id: 'cute-shorthair', name: 'Cute Shorthair', price: 350, category: 'pet', subcategory: 'cat', description: 'A cute shorthair who is just here to grab your attention.', image: 'cat3.jpeg' },
  { id: 'short-legged-cat', name: 'Short Legged Cat', price: 400, category: 'pet', subcategory: 'cat', description: 'A cute short legged cat who loves to chase laser pointers.', image: 'cat4.jpeg' },
  { id: 'fluffy-cat', name: 'Fluffy Cat', price: 320, category: 'pet', subcategory: 'cat', description: 'A fluffy cat who enjoys long naps in sunny spots.', image: 'cat5.jpeg' },
  { id: 'friendly-dog', name: 'Friendly Dog', price: 450, category: 'pet', subcategory: 'dog', description: 'A friendly dog who loves to play fetch and go for walks.', image: 'dog1.jpeg' },
  { id: 'loyal-dog', name: 'Loyal Dog', price: 500, category: 'pet', subcategory: 'dog', description: 'A loyal and cute dog who will be your best companion.', image: 'dog2.jpeg' },
  { id: 'energetic-dog', name: 'Energetic Dog', price: 480, category: 'pet', subcategory: 'dog', description: 'An energetic dog who loves to run and play outdoors.', image: 'dog3.jpeg' },
  { id: 'dog-food', name: 'Dog Food', price: 120, category: 'accessory', subcategory: 'food', description: 'High-quality food to keep your dog healthy and happy.', image: 'petfood.jpeg' },
  { id: 'cat-food', name: 'Cat Food', price: 110, category: 'accessory', subcategory: 'food', description: 'High-quality food to keep your cat healthy and happy.', image: 'catfood.jpeg' },
  { id: 'pet-collar', name: 'Pet Collar', price: 80, category: 'accessory', subcategory: 'gear', description: 'Durable collars to keep your pets safe and stylish.', image: 'petcollar.jpeg' },
  { id: 'net-carrier', name: 'Net Carrier', price: 200, category: 'accessory', subcategory: 'gear', description: 'Convenient and comfortable carriers for your pets with nets.', image: 'carrybag1.jpeg' },
  { id: 'shield-carrier', name: 'Shield Carrier', price: 250, category: 'accessory', subcategory: 'gear', description: 'Comfortable and stylish carriers with a protective shield.', image: 'carrybag2.jpeg' },
  { id: 'pet-toys', name: 'Pet Toys', price: 150, category: 'accessory', subcategory: 'gear', description: 'Fun toys to keep your pets entertained and active.', image: 'pettoys.jpg' }
];

function inferSubcategory(product) {
  if (product.subcategory) return product.subcategory;
  if (product.id?.includes('-cat') || product.name?.includes('Cat')) return 'cat';
  if (product.id?.includes('-dog') || product.name?.includes('Dog')) return 'dog';
  if (product.name?.includes('Food')) return 'food';
  return product.category === 'pet' ? 'cat' : 'gear';
}

function normalizeProducts(products) {
  return (Array.isArray(products) ? products : defaultProducts).map((product) => ({
    ...product,
    subcategory: inferSubcategory(product)
  }));
}

function getProducts() {
  const products = readJson(PRODUCTS_FILE);
  const normalized = normalizeProducts(products);
  if (JSON.stringify(products) !== JSON.stringify(normalized)) {
    writeJson(PRODUCTS_FILE, normalized);
  }
  return normalized;
}

function ensureDataFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(USERS_FILE)) {
    const defaultUsers = [
      { id: 'seller-1', role: 'seller', username: 'admin', email: DEFAULT_SELLER_EMAIL, password: bcrypt.hashSync('petshop2024', 10), name: 'Store Owner', provider: 'local' },
      { id: 'customer-1', role: 'customer', email: 'customer@petshop.com', password: bcrypt.hashSync('petshop123', 10), name: 'Demo Customer', provider: 'local' }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
  }

  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(defaultProducts, null, 2));
  }

  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
  }

  if (!fs.existsSync(OTP_FILE)) {
    fs.writeFileSync(OTP_FILE, JSON.stringify([], null, 2));
  }
}

function readJson(file) {
  ensureDataFiles();
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  ensureDataFiles();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function readUsers() {
  const users = readJson(USERS_FILE);
  let updated = false;
  const normalized = users.map((user) => {
    const next = { ...user };
    if (next.role === 'seller' && !next.email) {
      next.email = DEFAULT_SELLER_EMAIL;
      updated = true;
    }
    return next;
  });

  if (updated) {
    writeJson(USERS_FILE, normalized);
  }

  return normalized;
}

function writeUsers(users) {
  writeJson(USERS_FILE, users);
}

function readOtpChallenges() {
  return readJson(OTP_FILE);
}

function writeOtpChallenges(challenges) {
  writeJson(OTP_FILE, challenges);
}

function normalizeIdentifier(value) {
  return String(value || '').trim().toLowerCase();
}

function findUserByIdentifier(users, identifier) {
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) return null;

  return users.find((user) => {
    const email = normalizeIdentifier(user.email);
    const username = normalizeIdentifier(user.username);
    return email === normalized || username === normalized;
  }) || null;
}

function hashOtp(code, challengeId) {
  return crypto.createHash('sha256').update(`${challengeId}:${code}:${OTP_SECRET}`).digest('hex');
}

function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function cleanupExpiredOtpChallenges(challenges = readOtpChallenges()) {
  const now = Date.now();
  const activeChallenges = challenges.filter((challenge) => Number(challenge.expiresAt) > now);

  if (activeChallenges.length !== challenges.length) {
    writeOtpChallenges(activeChallenges);
  }

  return activeChallenges;
}

function consumeOtpChallenge(challengeId) {
  const challenges = cleanupExpiredOtpChallenges();
  const nextChallenges = challenges.filter((challenge) => challenge.id !== challengeId);
  writeOtpChallenges(nextChallenges);
}

async function createOtpChallenge({ purpose, email, userId = null, userDraft = null, name = '', metadata = {} }) {
  const challengeId = crypto.randomBytes(16).toString('hex');
  const otpCode = generateOtpCode();
  const expiresAt = Date.now() + OTP_TTL_MS;
  const challenge = {
    id: challengeId,
    purpose,
    email: normalizeIdentifier(email),
    userId,
    userDraft,
    name,
    metadata,
    otpHash: hashOtp(otpCode, challengeId),
    attempts: 0,
    expiresAt,
    createdAt: new Date().toISOString()
  };

  const activeChallenges = cleanupExpiredOtpChallenges();
  activeChallenges.push(challenge);
  writeOtpChallenges(activeChallenges);

  const subject = purpose === 'signup'
    ? 'Verify your Pet Shop account'
    : 'Your Pet Shop login code';
  const displayName = name || 'there';
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
      <h2 style="margin: 0 0 12px; color: #0f172a;">Pet Shop verification code</h2>
      <p style="margin: 0 0 12px;">Hi ${displayName}, use the one-time password below to complete your ${purpose === 'signup' ? 'sign-up' : 'sign-in'}.</p>
      <div style="display: inline-block; padding: 14px 20px; border-radius: 10px; background: #eff6ff; color: #1d4ed8; font-size: 28px; font-weight: 700; letter-spacing: 0.3em;">${otpCode}</div>
      <p style="margin: 14px 0 0; color: #475569;">This code expires in ${Math.round(OTP_TTL_MS / 60000)} minutes. If you did not request it, you can ignore this message.</p>
    </div>
  `;

  await sendNotificationEmail(challenge.email, subject, html);

  return {
    challengeId,
    expiresIn: Math.round(OTP_TTL_MS / 1000),
    delivery: challenge.email
  };
}

function verifyOtpChallenge(challengeId, otpCode, purpose) {
  const challenges = cleanupExpiredOtpChallenges();
  const challenge = challenges.find((item) => item.id === challengeId && item.purpose === purpose);

  if (!challenge) {
    return { error: 'OTP session expired. Please request a new code.' };
  }

  if (Number(challenge.attempts) >= 5) {
    consumeOtpChallenge(challengeId);
    return { error: 'Too many invalid attempts. Please request a new code.' };
  }

  if (hashOtp(String(otpCode || '').trim(), challengeId) !== challenge.otpHash) {
    challenge.attempts = Number(challenge.attempts || 0) + 1;
    writeOtpChallenges(challenges);
    return { error: 'Invalid OTP code.' };
  }

  consumeOtpChallenge(challengeId);
  return { challenge };
}

function generateToken(userId) {
  return `token-${userId}-${Date.now()}`;
}

function extractToken(req) {
  const header = (req.headers.authorization || '').trim();
  if (!header) return '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : header;
}

function findUserByToken(token) {
  if (!token) return null;
  return readUsers().find(item => item.token === token) || null;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    role: user.role,
    name: user.name || user.username || user.email || 'Customer',
    email: user.email || null,
    username: user.username || null,
    provider: user.provider || 'local'
  };
}

function authorizeRole(role) {
  return (req, res, next) => {
    const token = extractToken(req);
    const user = findUserByToken(token);
    if (!user || user.role !== role) {
      return res.status(401).json({ error: `${role.charAt(0).toUpperCase() + role.slice(1)} authorization required` });
    }
    req.user = user;
    req.token = token;
    next();
  };
}

const authorizeSeller = authorizeRole('seller');

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/config/google-client-id', (_req, res) => {
  res.json({
    googleClientId: GOOGLE_CLIENT_ID,
    googleConfigured: Boolean(GOOGLE_CLIENT_ID),
    hostedDomain: GOOGLE_HOSTED_DOMAIN || null
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = findUserByToken(extractToken(req));
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ user: sanitizeUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  const token = extractToken(req);
  if (!token) return res.json({ ok: true });

  const users = readUsers();
  const user = users.find(item => item.token === token);
  if (user) {
    delete user.token;
    writeUsers(users);
  }
  res.json({ ok: true });
});

app.post('/api/auth/login/request-otp', async (req, res) => {
  const { username, email, password } = req.body || {};
  const identifier = normalizeIdentifier(email || username);

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email/username and password are required' });
  }

  const users = readUsers();
  const user = findUserByIdentifier(users, identifier);
  if (!user || user.provider !== 'local' || !bcrypt.compareSync(password || '', user.password || '')) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!user.email) {
    return res.status(400).json({ error: 'This account does not have an email address for OTP delivery.' });
  }

  try {
    const challenge = await createOtpChallenge({
      purpose: 'login',
      email: user.email,
      userId: user.id,
      name: user.name || user.username || user.email,
      metadata: { role: user.role }
    });

    res.json({ requiresOtp: true, ...challenge });
  } catch (error) {
    console.error('Login OTP error:', error);
    res.status(500).json({ error: 'Unable to send OTP right now' });
  }
});

app.post('/api/auth/login/verify', (req, res) => {
  const { challengeId, otp } = req.body || {};
  if (!challengeId || !otp) {
    return res.status(400).json({ error: 'OTP session and code are required' });
  }

  const verification = verifyOtpChallenge(challengeId, otp, 'login');
  if (verification.error) {
    return res.status(401).json({ error: verification.error });
  }

  const { challenge } = verification;
  const users = readUsers();
  const user = users.find((item) => item.id === challenge.userId);
  if (!user) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const token = generateToken(user.id);
  user.token = token;
  writeUsers(users);

  res.json({ token, user: sanitizeUser(user) });
});

app.post('/api/auth/signup/request-otp', async (req, res) => {
  const { name, email, password, role = 'customer', mobile = '', pan = '' } = req.body || {};
  const normalizedEmail = normalizeIdentifier(email);
  const normalizedRole = String(role || 'customer').toLowerCase() === 'seller' ? 'seller' : 'customer';

  if (!name || !normalizedEmail || !password || !mobile) {
    return res.status(400).json({ error: 'Name, email, password, and mobile are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  if (normalizedRole === 'seller' && !pan) {
    return res.status(400).json({ error: 'PAN number is required for seller accounts' });
  }

  const users = readUsers();
  if (users.some((item) => normalizeIdentifier(item.email) === normalizedEmail)) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  try {
    const challenge = await createOtpChallenge({
      purpose: 'signup',
      email: normalizedEmail,
      name,
      userDraft: {
        name,
        email: normalizedEmail,
        password,
        role: normalizedRole,
        mobile,
        pan
      },
      metadata: { role: normalizedRole }
    });

    res.json({ requiresOtp: true, ...challenge });
  } catch (error) {
    console.error('Signup OTP error:', error);
    res.status(500).json({ error: 'Unable to send OTP right now' });
  }
});

app.post('/api/auth/signup/verify', (req, res) => {
  const { challengeId, otp } = req.body || {};
  if (!challengeId || !otp) {
    return res.status(400).json({ error: 'OTP session and code are required' });
  }

  const verification = verifyOtpChallenge(challengeId, otp, 'signup');
  if (verification.error) {
    return res.status(401).json({ error: verification.error });
  }

  const { challenge } = verification;
  const draft = challenge.userDraft || {};
  const users = readUsers();

  if (users.some((item) => normalizeIdentifier(item.email) === normalizeIdentifier(draft.email))) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  const user = {
    id: `${draft.role === 'seller' ? 'seller' : 'customer'}-${Date.now()}`,
    role: draft.role || 'customer',
    name: draft.name,
    email: normalizeIdentifier(draft.email),
    password: bcrypt.hashSync(draft.password, 10),
    provider: 'local',
    mobile: draft.mobile || '',
    pan: draft.pan || ''
  };

  if (user.role === 'seller') {
    user.username = normalizeIdentifier(draft.email).split('@')[0] || `seller-${Date.now()}`;
  }

  const token = generateToken(user.id);
  user.token = token;
  users.push(user);
  writeUsers(users);

  res.json({ token, user: sanitizeUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { username, email, password } = req.body;
  const users = readUsers();
  const user = users.find(item =>
    (username && item.username === username) ||
    (email && item.email && item.email.toLowerCase() === String(email).toLowerCase())
  );

  if (!user || user.provider !== 'local' || !bcrypt.compareSync(password || '', user.password || '')) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user.id);
  user.token = token;
  writeUsers(users);

  res.json({ token, user: sanitizeUser(user) });
});

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const users = readUsers();
  if (users.some(item => item.email && item.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  const user = {
    id: `customer-${Date.now()}`,
    role: 'customer',
    name,
    email: email.toLowerCase(),
    password: bcrypt.hashSync(password, 10),
    provider: 'local'
  };
  const token = generateToken(user.id);
  user.token = token;
  users.push(user);
  writeUsers(users);

  res.json({ token, user: sanitizeUser(user) });
});

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Google credential is required' });
  if (!GOOGLE_CLIENT_ID || !googleClient) {
    return res.status(500).json({ error: 'GOOGLE_CLIENT_ID is not configured on this server' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return res.status(401).json({ error: 'Google sign-in failed' });
    if (!payload.email_verified) {
      return res.status(401).json({ error: 'Google email is not verified' });
    }
    if (GOOGLE_HOSTED_DOMAIN && payload.hd && payload.hd !== GOOGLE_HOSTED_DOMAIN) {
      return res.status(401).json({ error: 'Google account domain is not allowed' });
    }
    if (GOOGLE_HOSTED_DOMAIN && !payload.hd) {
      return res.status(401).json({ error: 'Google account domain is required' });
    }

    const users = readUsers();
    const existing = users.find(item =>
      item.google_id === payload.sub ||
      (item.email && item.email.toLowerCase() === payload.email.toLowerCase())
    );
    const id = existing ? existing.id : `google-${Date.now()}`;
    const token = generateToken(id);

    if (existing) {
      existing.token = token;
      existing.name = payload.name || existing.name;
      existing.email = payload.email.toLowerCase();
      existing.google_id = existing.google_id || payload.sub;
      existing.provider = 'google';
      if (!existing.role) existing.role = 'customer';
    } else {
      users.push({
        id,
        role: 'customer',
        name: payload.name || 'Google User',
        email: payload.email.toLowerCase(),
        provider: 'google',
        google_id: payload.sub,
        token
      });
    }

    writeUsers(users);
    const user = readUsers().find(item => item.id === id);
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Google sign-in failed' });
  }
});

app.get('/api/products', (_req, res) => {
  res.json(getProducts());
});

app.post('/api/products', authorizeSeller, (req, res) => {
  const products = normalizeProducts(Array.isArray(req.body) ? req.body : [req.body]);
  writeJson(PRODUCTS_FILE, products);
  res.json({ ok: true, count: products.length });
});

// SMTP Configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true'; // secure:true for port 465, false for 587/others
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SELLER_EMAIL = process.env.SELLER_EMAIL || SMTP_USER || 'seller@petshop.com';

let transporter = null;
if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
} else {
  console.log('\n======================================================');
  console.log('WARNING: SMTP credentials (SMTP_USER/SMTP_PASS) not configured.');
  console.log('Order emails will be written to data/emails-debug.log');
  console.log('======================================================\n');
}

// Write email preview to debug log for local testing
function logEmailToFile(to, subject, html, errorReason = null) {
  const logDir = path.join(__dirname, 'data');
  const logFile = path.join(logDir, 'emails-debug.log');
  
  fs.mkdirSync(logDir, { recursive: true });
  
  const timestamp = new Date().toISOString();
  const logEntry = `
================================================================================
TIMESTAMP: ${timestamp}
RECIPIENT: ${to}
SUBJECT:   ${subject}
${errorReason ? `SMTP ERROR: ${errorReason}\n` : 'STATUS:     SMTP NOT CONFIGURED (LOGGED TO FILE)\n'}
--------------------------------------------------------------------------------
HTML BODY:
${html}
================================================================================
\n`;

  fs.appendFileSync(logFile, logEntry, 'utf8');
  console.log(`[Email Logged] No active SMTP configuration. Logged email for ${to} to data/emails-debug.log`);
}

// Core mail sender
async function sendNotificationEmail(to, subject, html) {
  if (!to) {
    console.error('[Email Error] Cannot send email: recipient address is empty.');
    return;
  }
  
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"Pet Shop" <${SMTP_USER}>`,
        to: to,
        subject: subject,
        html: html
      });
      console.log(`[Email Success] Sent email to ${to}. Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`[Email Error] Failed to send email to ${to}:`, error);
      logEmailToFile(to, subject, html, error.message);
    }
  } else {
    logEmailToFile(to, subject, html);
  }
}

// Generate the visual status tracker timeline
function getTimelineHtml(status) {
  const statuses = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
  let activeIndex = statuses.indexOf(status);
  
  const stepColors = {
    activeBg: '#2563eb', // Vibrant indigo/blue
    activeText: '#ffffff',
    inactiveBg: '#e2e8f0',
    inactiveText: '#64748b',
    activeLabel: '#1e293b',
    inactiveLabel: '#94a3b8'
  };

  const steps = [
    { label: 'Ordered', status: 'pending' },
    { label: 'Confirmed', status: 'confirmed' },
    { label: 'Packed', status: 'packed' },
    { label: 'Shipped', status: 'shipped' },
    { label: 'Delivered', status: 'delivered' }
  ];

  let stepsHtml = '';
  for (let i = 0; i < steps.length; i++) {
    const isCompletedOrActive = i <= activeIndex;
    const bg = isCompletedOrActive ? stepColors.activeBg : stepColors.inactiveBg;
    const text = isCompletedOrActive ? stepColors.activeText : stepColors.inactiveText;
    const labelColor = isCompletedOrActive ? stepColors.activeLabel : stepColors.inactiveLabel;
    
    stepsHtml += `
      <td align="center" style="width: 20%; padding: 0 4px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
          <tr>
            <td align="center" style="background-color: ${bg}; color: ${text}; width: 32px; height: 32px; border-radius: 50%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; line-height: 32px; text-align: center;">${i + 1}</td>
          </tr>
        </table>
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; margin-top: 6px; font-weight: 600; color: ${labelColor}; text-align: center;">${steps[i].label}</div>
      </td>
    `;
  }

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0; border-collapse: collapse;">
      <tr>
        ${stepsHtml}
      </tr>
    </table>
  `;
}

// HTML Buyer email template
function getBuyerEmailTemplate(order, title, messageHeader, statusText) {
  const items = order.items || [];
  const totals = order.totals || {};
  const customer = order.customer || {};

  let itemsHtml = '';
  items.forEach(item => {
    itemsHtml += `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 0; font-family: sans-serif; font-size: 14px; color: #334155;">${item.name}</td>
        <td style="padding: 12px 0; font-family: sans-serif; font-size: 14px; color: #334155; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 0; font-family: sans-serif; font-size: 14px; color: #334155; text-align: right;">रू ${item.price || item.itemTotal || ''}</td>
      </tr>
    `;
  });

  const timelineHtml = order.status !== 'cancelled' ? getTimelineHtml(order.status) : `
    <div style="background-color: #fee2e2; color: #b91c1c; padding: 12px; border-radius: 8px; text-align: center; font-family: sans-serif; font-size: 14px; font-weight: bold; margin: 20px 0;">
      This order has been cancelled.
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 20px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">Pet Shop 🐾</h1>
                  <p style="margin: 5px 0 0 0; color: #dbeafe; font-size: 14px;">Your Premium Pet Companion Store</p>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: bold; color: #1e293b;">${messageHeader}</h2>
                  <p style="margin: 0; font-size: 15px; color: #64748b; line-height: 1.5;">Hi ${customer.name || 'Valued Customer'}, your order status is updated to <strong>${statusText}</strong>.</p>
                  
                  <!-- Timeline Tracker -->
                  ${timelineHtml}
                  
                  <!-- Order Details Box -->
                  <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 20px; margin-top: 25px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-family: sans-serif; font-size: 14px; color: #64748b;">Order ID:</td>
                        <td style="font-family: sans-serif; font-size: 14px; font-weight: bold; color: #1e293b; text-align: right;">${order.id}</td>
                      </tr>
                      <tr>
                        <td style="font-family: sans-serif; font-size: 14px; color: #64748b; padding-top: 6px;">Date:</td>
                        <td style="font-family: sans-serif; font-size: 14px; color: #1e293b; text-align: right; padding-top: 6px;">${new Date(order.createdAt).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="font-family: sans-serif; font-size: 14px; color: #64748b; padding-top: 6px;">Payment Method:</td>
                        <td style="font-family: sans-serif; font-size: 14px; text-transform: uppercase; color: #1e293b; text-align: right; padding-top: 6px;">${order.payment?.method || 'COD'}</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Order Items Table -->
                  <h3 style="margin: 25px 0 10px 0; font-size: 16px; font-weight: bold; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Order Summary</h3>
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                    <thead>
                      <tr style="border-bottom: 2px solid #f1f5f9;">
                        <th align="left" style="padding-bottom: 8px; font-size: 13px; text-transform: uppercase; color: #94a3b8; font-weight: bold;">Item</th>
                        <th align="center" style="padding-bottom: 8px; font-size: 13px; text-transform: uppercase; color: #94a3b8; font-weight: bold; width: 60px;">Qty</th>
                        <th align="right" style="padding-bottom: 8px; font-size: 13px; text-transform: uppercase; color: #94a3b8; font-weight: bold; width: 100px;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                      <tr>
                        <td colspan="2" style="padding: 12px 0 6px 0; font-family: sans-serif; font-size: 14px; color: #64748b;">Subtotal:</td>
                        <td style="padding: 12px 0 6px 0; font-family: sans-serif; font-size: 14px; color: #334155; text-align: right;">रू ${totals.subtotal || 0}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 6px 0; font-family: sans-serif; font-size: 14px; color: #64748b;">Delivery Charge:</td>
                        <td style="padding: 6px 0; font-family: sans-serif; font-size: 14px; color: #334155; text-align: right;">रू ${totals.delivery || 0}</td>
                      </tr>
                      ${totals.discount ? `
                      <tr>
                        <td colspan="2" style="padding: 6px 0; font-family: sans-serif; font-size: 14px; color: #64748b;">Discount:</td>
                        <td style="padding: 6px 0; font-family: sans-serif; font-size: 14px; color: #ef4444; text-align: right;">- रू ${totals.discount}</td>
                      </tr>
                      ` : ''}
                      <tr style="border-top: 2px double #e2e8f0;">
                        <td colspan="2" style="padding: 12px 0; font-family: sans-serif; font-size: 16px; font-weight: bold; color: #1e293b;">Total Paid:</td>
                        <td style="padding: 12px 0; font-family: sans-serif; font-size: 16px; font-weight: bold; color: #2563eb; text-align: right;">रू ${totals.total || 0}</td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- Delivery Address -->
                  <h3 style="margin: 25px 0 10px 0; font-size: 16px; font-weight: bold; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Delivery Details</h3>
                  <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.5;">
                    <strong>${customer.name}</strong><br>
                    ${customer.address}<br>
                    ${customer.city}, ${customer.state} - ${customer.pincode}<br>
                    Phone: ${customer.phone}
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 25px 40px; text-align: center;">
                  <p style="margin: 0; font-size: 13px; color: #94a3b8;">If you have any questions, please contact us at support@petshop.com.</p>
                  <p style="margin: 5px 0 0 0; font-size: 13px; color: #94a3b8;">&copy; ${new Date().getFullYear()} Pet Shop. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// HTML Seller email template
function getSellerEmailTemplate(order) {
  const items = order.items || [];
  const totals = order.totals || {};
  const customer = order.customer || {};

  let itemsHtml = '';
  items.forEach(item => {
    itemsHtml += `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 0; font-family: sans-serif; font-size: 14px; color: #334155;">${item.name}</td>
        <td style="padding: 12px 0; font-family: sans-serif; font-size: 14px; color: #334155; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 0; font-family: sans-serif; font-size: 14px; color: #334155; text-align: right;">रू ${item.price || item.itemTotal || ''}</td>
      </tr>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order Alert - ${order.id}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 20px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #764ba2 0%, #667eea 100%); padding: 30px 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: bold; letter-spacing: -0.5px;">New Order Alert! 🎉</h1>
                  <p style="margin: 5px 0 0 0; color: #e9d5ff; font-size: 14px;">An order has been placed on Pet Shop</p>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #1e293b;">Order Information</h2>
                  <p style="margin: 0; font-size: 14px; color: #64748b;">Order <strong>${order.id}</strong> has been successfully placed by a customer.</p>
                  
                  <!-- Customer details -->
                  <h3 style="margin: 25px 0 10px 0; font-size: 15px; font-weight: bold; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Customer & Delivery Details</h3>
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="font-family: sans-serif; font-size: 14px; color: #334155; line-height: 1.6;">
                    <tr>
                      <td style="font-weight: bold; width: 120px; vertical-align: top; padding-bottom: 6px;">Name:</td>
                      <td style="padding-bottom: 6px;">${customer.name}</td>
                    </tr>
                    <tr>
                      <td style="font-weight: bold; vertical-align: top; padding-bottom: 6px;">Email:</td>
                      <td style="padding-bottom: 6px;"><a href="mailto:${customer.email}" style="color: #667eea; text-decoration: none;">${customer.email}</a></td>
                    </tr>
                    <tr>
                      <td style="font-weight: bold; vertical-align: top; padding-bottom: 6px;">Phone:</td>
                      <td style="padding-bottom: 6px;">${customer.phone}</td>
                    </tr>
                    <tr>
                      <td style="font-weight: bold; vertical-align: top; padding-bottom: 6px;">Shipping Address:</td>
                      <td style="padding-bottom: 6px;">
                        ${customer.address}<br>
                        ${customer.city}, ${customer.state} - ${customer.pincode}
                      </td>
                    </tr>
                    <tr>
                      <td style="font-weight: bold; vertical-align: top; padding-bottom: 6px;">Payment Method:</td>
                      <td style="text-transform: uppercase; padding-bottom: 6px;">${order.payment?.method || 'COD'}</td>
                    </tr>
                  </table>

                  <!-- Order Items Table -->
                  <h3 style="margin: 25px 0 10px 0; font-size: 15px; font-weight: bold; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Order Summary</h3>
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                    <thead>
                      <tr style="border-bottom: 2px solid #f1f5f9;">
                        <th align="left" style="padding-bottom: 8px; font-size: 13px; text-transform: uppercase; color: #94a3b8; font-weight: bold;">Item</th>
                        <th align="center" style="padding-bottom: 8px; font-size: 13px; text-transform: uppercase; color: #94a3b8; font-weight: bold; width: 60px;">Qty</th>
                        <th align="right" style="padding-bottom: 8px; font-size: 13px; text-transform: uppercase; color: #94a3b8; font-weight: bold; width: 100px;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                      <tr>
                        <td colspan="2" style="padding: 12px 0 6px 0; font-family: sans-serif; font-size: 14px; color: #64748b;">Subtotal:</td>
                        <td style="padding: 12px 0 6px 0; font-family: sans-serif; font-size: 14px; color: #334155; text-align: right;">रू ${totals.subtotal || 0}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 6px 0; font-family: sans-serif; font-size: 14px; color: #64748b;">Delivery Charge:</td>
                        <td style="padding: 6px 0; font-family: sans-serif; font-size: 14px; color: #334155; text-align: right;">रू ${totals.delivery || 0}</td>
                      </tr>
                      ${totals.discount ? `
                      <tr>
                        <td colspan="2" style="padding: 6px 0; font-family: sans-serif; font-size: 14px; color: #64748b;">Discount:</td>
                        <td style="padding: 6px 0; font-family: sans-serif; font-size: 14px; color: #ef4444; text-align: right;">- रू ${totals.discount}</td>
                      </tr>
                      ` : ''}
                      <tr style="border-top: 2px double #e2e8f0;">
                        <td colspan="2" style="padding: 12px 0; font-family: sans-serif; font-size: 16px; font-weight: bold; color: #1e293b;">Total Amount:</td>
                        <td style="padding: 12px 0; font-family: sans-serif; font-size: 16px; font-weight: bold; color: #764ba2; text-align: right;">रू ${totals.total || 0}</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <div style="text-align: center; margin-top: 35px;">
                    <a href="http://localhost:3000/seller.html" style="background: linear-gradient(135deg, #764ba2 0%, #667eea 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-size: 15px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(118, 75, 162, 0.2);">Manage Orders in Dashboard</a>
                  </div>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 25px 40px; text-align: center;">
                  <p style="margin: 0; font-size: 13px; color: #94a3b8;">This is an automated operational email from the Pet Shop Backend.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

app.post('/api/orders', (req, res) => {
  const orders = readJson(ORDERS_FILE);
  const order = {
    id: 'ORD-' + Date.now(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...req.body
  };
  orders.unshift(order);
  writeJson(ORDERS_FILE, orders);

  // Trigger Notifications:
  // 1. To the Seller
  const sellerEmail = SELLER_EMAIL || SMTP_USER;
  if (sellerEmail) {
    const sellerSubject = `New Order Placed - Order ID: ${order.id}`;
    const sellerHtml = getSellerEmailTemplate(order);
    sendNotificationEmail(sellerEmail, sellerSubject, sellerHtml);
  } else {
    console.log('[Email Info] Seller email destination is not set.');
  }

  // 2. To the Buyer (Order Placed)
  if (order.customer && order.customer.email) {
    const buyerSubject = `Order Received - Thank you for shopping with us! (ID: ${order.id})`;
    const buyerHtml = getBuyerEmailTemplate(order, 'Order Placed successfully', 'Thank you for your order!', 'Received');
    sendNotificationEmail(order.customer.email, buyerSubject, buyerHtml);
  }

  res.json({ ok: true, order });
});

app.get('/api/orders', authorizeSeller, (_req, res) => {
  res.json(readJson(ORDERS_FILE));
});

app.patch('/api/orders/:id', authorizeSeller, (req, res) => {
  const orders = readJson(ORDERS_FILE);
  const index = orders.findIndex(order => order.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  const oldOrder = orders[index];
  const newStatus = req.body.status;

  orders[index] = { ...orders[index], ...req.body, id: orders[index].id };
  writeJson(ORDERS_FILE, orders);
  
  const updatedOrder = orders[index];

  // Send status update email notifications if status has changed
  if (newStatus && oldOrder.status !== newStatus) {
    const customerEmail = updatedOrder.customer && updatedOrder.customer.email;
    if (customerEmail) {
      if (newStatus === 'packed') {
        const subject = `Your Order is Packed! (ID: ${updatedOrder.id})`;
        const html = getBuyerEmailTemplate(updatedOrder, 'Order Packed', 'Your order has been packed and is ready to ship!', 'Packed');
        sendNotificationEmail(customerEmail, subject, html);
      } else if (newStatus === 'delivered') {
        const subject = `Your Order is Delivered! (ID: ${updatedOrder.id})`;
        const html = getBuyerEmailTemplate(updatedOrder, 'Order Delivered', 'Good news! Your order has been delivered successfully.', 'Delivered');
        sendNotificationEmail(customerEmail, subject, html);
      } else if (newStatus === 'shipped') {
        const subject = `Your Order is Shipped! (ID: ${updatedOrder.id})`;
        const html = getBuyerEmailTemplate(updatedOrder, 'Order Shipped', 'Your order has been shipped and is on its way!', 'Shipped');
        sendNotificationEmail(customerEmail, subject, html);
      } else if (newStatus === 'confirmed') {
        const subject = `Your Order is Confirmed! (ID: ${updatedOrder.id})`;
        const html = getBuyerEmailTemplate(updatedOrder, 'Order Confirmed', 'Your order has been confirmed by our store!', 'Confirmed');
        sendNotificationEmail(customerEmail, subject, html);
      } else if (newStatus === 'cancelled') {
        const subject = `Your Order is Cancelled (ID: ${updatedOrder.id})`;
        const html = getBuyerEmailTemplate(updatedOrder, 'Order Cancelled', 'Your order has been cancelled.', 'Cancelled');
        sendNotificationEmail(customerEmail, subject, html);
      }
    }
  }

  res.json({ ok: true, order: updatedOrder });
});

app.listen(PORT, () => {
  ensureDataFiles();
  console.log(`Pet Shop backend running on http://localhost:${PORT}`);
});
