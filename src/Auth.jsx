import React, { useState } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import vraneLogo from './assets/Logo no backround.png'; // Adjust path if needed

function Auth({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState('student');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Save role to Firestore
        const { getFirestore, doc, setDoc } = await import('firebase/firestore');
        const db = getFirestore();
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          role,
          assessmentCompleted: false,
          readingLevel: ''
        });
      }
      onAuth(auth.currentUser);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    onAuth(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #fff8ed 0%, #ffe0b2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Montserrat, Arial, sans-serif',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 4px 24px rgba(230, 103, 34, 0.10)',
          padding: '2.5rem 2.2rem 2rem 2.2rem',
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        <img
          src={vraneLogo}
          alt="Vrane logo"
          style={{
            width: 88,
            height: 88,
            objectFit: 'cover',
            objectPosition: 'center',
            position: 'absolute',
            top: -44,
            left: '50%',
            transform: 'translateX(-50%) scale(1.18)',
            background: '#fff8ed',
            borderRadius: '50%',
            border: '2px solid #e67e22',
            boxShadow: '0 2px 8px rgba(230,103,34,0.08)'
          }}
        />
        <h2
          style={{
            fontFamily: "'Poppins', 'Montserrat', Arial, sans-serif",
            marginTop: 40,
            marginBottom: 24,
            fontWeight: 900,
            letterSpacing: 2,
            fontSize: '2.3rem',
            color: '#c95c00',
            lineHeight: 1.1,
          }}
        >
          Welcome to Vrane
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              marginBottom: 14,
              padding: 12,
              borderRadius: 8,
              border: '1.5px solid #e67e22',
              fontSize: '1rem',
              fontFamily: 'inherit'
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              marginBottom: 14,
              padding: 12,
              borderRadius: 8,
              border: '1.5px solid #e67e22',
              fontSize: '1rem',
              fontFamily: 'inherit'
            }}
          />
          {!isLogin && (
            <div style={{ marginBottom: 14, textAlign: 'left' }}>
              <label style={{ fontWeight: 600, marginRight: 12 }}>
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={role === 'student'}
                  onChange={() => setRole('student')}
                  style={{ marginRight: 6 }}
                />
                Student
              </label>
              <label style={{ fontWeight: 600 }}>
                <input
                  type="radio"
                  name="role"
                  value="teacher"
                  checked={role === 'teacher'}
                  onChange={() => setRole('teacher')}
                  style={{ marginRight: 6, marginLeft: 18 }}
                />
                Teacher
              </label>
            </div>
          )}
          {error && (
            <div style={{ color: '#e74c3c', marginBottom: 14, fontWeight: 500 }}>
              {error}
            </div>
          )}
          <button
            className="vrane-btn"
            type="submit"
            style={{
              width: '100%',
              background: 'linear-gradient(90deg, #c95c00 0%, #e67e22 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0.9rem 0',
              fontWeight: 700,
              fontSize: '1.08rem',
              cursor: 'pointer',
              marginBottom: 10,
              marginTop: 2,
              boxShadow: '0 2px 8px rgba(230,103,34,0.13)'
            }}
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <button
          className="vrane-btn"
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, #ffe0b2 0%, #ffb347 100%)',
            color: '#c95c00',
            border: '1.5px solid #e67e22',
            borderRadius: 8,
            padding: '0.8rem 0',
            fontWeight: 700,
            fontSize: '1.05rem',
            cursor: 'pointer',
            marginBottom: 8
          }}
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
        </button>
        {auth.currentUser && (
          <button
            className="vrane-btn"
            style={{
              width: '100%',
              background: '#fff3e0',
              color: '#e67e22',
              border: '1.5px solid #e67e22',
              borderRadius: 8,
              padding: '0.8rem 0',
              fontWeight: 700,
              fontSize: '1.05rem',
              cursor: 'pointer'
            }}
            onClick={handleLogout}
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

export default Auth;

// To use the Poppins font, add this to your public/index.html <head>:
// <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&family=Poppins:wght@700;900&display=swap" rel="stylesheet">