import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import { collection, addDoc, Timestamp, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import vraneLogo from './assets/Logo no backround.png';

const questions = [
  {
    question: "The puppy was thrilled to go outside. What does 'thrilled' mean?",
    type: "mc",
    options: ["Angry", "Excited", "Tired", "Bored"],
    answer: 1
  },
  {
    question: "What is the main idea of a paragraph?",
    type: "mc",
    options: ["A funny part", "A side note", "The author's key point", "A character's name"],
    answer: 2
  },
  {
    question: "His hands were ice after the snowball fight. What does this mean?",
    type: "mc",
    options: ["He had gloves", "His hands were cold", "He fell", "He was happy"],
    answer: 1
  },
  {
    question: "I stayed up late, so I was tired in class. What is the cause?",
    type: "mc",
    options: ["Being tired", "Staying up late", "Class", "School"],
    answer: 1
  },
  {
    question: "Sara hid her report card under the bed. What can you infer?",
    type: "mc",
    options: ["She's proud", "It's lost", "She's hiding bad grades", "She's sleeping"],
    answer: 2
  },
  {
    question: "'Wow, this is going great,' he said, as everything fell apart. What is the tone?",
    type: "mc",
    options: ["Happy", "Serious", "Sarcastic", "Calm"],
    answer: 2
  },
  {
    question: "Why would an author write a persuasive article?",
    type: "mc",
    options: ["To convince", "To entertain", "To describe", "To summarize"],
    answer: 0
  },
  {
    question: "Which is passive?",
    type: "mc",
    options: ["She kicked the ball", "The ball was kicked by her", "She kicks", "She will kick"],
    answer: 1
  },
  {
    question: "'Time is a thief' is an example of:",
    type: "mc",
    options: ["Metaphor", "Simile", "Personification", "Hyperbole"],
    answer: 0
  },
  {
    question: "What makes an argument valid?",
    type: "mc",
    options: ["Being long", "Being loud", "Strong evidence and reasoning", "Repeating a point"],
    answer: 2
  },
  {
    question: "Explain a time you had to figure something out without help. How did you do it?",
    type: "text"
  },
  {
    question: "Describe what 'courage' means to you using your own words.",
    type: "text"
  },
  {
    question: "What does it mean to 'learn from a mistake'? Give an example.",
    type: "text"
  },
  {
    question: "How would you explain a thunderstorm to a younger sibling?",
    type: "text"
  },
  {
    question: "What makes a story interesting to you?",
    type: "text"
  }
];

function Assessment() {
  console.log('Assessment component loaded');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState('');
  const navigate = useNavigate();

  const current = questions[step];

  const handleNext = () => {
    console.log('handleNext called, step:', step, 'total questions:', questions.length);
    setAnswers([...answers, input]);
    setInput('');
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      console.log('Assessment complete! Starting API call...');
      setProcessing(true);
      fetch('https://vrane-mvp.onrender.com/api/assessment-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: questions.map((q, i) => ({
            question: q.question,
            answer: answers[i] || (i === step ? input : ''),
          })),
        }),
      })
        .then(async data => {
          console.log('Assessment API response:', data);
          const res = await data.json();
          console.log('Assessment result:', res);
          localStorage.setItem('vraneLevel', res.analysis);
          try {
            await addDoc(collection(db, "assessments"), {
              userId: auth.currentUser ? auth.currentUser.uid : null,
              answers: questions.map((q, i) => ({
                question: q.question,
                answer: answers[i] || (i === step ? input : ''),
              })),
              readingLevel: res.analysis,
              created: Timestamp.now()
            });
            console.log('Assessment saved to Firestore');
            
            // Save assessment completion to users/{uid}
            const userId = auth.currentUser ? auth.currentUser.uid : null;
            if (userId) {
              await setDoc(doc(db, 'users', userId), {
                assessmentCompleted: true,
                readingLevel: res.analysis,
                assessmentCompletedAt: serverTimestamp(),
              }, { merge: true });
              console.log('User assessment status updated in Firebase');
            }
          } catch (e) {
            console.error("Error saving assessment to Firestore:", e);
          } finally {
            setResult('done');
            setProcessing(false);
            setStep(step + 1);
          }
        })
        .catch(async (err) => {
          console.error('Error in assessment-result fetch:', err);
          // Even if API fails, mark assessment as completed to prevent infinite loop
          try {
            const userId = auth.currentUser ? auth.currentUser.uid : null;
            if (userId) {
              await setDoc(doc(db, 'users', userId), {
                assessmentCompleted: true,
                readingLevel: 'intermediate', // fallback level
                assessmentCompletedAt: serverTimestamp(),
              }, { merge: true });
              console.log('Assessment marked as completed (fallback)');
            }
          } catch (e) {
            console.error("Error saving assessment completion:", e);
          }
          setResult('done');
          setProcessing(false);
          setStep(step + 1);
        });
    }
  };

  // Retake Assessment: go to home page
  const handleRetake = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  if (processing) {
    return (
      <div className="vrane-landing-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fff8ed 0%, #ffe0b2 100%)' }}>
        <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(230, 103, 34, 0.10)', padding: '2.5rem 2.2rem 2rem 2.2rem', textAlign: 'center', position: 'relative' }}>
          <img
            src={vraneLogo}
            alt="Vrane logo"
            style={{
              width: 72,
              height: 72,
              objectFit: 'cover',
              objectPosition: 'center',
              position: 'absolute',
              top: -36,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#fff8ed',
              borderRadius: '50%',
              border: '2px solid #e67e22',
              boxShadow: '0 2px 8px rgba(230,103,34,0.08)'
            }}
          />
          <div style={{ marginTop: 48 }} />
          <h2 className="vrane-title">Analyzing your answers...</h2>
          <p style={{ color: '#e67e22', marginTop: '1.5rem' }}>Please wait while we determine your comprehension level.</p>
        </div>
      </div>
    );
  }

  if (step >= questions.length) {
    console.log('Showing assessment completion screen');
    return (
      <div className="vrane-landing-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fff8ed 0%, #ffe0b2 100%)' }}>
        <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(230, 103, 34, 0.10)', padding: '2.5rem 2.2rem 2rem 2.2rem', textAlign: 'center', position: 'relative' }}>
          <img
            src={vraneLogo}
            alt="Vrane logo"
            style={{
              width: 72,
              height: 72,
              objectFit: 'cover',
              objectPosition: 'center',
              position: 'absolute',
              top: -36,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#fff8ed',
              borderRadius: '50%',
              border: '2px solid #e67e22',
              boxShadow: '0 2px 8px rgba(230,103,34,0.08)'
            }}
          />
          <div style={{ marginTop: 48 }} />
          <h2 className="vrane-title" style={{ fontFamily: "'Montserrat'", fontWeight: 900, fontSize: '2.1rem', letterSpacing: 1 }}>Assessment Complete!</h2>
          <p style={{ color: '#e67e22', marginTop: '1.5rem', whiteSpace: 'pre-line', fontFamily: "Nunito", fontSize: '1.13rem', fontWeight: 600 }}>
            Vrane now knows who we're working with. Let's get started.
          </p>
          <button
            className="vrane-btn vrane-gradient-btn"
            style={{
              marginTop: '2.2rem',
              marginRight: '1rem',
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
              fontFamily: "Nunito"
            }}
            onClick={() => {
              console.log('Retake Assessment button clicked');
              window.location.href = '/assessment';
            }}
          >
            Retake Assessment
          </button>
          <button
            className="vrane-btn vrane-gradient-btn"
            style={{
              marginTop: '2.2rem',
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
              fontFamily: "Nunito"
            }}
            onClick={() => {
              console.log('Get Started button clicked');
              // Force a hard navigation to welcome page
              window.location.href = '/welcome';
            }}
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vrane-landing-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fff8ed 0%, #ffe0b2 100%)' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(230, 103, 34, 0.10)', padding: '2.5rem 2.2rem 2rem 2.2rem', textAlign: 'center', position: 'relative' }}>
        <img
          src={vraneLogo}
          alt="Vrane logo"
          style={{
            width: 72,
            height: 72,
            objectFit: 'cover',
            objectPosition: 'center',
            position: 'absolute',
            top: -36,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#fff8ed',
            borderRadius: '50%',
            border: '2px solid #e67e22',
            boxShadow: '0 2px 8px rgba(230,103,34,0.08)'
          }}
        />
        <div style={{ marginTop: 48 }} />
        <div style={{ color: '#e67e22', fontWeight: 700, marginBottom: '1.2rem', fontFamily: "'Montserrat'", fontSize: '1.15rem' }}>
          Question {step + 1} of {questions.length}
        </div>
        <div style={{ marginBottom: '1.1rem', color: '#222', fontSize: '1.15rem', fontFamily: "Nunito", fontWeight: 600 }}>
          {current.question}
        </div>
        {current.type === 'mc' ? (
          <div style={{ marginBottom: '1.2rem' }}>
            {current.options.map((opt, idx) => (
              <label key={idx} style={{ display: 'block', marginBottom: 8, cursor: 'pointer', fontFamily: 'Nunito', fontSize: '1.08rem', fontWeight: 500 }}>
                <input
                  type="radio"
                  name={`q${step}`}
                  value={opt}
                  checked={input === opt}
                  onChange={() => setInput(opt)}
                  style={{ marginRight: 10 }}
                />
                {opt}
              </label>
            ))}
          </div>
        ) : (
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              marginBottom: 14,
              padding: 12,
              borderRadius: 8,
              border: '1.5px solid #e67e22',
              fontSize: '1rem',
              fontFamily: 'Nunito',
              resize: 'vertical'
            }}
            placeholder="Type your answer here..."
          />
        )}
        <button
          className="vrane-btn"
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
          disabled={input === ''}
          onClick={handleNext}
        >
          {step < questions.length - 1 ? 'Next' : 'Finish'}
        </button>
      </div>
    </div>
  );
}

export default Assessment;