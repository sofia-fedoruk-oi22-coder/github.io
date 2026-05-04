const express = require("express");
const cors = require("cors");
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK using your service account if present.
// Support either a local `serviceAccountKey.json` file or a FIREBASE_SERVICE_ACCOUNT
// environment variable containing the JSON (raw or base64-encoded).
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
let firebaseInitialized = false;
let firestoreDb = null;
// Diagnostics: track how the service account was provided (but never store the secret)
let serviceAccountSource = null; // 'file' | 'env-raw' | 'env-b64' | null
let firebaseProjectId = null;

const initFirebaseAdmin = () => {
  let serviceAccount = null;

  if (fs.existsSync(serviceAccountPath)) {
    try {
      serviceAccount = require(serviceAccountPath);
      serviceAccountSource = 'file';
      console.log('Loaded serviceAccountKey.json from project root.');
    } catch (err) {
      console.error('Failed to load serviceAccountKey.json:', err && err.stack ? err.stack : err);
    }
  }

  if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    try {
      // Try raw JSON first
      serviceAccount = JSON.parse(raw);
      serviceAccountSource = 'env-raw';
      console.log('Using FIREBASE_SERVICE_ACCOUNT env var (raw JSON).');
    } catch (errRaw) {
      try {
        // Try base64 encoded JSON
        const decoded = Buffer.from(raw, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decoded);
        serviceAccountSource = 'env-b64';
        console.log('Using FIREBASE_SERVICE_ACCOUNT env var (base64-decoded).');
      } catch (errB64) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var as JSON or base64 JSON:', errB64 && errB64.stack ? errB64.stack : errB64);
      }
    }
  }

  if (serviceAccount) {
    try {
      const projectId = serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID;
      const databaseURL = process.env.FIREBASE_DATABASE_URL || `https://${projectId}.firebaseio.com`;

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
        databaseURL,
      });

      firestoreDb = admin.firestore();
      firebaseInitialized = true;
      firebaseProjectId = projectId || null;
      console.log('Firebase Admin initialized for project:', projectId);
      console.log('Admin app options:', admin.app().options && {
        projectId: admin.app().options.projectId,
        databaseURL: admin.app().options.databaseURL,
      });
    } catch (err) {
      console.error('Failed to initialize Firebase Admin:', err && err.stack ? err.stack : err);
    }
  } else {
    console.log('No service account found — Firebase Admin not initialized. Provide serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT env var.');
  }
};

initFirebaseAdmin();

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

// --- Auth endpoints (register / login / profile) ---
// Register a new user using Firebase Admin (creates Auth user + Firestore user doc)
app.post('/api/register', async (req, res) => {
  if (!firebaseInitialized || !firestoreDb) return res.status(500).json({ error: 'Firebase Admin / Firestore not initialized' });
  const { email, password, displayName } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  try {
    const userRecord = await admin.auth().createUser({ email, password, displayName });
    const userDoc = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: displayName || '',
      goalsIds: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await firestoreDb.collection('users').doc(userRecord.uid).set(userDoc);
    res.json({ uid: userRecord.uid, email: userRecord.email });
  } catch (err) {
    console.error('Register error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
});

// Login (email/password) via Firebase Identity Toolkit REST API
// Requires FIREBASE_API_KEY env var (or REACT_APP_FIREBASE_API_KEY)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const apiKey = process.env.FIREBASE_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'FIREBASE_API_KEY not configured on server' });

  const postData = JSON.stringify({ email, password, returnSecureToken: true });
  const options = {
    hostname: 'identitytoolkit.googleapis.com',
    path: `/v1/accounts:signInWithPassword?key=${apiKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const reqHttps = https.request(options, (resp) => {
    let data = '';
    resp.on('data', (chunk) => { data += chunk; });
    resp.on('end', () => {
      try {
        const parsed = data ? JSON.parse(data) : {};
        if (resp.statusCode >= 200 && resp.statusCode < 300) {
          // returns idToken, refreshToken, expiresIn, localId (uid)
          res.json(parsed);
        } else {
          res.status(resp.statusCode || 500).json(parsed);
        }
      } catch (e) {
        console.error('Login parse error', e);
        res.status(500).json({ error: 'Failed to parse login response' });
      }
    });
  });

  reqHttps.on('error', (e) => {
    console.error('Login request error', e);
    res.status(500).json({ error: e.message });
  });

  reqHttps.write(postData);
  reqHttps.end();
});

// Get current user's profile (protected)
app.get('/api/profile', verifyToken, async (req, res) => {
  if (!firebaseInitialized || !firestoreDb) return res.status(500).json({ error: 'Firebase Admin / Firestore not initialized' });
  try {
    const uid = req.user && req.user.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const userRecord = await admin.auth().getUser(uid);
    const userSnap = await firestoreDb.collection('users').doc(uid).get();
    res.json({ auth: userRecord.toJSON(), profile: userSnap.exists ? userSnap.data() : null });
  } catch (err) {
    console.error('GET /api/profile error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
});

// --- Goals API (server-side create & list for authenticated user) ---
// Create a new goal (protected)
app.post('/api/goals', verifyToken, async (req, res) => {
  if (!firebaseInitialized || !firestoreDb) return res.status(500).json({ error: 'Firebase Admin / Firestore not initialized' });
  const uid = req.user && req.user.uid;
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });

  const { title, deadline, motivation, steps, image } = req.body || {};
  try {
    const ref = firestoreDb.collection('goals').doc();
    const newGoal = {
      title: title || '',
      deadline: deadline || null,
      motivation: motivation || '',
      status: 'active',
      image: image || '',
      steps: steps || [],
      createdBy: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await ref.set(newGoal);

    // add goal id to user's goalsIds
    const userRef = firestoreDb.collection('users').doc(uid);
    await userRef.update({ goalsIds: admin.firestore.FieldValue.arrayUnion(ref.id) }).catch(async (e) => {
      // if update fails (missing doc), create the user doc
      await userRef.set({ goalsIds: [ref.id], createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    });

    const snap = await ref.get();
    res.json({ id: ref.id, ...snap.data() });
  } catch (err) {
    console.error('POST /api/goals error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
});

// List goals for authenticated user
app.get('/api/goals', verifyToken, async (req, res) => {
  if (!firebaseInitialized || !firestoreDb) return res.status(500).json({ error: 'Firebase Admin / Firestore not initialized' });
  const uid = req.user && req.user.uid;
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const snapshot = await firestoreDb.collection('goals').where('createdBy', '==', uid).get();
    const results = [];
    snapshot.forEach((doc) => results.push({ id: doc.id, ...doc.data() }));
    res.json(results);
  } catch (err) {
    console.error('GET /api/goals error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
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

// Get completed goals for authenticated user filtered by optional date range
// Query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD
app.get('/api/completed-goals', verifyToken, async (req, res) => {
  if (!firebaseInitialized || !firestoreDb) return res.status(500).json({ error: 'Firebase Admin / Firestore not initialized' });
  const uid = req.user && req.user.uid;
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });

  const { from, to } = req.query || {};

  try {
    // Fetch completed goals for user and filter by date in application code
    const snapshot = await firestoreDb.collection('goals')
      .where('createdBy', '==', uid)
      .where('status', '==', 'completed')
      .get();

    const results = [];
    snapshot.forEach((doc) => {
      const data = doc.data() || {};

      // completedAt may be a Firestore Timestamp, an ISO string, or missing (fallback to updatedAt)
      const ts = data.completedAt || data.updatedAt || null;
      let completedDate = null;
      if (ts && typeof ts.toDate === 'function') {
        completedDate = ts.toDate();
      } else if (typeof ts === 'string') {
        const parsed = new Date(ts);
        if (!Number.isNaN(parsed.getTime())) completedDate = parsed;
      } else if (ts && ts.seconds) {
        completedDate = new Date(ts.seconds * 1000);
      }

      let accept = true;
      if (from) {
        const fromDate = new Date(from);
        fromDate.setHours(0,0,0,0);
        if (!completedDate || completedDate < fromDate) accept = false;
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23,59,59,999);
        if (!completedDate || completedDate > toDate) accept = false;
      }

      if (accept) {
        results.push({ id: doc.id, ...data, completedAt: completedDate ? completedDate.toISOString() : null });
      }
    });

    res.json(results);
  } catch (err) {
    console.error('GET /api/completed-goals error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
});

// Mark a goal as completed and record completion time (protected)
app.post('/api/goals/:id/complete', verifyToken, async (req, res) => {
  if (!firebaseInitialized || !firestoreDb) return res.status(500).json({ error: 'Firebase Admin / Firestore not initialized' });
  const uid = req.user && req.user.uid;
  const goalId = req.params && req.params.id;
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  if (!goalId) return res.status(400).json({ error: 'Goal id is required' });

  try {
    const ref = firestoreDb.collection('goals').doc(goalId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Goal not found' });

    const data = snap.data() || {};
    if (data.createdBy !== uid) return res.status(403).json({ error: 'Forbidden' });

    await ref.update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updated = await ref.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error('POST /api/goals/:id/complete error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
});

// --- Debug endpoints (non-sensitive) ---
app.get('/api/debug/env', (req, res) => {
  try {
    const buildPathCheck = path.join(__dirname, 'my-react-app', 'build');
    const buildExists = fs.existsSync(buildPathCheck);
    // Do not return secret contents — only presence and source
    const projectId = (() => {
      try {
        return admin.apps && admin.apps.length && admin.app().options ? admin.app().options.projectId : firebaseProjectId;
      } catch (e) {
        return firebaseProjectId || null;
      }
    })();

    res.json({
      firebaseInitialized,
      serviceAccountSource: serviceAccountSource || null,
      hasFIREBASE_SERVICE_ACCOUNT_env: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      firebaseProjectId: projectId || null,
      buildExists,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Allow on-demand re-init from current env (useful after adding secrets without full restart)
app.post('/api/debug/reinit', (req, res) => {
  try {
    // reset tracking vars and attempt init again
    serviceAccountSource = null;
    firebaseProjectId = null;
    initFirebaseAdmin();
    res.json({ ok: true, firebaseInitialized, serviceAccountSource, firebaseProjectId });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Root: serve index if build exists, otherwise show helpful message
app.get('/', (req, res) => {
  const buildPathCheck = path.join(__dirname, 'my-react-app', 'build');
  if (fs.existsSync(buildPathCheck)) {
    res.sendFile(path.join(buildPathCheck, 'index.html'));
    return;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <html>
      <head><title>My Goals — Backend</title></head>
      <body>
        <h1>Backend running</h1>
        <p>Frontend build not found on server.</p>
        <p>Available API endpoints:</p>
        <ul>
          <li><a href="/api/message">/api/message</a></li>
          <li><a href="/api/debug/env">/api/debug/env</a> (diagnostics)</li>
          <li>/api/firestore/ping (requires Firebase service account)</li>
        </ul>
        <p>If you see 500 on Firestore endpoints, check that you've added <code>FIREBASE_SERVICE_ACCOUNT</code> correctly and redeployed.</p>
      </body>
    </html>
  `);
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
