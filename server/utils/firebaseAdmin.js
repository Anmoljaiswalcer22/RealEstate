// Optional Firebase Admin setup. If FIREBASE_SERVICE_ACCOUNT is set, the backend
// verifies Google sign-ins with verifyIdToken() instead of trusting
// the email the browser sends (the production-grade way).
//
// Uses the modular API (firebase-admin/app + firebase-admin/auth), which works
// in firebase-admin v10 and newer.
let adminAuth; // undefined = not initialised yet, false = not configured

function getAdminAuth() {
  if (adminAuth !== undefined) return adminAuth;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!json) {
    adminAuth = false;
    return adminAuth;
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(json);
  } catch {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT in server/.env is not valid JSON. It must be the whole service-account file on ONE line.'
    );
  }
  // Some editors turn "\n" into "\\n"; the private key needs real line breaks
  if (typeof serviceAccount.private_key === 'string') {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  const { initializeApp, getApps, cert } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');

  const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
  adminAuth = getAuth(app);
  return adminAuth;
}

const isConfigured = () => Boolean(getAdminAuth());

async function verifyIdToken(idToken) {
  const auth = getAdminAuth();
  if (!auth) throw new Error('Firebase Admin is not configured');
  return auth.verifyIdToken(idToken);
}

module.exports = { isConfigured, verifyIdToken };
