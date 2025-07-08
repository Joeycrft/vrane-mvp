import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const avatarOptions = [
  { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=1', name: 'avatar1' },
  { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=2', name: 'avatar2' },
  { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=3', name: 'avatar3' },
  { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=4', name: 'avatar4' },
  { src: 'https://api.dicebear.com/6.x/thumbs/svg?seed=5', name: 'avatar5' },
];
const defaultAvatar = 'https://api.dicebear.com/6.x/thumbs/svg?seed=default';

export default function WelcomeBack() {
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  const [streak, setStreak] = useState(3); // mock streak
  const [achievements, setAchievements] = useState([
    { label: 'Quiz Master', icon: '🏅' },
    { label: '3-Day Streak', icon: '🔥' },
    { label: 'First Passage', icon: '📖' },
  ]);
  const [books, setBooks] = useState([
    { title: 'The Secret Door', progress: 0.7, lastRead: 'Today' },
    { title: "Jamie's Adventure", progress: 0.4, lastRead: 'Yesterday' },
  ]);
  const navigate = useNavigate();
  const user = auth.currentUser;

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

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff8ed 0%, #ffe0b2 100%)', fontFamily: 'Nunito', padding: 0, position: 'relative' }}>
      {/* Streak in top left of tan background */}
      <div style={{ position: 'absolute', top: 28, left: 32, zIndex: 2, background: 'rgba(255,243,224,0.95)', borderRadius: 16, padding: '0.55em 1.3em', color: '#c95c00', fontWeight: 900, fontSize: '1.13rem', boxShadow: '0 2px 8px rgba(230,103,34,0.10)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.3em' }}>🔥</span> {streak}-Day Streak
      </div>
      <div style={{ maxWidth: 540, margin: '0 auto', background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(230, 103, 34, 0.10)', padding: '2.5rem 2.2rem 2rem 2.2rem', marginTop: 48, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 600 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
          <img
            src={avatar ? (avatarOptions.find(a => a.name === avatar)?.src || defaultAvatar) : defaultAvatar}
            alt="avatar"
            style={{ width: 84, height: 84, borderRadius: '50%', border: '3px solid #e67e22', background: '#fff8ed', objectFit: 'cover', marginBottom: 10 }}
          />
          <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '2.1rem', color: '#c95c00', marginBottom: 2 }}>
            Welcome back{nickname ? `, ${nickname}` : ''}!
          </div>
          <div style={{ color: '#e67e22', fontWeight: 700, fontSize: '1.13rem', marginBottom: 8 }}>
            Ready to keep reading and growing?
          </div>
        </div>
        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginBottom: 28 }}>
          <button
            onClick={() => navigate('/reading')}
            style={{ background: 'linear-gradient(90deg, #e67e22 0%, #c95c00 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.9rem 1.8rem', fontWeight: 800, fontSize: '1.13rem', fontFamily: 'Nunito', cursor: 'pointer', boxShadow: '0 2px 8px rgba(230,103,34,0.13)' }}
          >
            Start New Passage
          </button>
          <button
            onClick={() => navigate('/demo-reader')}
            style={{ background: '#fff3e0', color: '#e67e22', border: '1.5px solid #e67e22', borderRadius: 8, padding: '0.9rem 1.8rem', fontWeight: 800, fontSize: '1.13rem', fontFamily: 'Nunito', cursor: 'pointer' }}
          >
            Try Vrane Demo
          </button>
        </div>
        {/* Books/Passages in Progress */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '1.18rem', color: '#e67e22', marginBottom: 10 }}>Books in Progress</div>
          {books.length === 0 ? (
            <div style={{ color: '#bbb', fontFamily: 'Nunito', textAlign: 'center' }}>No books in progress yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {books.map((book, i) => (
                <div key={i} style={{ background: '#fff8ed', borderRadius: 10, boxShadow: '0 1px 4px rgba(230,103,34,0.07)', padding: '1rem 1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#c95c00', fontSize: '1.08rem' }}>{book.title}</div>
                    <div style={{ color: '#e67e22', fontWeight: 700, fontSize: '0.98rem' }}>Last read: {book.lastRead}</div>
                  </div>
                  <div style={{ minWidth: 120 }}>
                    <div style={{ height: 8, background: '#ffe0b2', borderRadius: 6, marginBottom: 4 }}>
                      <div style={{ width: `${Math.round(book.progress * 100)}%`, height: 8, background: '#e67e22', borderRadius: 6 }} />
                    </div>
                    <div style={{ color: '#c95c00', fontWeight: 700, fontSize: '0.95rem', textAlign: 'right' }}>{Math.round(book.progress * 100)}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Motivational Message */}
        <div style={{ textAlign: 'center', color: '#c95c00', fontWeight: 700, fontSize: '1.13rem', marginTop: 18 }}>
          Keep it up! Every day you read, you get stronger and smarter. 🚀
        </div>
      </div>
    </div>
  );
} 