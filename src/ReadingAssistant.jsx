import React, { useState, useEffect } from 'react';
import vraneLogo from './assets/Logo no backround.png';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

function ReadingAssistant() {
  const [text, setText] = useState('');
  const [showPassage, setShowPassage] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [highlight, setHighlight] = useState('');
  const [breakdown, setBreakdown] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  const user = auth.currentUser;
  const avatarOptions = [
    { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=1', name: 'avatar1' },
    { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=2', name: 'avatar2' },
    { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=3', name: 'avatar3' },
    { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=4', name: 'avatar4' },
    { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=5', name: 'avatar5' },
  ];
  const defaultAvatar = 'https://api.dicebear.com/6.x/thumbs/svg?seed=default';

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setNickname(userDoc.data().nickname || 'Reader');
          setAvatar(userDoc.data().avatar || '');
        }
      }
    };
    fetchProfile();
  }, [user]);

  // Handler for text selection in reading mode
  useEffect(() => {
    if (!isReading) return;
    const handleMouseUp = async () => {
      const selection = window.getSelection();
      const selected = selection && selection.toString();
      if (selected && text.includes(selected)) {
        setHighlight(selected);
        setLoading(true);
        setBreakdown('');
        try {
          const res = await fetch('/api/highlight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              question: '',
              answer: selected,
              // Prompt only for a simple, student-friendly explanation
              prompt: `Explain the following text in a simple way that helps a student understand it: "${selected}"`,
            }),
          });
          const data = await res.json();
          setBreakdown(data.analysis);
        } catch (err) {
          setBreakdown('Error getting breakdown.');
        }
        setLoading(false);
      }
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
    // eslint-disable-next-line
  }, [isReading, text]);

  // Daily motivational/learning quotes
  const quotes = [
    "The beautiful thing about learning is that no one can take it away from you. – B.B. King",
    "Success is the sum of small efforts, repeated day in and day out. – Robert Collier",
    "Reading is to the mind what exercise is to the body. – Joseph Addison",
    "The more that you read, the more things you will know. – Dr. Seuss",
    "Education is the most powerful weapon which you can use to change the world. – Nelson Mandela",
    "The expert in anything was once a beginner. – Helen Hayes",
    "Motivation is what gets you started. Habit is what keeps you going. – Jim Ryun",
    "You are braver than you believe, stronger than you seem, and smarter than you think. – A.A. Milne",
    "Learning never exhausts the mind. – Leonardo da Vinci",
    "It's not that I'm so smart, it's just that I stay with problems longer. – Albert Einstein"
  ];
  // Pick a quote based on the current day (refreshes every 24 hours)
  const today = new Date();
  const quoteIndex = Math.floor(today.setHours(0,0,0,0) / (1000 * 60 * 60 * 24)) % quotes.length;
  const dailyQuote = quotes[quoteIndex];

  return (
    <div className="vrane-landing-bg" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff8ed 0%, #ffe0b2 100%)', position: 'relative' }}>
      {/* Demo Passage Reader Button at the very top, in normal flow */}
      <div style={{ width: '100%', textAlign: 'center', paddingTop: 32, marginBottom: 32 }}>
        <a
          href="/demo-reader"
          style={{
            display: 'inline-block',
            background: 'linear-gradient(90deg, #e67e22 0%, #c95c00 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '0.9rem 2.2rem',
            fontWeight: 900,
            fontSize: '1.18rem',
            fontFamily: 'Montserrat',
            letterSpacing: 1,
            boxShadow: '0 2px 8px rgba(230,103,34,0.13)',
            textDecoration: 'none',
            transition: 'background 0.2s',
            cursor: 'pointer'
          }}
        >
          Learn with Vrane
        </a>
      </div>
      <div style={{ width: '100%', maxWidth: 600, minHeight: 400, background: 'linear-gradient(135deg, #fff, #fff8ed 90%)', borderRadius: 24, boxShadow: '0 8px 40px rgba(230, 103, 34, 0.18)', padding: '2.5rem 2.2rem 2rem 2.2rem', textAlign: 'center', position: 'relative', margin: '64px auto 0 auto', display: 'flex', flexDirection: 'column', justifyContent: !showPassage ? 'center' : 'flex-start', alignItems: 'center', transition: 'box-shadow 0.3s' }}>
        <img
          src={avatar ? (avatarOptions.find(a => a.name === avatar)?.src || defaultAvatar) : defaultAvatar}
          alt="avatar"
          style={{ width: 96, height: 96, borderRadius: '50%', border: '3.5px solid #e67e22', background: '#fff8ed', objectFit: 'cover', marginBottom: 18, marginTop: 8, boxShadow: '0 2px 12px rgba(230,103,34,0.10)' }}
        />
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '2.5rem', color: '#c95c00', letterSpacing: 1, textShadow: '0 2px 8px #ffe0b2' }}>
            Welcome back{nickname ? `, ${nickname}` : ''}!
          </span>
          {/* Sparkle/confetti effect */}
          <span style={{ position: 'absolute', left: '100%', top: 0, fontSize: '2.1rem', color: '#e67e22', animation: 'sparkle 1.2s infinite alternate' }}>✨</span>
          <style>{`@keyframes sparkle { 0% { opacity: 0.7; transform: scale(1) rotate(-10deg);} 100% { opacity: 1; transform: scale(1.2) rotate(10deg);} }`}</style>
        </div>
        {/* Removed subheading */}
        <div style={{ color: '#c95c00', fontWeight: 600, fontSize: '1.13rem', marginBottom: 28, fontFamily: 'Nunito', letterSpacing: 0.2 }}>
          {dailyQuote}
        </div>
        {!showPassage ? (
          <>
            <button
              onClick={() => { setShowPassage(true); setIsReading(false); }}
              style={{ background: 'linear-gradient(90deg, #e67e22 0%, #c95c00 100%)', color: '#fff', border: 'none', borderRadius: 10, padding: '1.1rem 2.5rem', fontWeight: 900, fontSize: '1.22rem', fontFamily: 'Montserrat', letterSpacing: 1, boxShadow: '0 2px 12px rgba(230,103,34,0.13)', cursor: 'pointer', marginBottom: 8, marginTop: 8, transition: 'background 0.2s' }}
            >
              Paste a Passage to Read
            </button>
          </>
        ) : !isReading ? (
          <>
            <p style={{ color: '#e67e22', fontFamily: 'Montserrat, Arial, sans-serif', marginBottom: '1.2rem', fontSize: '1.25rem', marginTop: 0 }}>
              Paste your reading passage below to get started.
            </p>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={8}
              style={{ width: '100%', fontSize: '1.1rem', fontFamily: 'Montserrat', padding: '0.8rem', borderRadius: 8, border: '1.5px solid #ffe0b2', marginBottom: '1.2rem', resize: 'vertical', background: '#fff8ed' }}
              placeholder="Paste or type your passage here..."
            />
            <button
              className="vrane-btn vrane-gradient-btn"
              style={{
                background: 'linear-gradient(90deg, #c95c00 0%, #e67e22 100%)',
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
                marginBottom: 8
              }}
              onClick={() => setIsReading(true)}
              disabled={!text.trim()}
            >
              Start Reading
            </button>
            <button
              className="vrane-btn vrane-gradient-btn"
              style={{
                background: '#fff3e0',
                color: '#e67e22',
                border: '1.5px solid #e67e22',
                borderRadius: 8,
                padding: '0.9rem 0',
                fontWeight: 700,
                fontSize: '1.08rem',
                cursor: 'pointer',
                minWidth: 170,
                boxShadow: '0 2px 8px rgba(230,103,34,0.13)',
                transition: 'background 0.3s',
                fontFamily: 'Nunito',
                marginBottom: 8
              }}
              onClick={() => setShowPassage(false)}
            >
              Back to Home
            </button>
          </>
        ) : (
          <>
            <div
              style={{ margin: '1.5rem 0', color: '#c95c00', fontWeight: 700, fontSize: '1.15rem', background: '#fff8ed', borderRadius: 10, padding: '1.2rem 1.5rem', boxShadow: '0 2px 8px rgba(230,103,34,0.07)', cursor: 'text', userSelect: 'text' }}
            >
              {text}
            </div>
            {/* Breakdown box appears below passage if highlight is set */}
            {highlight && (
              <div style={{ margin: '1.2rem 0 0.5rem 0', background: '#fffbe9', borderRadius: 10, padding: '1.1rem 1.3rem', boxShadow: '0 2px 8px rgba(230,103,34,0.10)', color: '#a85c00', fontWeight: 600, fontSize: '1.08rem', textAlign: 'left', maxWidth: 520, width: '100%' }}>
                {loading ? 'Loading breakdown...' : breakdown}
              </div>
            )}
            <button
              className="vrane-btn vrane-gradient-btn"
              style={{
                background: '#fff3e0',
                color: '#e67e22',
                border: '1.5px solid #e67e22',
                borderRadius: 8,
                padding: '0.9rem 0',
                fontWeight: 700,
                fontSize: '1.08rem',
                cursor: 'pointer',
                minWidth: 170,
                boxShadow: '0 2px 8px rgba(230,103,34,0.13)',
                transition: 'background 0.3s',
                fontFamily: 'Nunito',
                marginBottom: 8
              }}
              onClick={() => {
                setIsReading(false);
                setHighlight('');
                setBreakdown('');
              }}
            >
              Back to Passage Input
            </button>
          </>
        )}
      </div>
      {/* Vrane logo in bottom right of the screen */}
      <img
        src={vraneLogo}
        alt="Vrane logo"
        style={{ position: 'fixed', bottom: -36, right: -36, width: 140, height: 140, objectFit: 'contain', objectPosition: 'center', zIndex: 3000, background: 'none', border: 'none', boxShadow: 'none', borderRadius: 0, margin: 0, padding: 0 }}
      />
    </div>
  );
}

export default ReadingAssistant;
