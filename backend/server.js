import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());

// In-memory storage
let nextId = 1;
const products = [];

// Helpers
function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true') return true;
    if (v === 'false') return false;
  }
  return undefined;
}

function validateProductPayload(payload, { partial = false } = {}) {
  const errors = [];
  const { title, active, description, price } = payload ?? {};

  if (!partial || 'title' in payload) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push('title must be a non-empty string');
    }
  }

  if (!partial || 'active' in payload) {
    const parsedActive = parseBoolean(active);
    if (parsedActive === undefined) {
      errors.push('active must be boolean');
    }
  }

  if (!partial || 'description' in payload) {
    if (typeof description !== 'string') {
      errors.push('description must be a string');
    }
  }

  if (!partial || 'price' in payload) {
    const numericPrice = typeof price === 'string' ? Number(price) : price;
    if (typeof numericPrice !== 'number' || Number.isNaN(numericPrice)) {
      errors.push('price must be a number');
    } else if (numericPrice < 0) {
      errors.push('price must be >= 0');
    }
  }

  return errors;
}

function normalizeProductPayload(payload) {
  const normalized = { ...payload };
  if ('active' in normalized) normalized.active = parseBoolean(normalized.active);
  if ('price' in normalized) normalized.price = Number(normalized.price);
  if ('title' in normalized && typeof normalized.title === 'string') {
    normalized.title = normalized.title.trim();
  }
  if ('description' in normalized && typeof normalized.description === 'string') {
    normalized.description = normalized.description.trim();
  }
  return normalized;
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// List all products
app.get('/products', (req, res) => {
  res.json(products);
});

// Get product by id
app.get('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const product = products.find(p => p.id === id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

// Create product
app.post('/products', (req, res) => {
  const payload = req.body ?? {};
  const errors = validateProductPayload(payload, { partial: false });
  if (errors.length) return res.status(400).json({ errors });
  const normalized = normalizeProductPayload(payload);
  const product = {
    id: nextId++,
    title: normalized.title,
    active: normalized.active,
    description: normalized.description,
    price: normalized.price,
  };
  products.push(product);
  res.status(201).json(product);
});

// Update product (replace)
app.put('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const payload = req.body ?? {};
  const errors = validateProductPayload(payload, { partial: false });
  if (errors.length) return res.status(400).json({ errors });

  const normalized = normalizeProductPayload(payload);
  const updated = { id, ...normalized };
  products[idx] = updated;
  res.json(updated);
});

// Partial update
app.patch('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const payload = req.body ?? {};
  const errors = validateProductPayload(payload, { partial: true });
  if (errors.length) return res.status(400).json({ errors });

  const normalized = normalizeProductPayload(payload);
  const updated = { ...products[idx], ...normalized };
  products[idx] = updated;
  res.json(updated);
});

// Delete product
app.delete('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [removed] = products.splice(idx, 1);
  res.json(removed);
});

app.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://${HOST}:${PORT}`);
});


