import { firebaseConfig, configured, appCheckSiteKey } from './firebase-config.js';
export { configured };
let connection;
export function connect() {
  if (!configured) throw new Error('Applications are not open yet. Please check back soon.');
  return connection ||= (async () => {
    const base = 'https://www.gstatic.com/firebasejs/12.19.0/';
    const [appSDK, authSDK, dbSDK, storageSDK] = await Promise.all([
      import(`${base}firebase-app.js`), import(`${base}firebase-auth.js`), import(`${base}firebase-firestore.js`), import(`${base}firebase-storage.js`)
    ]);
    const app = appSDK.initializeApp(firebaseConfig);
    if (appCheckSiteKey) {
      const check = await import(`${base}firebase-app-check.js`);
      check.initializeAppCheck(app, { provider: new check.ReCaptchaEnterpriseProvider(appCheckSiteKey), isTokenAutoRefreshEnabled: true });
    }
    return { auth: authSDK.getAuth(app), db: dbSDK.getFirestore(app), storage: storageSDK.getStorage(app), a: authSDK, d: dbSDK, s: storageSDK };
  })().catch(error => { connection = null; throw error; });
}
export async function login() {
  const { auth, a } = await connect();
  await a.setPersistence(auth, a.browserSessionPersistence);
  return a.signInWithPopup(auth, new a.GoogleAuthProvider());
}
export async function logout() { const { auth, a } = await connect(); await a.signOut(auth); }
export function friendlyError(error) {
  if (error.code === 'auth/popup-closed-by-user') return 'Sign-in was cancelled. You can try again.';
  if (error.code === 'auth/popup-blocked') return 'Allow pop-ups for this site, then try signing in again.';
  if (error.code?.includes('permission-denied') || error.code === 'storage/unauthorized') return 'Access was denied. The role may have closed or your permissions may have changed. Refresh and try again.';
  if (error.code === 'unavailable' || error.code === 'auth/network-request-failed') return 'Connection interrupted. Check your internet connection and try again.';
  if (error.code) return 'Something went wrong. Please try again. If this continues, contact antvxstudios@gmail.com.';
  return error.message || 'Something went wrong. Please try again.';
}
