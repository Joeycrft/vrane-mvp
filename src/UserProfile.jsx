import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function UserProfile({ onLogout, onRetake }) {
  const [readingLevel, setReadingLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [nicknameEdit, setNicknameEdit] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [nicknameSuccess, setNicknameSuccess] = useState(false);
  const [avatar, setAvatar] = useState('');
  // Placeholder avatars from Dicebear (replace with local images in ./assets/avatars/ when available)
  const avatarOptions = [
    { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=1', name: 'avatar1' },
    { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=2', name: 'avatar2' },
    { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=3', name: 'avatar3' },
    { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=4', name: 'avatar4' },
    { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=5', name: 'avatar5' },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setReadingLevel(userDoc.data().readingLevel || '');
          setNickname(userDoc.data().nickname || '');
          setAvatar(userDoc.data().avatar || '');
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  async function handleSaveNickname() {
    if (!user || !nicknameInput.trim()) return;
    setNicknameSaving(true);
    await updateDoc(doc(db, 'users', user.uid), { nickname: nicknameInput.trim() });
    setNickname(nicknameInput.trim());
    setNicknameEdit(false);
    setNicknameSaving(false);
    setNicknameSuccess(true);
    setTimeout(() => setNicknameSuccess(false), 1200);
  }

  async function handleSelectAvatar(name) {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), { avatar: name });
    setAvatar(name);
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          minWidth: '100vw',
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

  return (
    <div
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        background: 'linear-gradient(135deg, #fff8ed 0%, #ffe0b2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div style={{
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 4px 24px rgba(230, 103, 34, 0.10)',
        padding: '2.5rem 2.2rem 2rem 2.2rem',
        maxWidth: 400,
        width: '100%',
        textAlign: 'center',
        position: 'relative'
      }}>
        <h2 style={{
          fontFamily: "'Montserrat'",
          fontWeight: 900,
          fontSize: '2.1rem',
          letterSpacing: 1,
          color: '#c95c00',
          marginBottom: 24
        }}>
          Profile
        </h2>
        <div style={{ fontFamily: 'Nunito', fontSize: '1.18rem', marginBottom: 18 }}>
          <strong>Nickname:</strong>{' '}
          {nicknameEdit ? (
            <>
              <input
                type="text"
                value={nicknameInput}
                onChange={e => setNicknameInput(e.target.value)}
                style={{ fontSize: '1.08rem', borderRadius: 6, border: '1.5px solid #e67e22', padding: '0.3em 0.7em', marginRight: 8 }}
                maxLength={24}
                autoFocus
              />
              <button onClick={handleSaveNickname} disabled={nicknameSaving || !nicknameInput.trim()} style={{ background: '#e67e22', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3em 1em', fontWeight: 700, fontFamily: 'Nunito', cursor: 'pointer', marginRight: 6 }}>{nicknameSaving ? 'Saving...' : 'Save'}</button>
              <button onClick={() => setNicknameEdit(false)} style={{ background: '#fff3e0', color: '#e67e22', border: '1.5px solid #e67e22', borderRadius: 6, padding: '0.3em 1em', fontWeight: 700, fontFamily: 'Nunito', cursor: 'pointer' }}>Cancel</button>
            </>
          ) : (
            <>
              <span style={{ color: '#c95c00', fontWeight: 700, marginRight: 8 }}>{nickname || <span style={{ color: '#bbb' }}>Not set</span>}</span>
              <button onClick={() => { setNicknameEdit(true); setNicknameInput(nickname); }} style={{ background: '#fff3e0', color: '#e67e22', border: '1.5px solid #e67e22', borderRadius: 6, padding: '0.3em 1em', fontWeight: 700, fontFamily: 'Nunito', cursor: 'pointer' }}>Edit</button>
              {nicknameSuccess && <span style={{ color: '#27ae60', fontWeight: 700, marginLeft: 8 }}>Saved!</span>}
            </>
          )}
        </div>
        <div style={{ fontFamily: 'Nunito', fontSize: '1.13rem', marginBottom: 16 }}>
          <strong>Email:</strong> {user?.email}
        </div>
        <div style={{ fontFamily: 'Nunito', fontSize: '1.13rem', marginBottom: 24 }}>
          <strong>Comprehension Level:</strong> {(() => {
            if (!readingLevel) return 'Not set';
            // Handle grade level format
            const match = readingLevel.match(/\d{1,2}(st|nd|rd|th) grade/i);
            return match ? match[0][0].toUpperCase() + match[0].slice(1) : readingLevel;
          })()}
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 8, fontFamily: 'Nunito', fontWeight: 700, color: '#c95c00' }}>Avatar</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginBottom: 8 }}>
            {avatarOptions.map(opt => (
              <img
                key={opt.name}
                src={opt.src}
                alt={opt.name}
                onClick={() => handleSelectAvatar(opt.name)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  border: avatar === opt.name ? '3px solid #e67e22' : '2px solid #ffe0b2',
                  boxShadow: avatar === opt.name ? '0 2px 8px rgba(230,103,34,0.13)' : 'none',
                  cursor: 'pointer',
                  background: '#fff8ed',
                  transition: 'border 0.2s',
                  objectFit: 'cover',
                  outline: 'none',
                }}
              />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            {avatar ? <img src={avatarOptions.find(a => a.name === avatar)?.src} alt="Selected avatar" style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid #e67e22', background: '#fff8ed', objectFit: 'cover', marginTop: 6 }} /> : <span style={{ color: '#bbb', fontFamily: 'Nunito' }}>No avatar selected</span>}
          </div>
        </div>
        <button
          className="vrane-btn vrane-gradient-btn"
          style={{
            background: 'linear-gradient(90deg, #e67e22 0%, #c95c00 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.9rem 0',
            fontWeight: 700,
            fontSize: '1.08rem',
            cursor: 'pointer',
            minWidth: 170,
            boxShadow: '0 2px 8px rgba(230,103,34,0.13)',
            transition: 'background 0.3s',
            fontFamily: 'Nunito',
            marginBottom: 16
          }}
          onClick={() => navigate('/reading')}
        >
          Go to Reading Assistant
        </button>
        <button
          className="vrane-btn"
          style={{
            background: '#fff3e0',
            color: '#e67e22',
            border: '1.5px solid #e67e22',
            borderRadius: 8,
            padding: '0.8rem 0',
            fontWeight: 700,
            fontSize: '1.05rem',
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'Nunito'
          }}
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default UserProfile;