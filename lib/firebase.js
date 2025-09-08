const admin = require("firebase-admin");
const path = require("path");

let bucket = null;

function initializeFirebase() {
  if (!admin.apps.length) {
    console.log("🔥 Initializing Firebase with service account file");
    
    const serviceAccountPath = path.join(__dirname, "../firebase-service-account.json");
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      storageBucket: "moa-adate.firebasestorage.app",
    });
    console.log("✅ Firebase initialized successfully");
  }
  
  bucket = admin.storage().bucket();
  return bucket;
}

function getFirebaseBucket() {
  if (!bucket) {
    return initializeFirebase();
  }
  return bucket;
}

module.exports = {
  initializeFirebase,
  getFirebaseBucket,
};