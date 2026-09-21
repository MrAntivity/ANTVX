// Public Firebase web configuration, not a service-account key.
// Fill this from Firebase Console → Project settings → Your apps.
export const firebaseConfig = {
  apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: ''
};
// Optional reCAPTCHA Enterprise site key. Enable enforcement after testing real traffic.
export const appCheckSiteKey = '';
export const configured = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'].every(key => Boolean(firebaseConfig[key]));
