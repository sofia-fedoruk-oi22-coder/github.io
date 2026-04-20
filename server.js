const express = require("express");
const cors = require("cors");
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK using your service account if present
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
let firebaseInitialized = false;
let firestoreDb = null;
if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = require(serviceAccountPath);
    const projectId = serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID;
    const databaseURL = process.env.FIREBASE_DATABASE_URL || `https://${projectId}.firebaseio.com`;

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId,
      databaseURL,
    });

    // create firestore instance once
    firestoreDb = admin.firestore();
    firebaseInitialized = true;
    console.log('Firebase Admin initialized for project:', projectId);
    console.log('Admin app options:', admin.app().options && {
      projectId: admin.app().options.projectId,
      databaseURL: admin.app().options.databaseURL,
    });
  } catch (err) {
    console.error('Failed to initialize Firebase Admin:', err && err.stack ? err.stack : err);
  }
} else {
  console.log('serviceAccountKey.json not found — Firebase Admin not initialized');
}

app.get("/api/message", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

// Auth: verify ID token
app.post('/api/verify-token', async (req, res) => {
  if (!firebaseInitialized) return res.status(500).json({ error: 'Firebase Admin not initialized' });
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'token is required in request body' });
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    res.json({ uid: decoded.uid, claims: decoded });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Get user record by UID
app.get('/api/user/:uid', async (req, res) => {
  if (!firebaseInitialized) return res.status(500).json({ error: 'Firebase Admin not initialized' });
  const { uid } = req.params;
  try {
    const userRecord = await admin.auth().getUser(uid);
    res.json({ user: userRecord.toJSON() });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Verify Firebase Auth Token (middleware)
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (!firebaseInitialized) {
    return res.status(500).json({ message: 'Firebase Admin not initialized' });
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error('Token verification failed:', err && err.stack ? err.stack : err);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// Protected route (only for authenticated users)
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: 'You have accessed a protected route!', user: req.user });
});

// Firestore demo: write & read a doc
app.get('/api/firestore/ping', async (req, res) => {
  if (!firebaseInitialized || !firestoreDb) return res.status(500).json({ error: 'Firebase Admin / Firestore not initialized' });
  try {
    const ref = firestoreDb.collection('demo').doc('ping');
    await ref.set({ timestamp: admin.firestore.FieldValue.serverTimestamp() });
    const snap = await ref.get();
    res.json({ data: snap.data() });
  } catch (err) {
    console.error('Firestore ping error:', err && err.stack ? err.stack : err);
    const body = { message: err && err.message ? err.message : String(err) };
    if (err && err.code) body.code = err.code;
    if (err && err.details) body.details = err.details;
    res.status(500).json({ error: body });
  }
});

// Fetch data from Firestore collection `users`
app.get('/api/users', async (req, res) => {
  if (!firebaseInitialized || !firestoreDb) return res.status(500).json({ error: 'Firebase Admin / Firestore not initialized' });
  try {
    const snapshot = await firestoreDb.collection('users').get();
    const users = [];
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    res.json(users);
  } catch (err) {
    console.error('GET /api/users error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
});

// Serve static files: prefer the React build, fall back to a `public` folder
const buildPath = path.join(__dirname, 'my-react-app', 'build');
const publicPath = path.join(__dirname, 'public');

if (fs.existsSync(buildPath)) {
  console.log('Serving static files from:', buildPath);

  // Serve index.html explicitly
  app.get('/index.html', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });

  // Serve static assets under /static (use regex to avoid '*' route parsing issues)
  app.get(/^\/static\/.*$/, (req, res) => {
    const filePath = path.join(buildPath, req.path);
    res.sendFile(filePath, (err) => {
      if (err) res.status(404).end();
    });
  });

  // SPA fallback for any non-API route
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });

} else if (fs.existsSync(publicPath)) {
  console.log('Serving static files from:', publicPath);
  app.use(express.static(publicPath));
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
