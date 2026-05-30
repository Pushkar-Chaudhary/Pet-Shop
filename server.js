const fs = require('fs');
const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

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
      { id: 'seller-1', role: 'seller', username: 'admin', password: bcrypt.hashSync('petshop2024', 10), name: 'Store Owner', provider: 'local' },
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
  return readJson(USERS_FILE);
}

function writeUsers(users) {
  writeJson(USERS_FILE, users);
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
  res.json({ googleClientId: GOOGLE_CLIENT_ID });
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
  res.json({ ok: true, order });
});

app.get('/api/orders', authorizeSeller, (_req, res) => {
  res.json(readJson(ORDERS_FILE));
});

app.patch('/api/orders/:id', authorizeSeller, (req, res) => {
  const orders = readJson(ORDERS_FILE);
  const index = orders.findIndex(order => order.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  orders[index] = { ...orders[index], ...req.body, id: orders[index].id };
  writeJson(ORDERS_FILE, orders);
  res.json({ ok: true, order: orders[index] });
});

app.listen(PORT, () => {
  ensureDataFiles();
  console.log(`Pet Shop backend running on http://localhost:${PORT}`);
});
