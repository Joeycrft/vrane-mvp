import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import Auth from './Auth';
import Assessment from './Assessment';
import ReadingAssistant from './ReadingAssistant';
import UserProfile from './UserProfile';
import TeacherDashboard from './TeacherDashboard';
import DemoPassageReader from './DemoPassageReader';
import WelcomeBack from './WelcomeBack';

const avatarOptions = [
  { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=1', name: 'avatar1' },
  { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=2', name: 'avatar2' },
  { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=3', name: 'avatar3' },
  { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=4', name: 'avatar4' },
  { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=5', name: 'avatar5' },
];
const defaultAvatar = 'https://api.dicebear.com/6.x/thumbs/svg?seed=default';

function App() {
  const [user, setUser] = useState(null);
  const [assessmentDone, setAssessmentDone] = useState(false);
  const [checkingAssessment, setCheckingAssessment] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const hasRedirected = useRef(false);
  const [userAvatar, setUserAvatar] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUser(user);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      setCheckingAssessment(true);
      const checkAssessment = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role || null);
          if (data.assessmentCompleted) {
            setAssessmentDone(true);
            if (data.readingLevel) {
              localStorage.setItem('vraneLevel', data.readingLevel);
            }
          } else {
            setAssessmentDone(false);
          }
          setUserAvatar(data.avatar || '');
        }
        setCheckingAssessment(false);
      };
      checkAssessment();
    }
  }, [user]);

  useEffect(() => {
    if (!checkingAssessment && userRole && user) {
      if (userRole === 'teacher' && !hasRedirected.current) {
        if (window.location.pathname !== '/dashboard') {
          navigate('/dashboard', { replace: true });
        }
        hasRedirected.current = true;
      }
      if (userRole !== 'teacher' && window.location.pathname === '/dashboard') {
        navigate('/', { replace: true });
      }
    }
  }, [checkingAssessment, userRole, user, navigate]);

  if (checkingAuth) {
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
          justifyContent: 'center'
        }}
      >
        <svg
          width="96"
          height="96"
          viewBox="0 0 96 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="#e67e22"
            strokeWidth="8"
            strokeDasharray="62.8 62.8"
            strokeDashoffset="0"
            strokeLinecap="round"
            fill="none"
            style={{
              transformOrigin: '50% 50%',
              animation: 'vrane-spin 1.1s linear infinite'
            }}
          />
          <style>
            {`
              @keyframes vrane-spin {
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </svg>
      </div>
    );
  }

  if (!user && !checkingAuth) {
    return <Auth onAuth={setUser} />;
  }
  if (checkingAssessment) {
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
          justifyContent: 'center'
        }}
      />
    );
  }

  // Show the dashboard button for teachers only, not on /dashboard
  const showDashboardButton =
    user &&
    !checkingAssessment &&
    userRole === 'teacher' &&
    window.location.pathname !== '/dashboard';

  // Show the profile button for students only, after assessment, not on /profile
  const showProfileButton =
    user &&
    !checkingAssessment &&
    userRole !== 'teacher' &&
    assessmentDone &&
    window.location.pathname !== '/profile';

  return (
    <>
      {showDashboardButton && (
        <button
          onClick={() => window.location.href = '/dashboard'}
          style={{
            position: 'fixed',
            top: 32,
            right: 32,
            background: 'linear-gradient(90deg, #e67e22 0%, #c95c00 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.6rem 1.4rem',
            fontWeight: 700,
            fontSize: '1.08rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(230,103,34,0.13)',
            fontFamily: 'Nunito',
            transition: 'background 0.3s',
            zIndex: 2000
          }}
        >
          Dashboard
        </button>
      )}
      {showProfileButton && (
        <div style={{ position: 'fixed', top: 16, right: 32, zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img
            src={userAvatar ? (avatarOptions.find(a => a.name === userAvatar)?.src || defaultAvatar) : defaultAvatar}
            alt="avatar"
            style={{ width: 48, height: 48, borderRadius: '50%', border: '2.5px solid #e67e22', background: '#fff8ed', marginBottom: 6, objectFit: 'cover', boxShadow: '0 2px 8px rgba(230,103,34,0.13)' }}
          />
          <button
            onClick={() => window.location.href = '/profile'}
            style={{
              background: 'linear-gradient(90deg, #c95c00 0%, #e67e22 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0.6rem 1.4rem',
              fontWeight: 700,
              fontSize: '1.08rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(230,103,34,0.13)',
              fontFamily: 'Nunito',
              transition: 'background 0.3s',
            }}
          >
            Profile
          </button>
        </div>
      )}
      <Routes>
        <Route
          path="/"
          element={
            userRole === 'teacher'
              ? <Navigate to="/dashboard" />
              : assessmentDone
                ? <Navigate to="/welcome" />
                : <Navigate to="/assessment" />
          }
        />
        <Route 
          path="/welcome" 
          element={
            assessmentDone 
              ? <WelcomeBack /> 
              : <Navigate to="/assessment" />
          } 
        />
        <Route path="/assessment" element={<Assessment />} />
        <Route 
          path="/reading" 
          element={
            assessmentDone 
              ? <ReadingAssistant /> 
              : <Navigate to="/assessment" />
          } 
        />
        <Route
          path="/profile"
          element={
            assessmentDone 
              ? <UserProfile
                  onLogout={async () => {
                    await auth.signOut();
                    window.location.reload();
                  }}
                  onRetake={() => window.location.reload()}
                />
              : <Navigate to="/assessment" />
          }
        />
        <Route
          path="/dashboard"
          element={
            userRole === 'teacher'
              ? <TeacherDashboard />
              : <Navigate to="/" />
          }
        />
        <Route path="/demo-reader" element={<DemoPassageReader />} />
      </Routes>
    </>
  );
}

export default App;