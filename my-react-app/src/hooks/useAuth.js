import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, firestoreDb, missingFirebaseVars } from '../services/firebaseClient';

function logAuthState(currentUser) {
  if (currentUser) {
    console.log('User ID:', currentUser.uid);
    console.log('Email:', currentUser.email);
    console.log('Display Name:', currentUser.displayName);
    console.log('Profile Photo URL:', currentUser.photoURL);
    return;
  }

  console.log('No user is currently signed in.');
}

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authInfo, setAuthInfo] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profileAge, setProfileAge] = useState('');
  const [profileInfo, setProfileInfo] = useState('');
  const [profileError, setProfileError] = useState('');

  const ensureUserRecord = async (currentUser) => {
    console.log('ensureUserRecord called for:', currentUser?.uid);
    
    if (!currentUser) {
      console.log('No current user');
      return;
    }

    if (!firestoreDb) {
      console.error('FirestoreDb is not initialized!');
      throw new Error('Firestore не ініціалізовано');
    }

    try {
      const userRef = doc(firestoreDb, 'users', currentUser.uid);
      console.log('User ref path:', userRef.path);
      
      const snapshot = await getDoc(userRef);
      console.log('Existing user doc:', snapshot.exists());
      
      const existing = snapshot.exists() ? snapshot.data() : {};

      const userData = {
        email: currentUser.email || '',
        name: currentUser.displayName || existing.name || '',
        age: existing.age ?? '',
        goalsIds: existing.goalsIds || [],
      };

      console.log('Attempting to write user data:', userData);
      
      // Завжди використовуємо setDoc з merge - це обробить як create так і update
      await setDoc(userRef, userData, { merge: true });
      
      console.log('User record saved successfully');
    } catch (error) {
      console.error('Error in ensureUserRecord:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw error;
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoadingAuth(false);
      setAuthError(
        `Firebase не ініціалізовано. Додайте змінні середовища: ${missingFirebaseVars.join(', ')}`
      );
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      logAuthState(currentUser);
      setUser(currentUser);

      if (currentUser) {
        try {
          await ensureUserRecord(currentUser);
        } catch (error) {
          console.error('Failed to sync user profile to database:', error);
        }
      }

      setLoadingAuth(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setProfileDisplayName('');
      setProfileAge('');
      setProfileInfo('');
      setProfileError('');
      return;
    }

    setProfileDisplayName(user.displayName || '');

    const loadProfile = async () => {
      if (!firestoreDb) {
        return;
      }

      try {
        const snapshot = await getDoc(doc(firestoreDb, 'users', user.uid));
        if (!snapshot.exists()) {
          setProfileAge('');
          return;
        }

        const data = snapshot.data();
        setProfileDisplayName(data.name || user.displayName || '');
        setProfileAge(data.age === undefined || data.age === null ? '' : String(data.age));
      } catch (error) {
        console.error('Failed to load user profile from database:', error);
      }
    };

    loadProfile();
  }, [user]);

  const signUp = async () => {
    const normalizedEmail = email.trim();
    return createUserWithEmailAndPassword(auth, normalizedEmail, password);
  };

  const login = async () => {
    const normalizedEmail = email.trim();
    return signInWithEmailAndPassword(auth, normalizedEmail, password);
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthInfo('');

    if (!auth) {
      setAuthError('Firebase Auth недоступний. Перевірте конфігурацію.');
      return;
    }

    try {
      const userCredential = authMode === 'register' ? await signUp() : await login();
      setUser(userCredential.user);

      try {
        await ensureUserRecord(userCredential.user);
      } catch (syncError) {
        console.error('Failed to sync user profile during auth flow:', syncError);
        if (authMode === 'register') {
          setAuthError(`Користувача створено, але помилка при збереженні профілю: ${syncError.message}`);
        } else {
          setAuthError(`Вхід здійснено, але помилка при синхронізації профілю: ${syncError.message}`);
        }
        setPassword('');
        setIsAccountMenuOpen(false);
        return;
      }

      if (authMode === 'register') {
        setAuthInfo(`Користувача створено: ${userCredential.user.email}`);
      } else {
        setAuthInfo(`Вхід виконано: ${userCredential.user.email}`);
      }
      setPassword('');
      setIsAccountMenuOpen(false);
      window.location.hash = '#/';
    } catch (error) {
      setAuthError(error.message || 'Помилка авторизації.');
    }
  };

  const handleLogout = async () => {
    setAuthError('');
    setAuthInfo('');
    setProfileInfo('');
    setProfileError('');
    setIsAccountMenuOpen(false);
    if (!auth) {
      return;
    }

    try {
      await signOut(auth);
      setAuthInfo('Ви вийшли з акаунта.');
    } catch (error) {
      setAuthError(error.message || 'Не вдалося виконати вихід.');
    }
  };

  const goToAuth = (mode) => {
    setAuthMode(mode);
    setIsAccountMenuOpen(false);
    window.location.hash = '#/auth';
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileInfo('');
    setProfileError('');

    if (!auth || !auth.currentUser) {
      setProfileError('Неможливо оновити профіль: користувач не авторизований.');
      return;
    }

    try {
      const normalizedName = profileDisplayName.trim();
      const normalizedAge = profileAge === '' ? '' : Number(profileAge);
      if (profileAge !== '' && Number.isNaN(normalizedAge)) {
        setProfileError('Вік має бути числом.');
        return;
      }

      await updateProfile(auth.currentUser, {
        displayName: normalizedName,
      });

      if (firestoreDb) {
        await setDoc(doc(firestoreDb, 'users', auth.currentUser.uid), {
          email: auth.currentUser.email || '',
          name: normalizedName,
          age: normalizedAge,
        }, { merge: true });
      }

      setUser(auth.currentUser);
      setProfileInfo('Дані профілю оновлено.');
    } catch (error) {
      setProfileError(error.message || 'Не вдалося оновити профіль.');
    }
  };

  const accountBadge = user?.displayName?.[0]?.toUpperCase()
    || user?.email?.[0]?.toUpperCase()
    || 'U';

  return {
    user,
    loadingAuth,
    authMode,
    setAuthMode,
    email,
    setEmail,
    password,
    setPassword,
    authError,
    authInfo,
    handleAuthSubmit,
    handleLogout,
    isAccountMenuOpen,
    setIsAccountMenuOpen,
    goToAuth,
    profileDisplayName,
    setProfileDisplayName,
    profileAge,
    setProfileAge,
    profileInfo,
    profileError,
    saveProfile,
    accountBadge,
  };
}
