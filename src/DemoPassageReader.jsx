import React, { useState } from 'react';
import iconBreakdown from './assets/icon-breakdown.png';
import iconQuestion from './assets/icon-question.png';
import iconBoth from './assets/icon-both.png';
import { useNavigate } from 'react-router-dom';

const DEMO_PASSAGE = `
The sun was setting behind the mountains, painting the sky in shades of orange and pink. Jamie sat quietly by the window, reading her favorite book. As she turned the page, a gentle breeze rustled the curtains, carrying the scent of blooming jasmine. She paused, thinking about the adventure the main character was about to begin.

Suddenly, a knock at the door startled her. Jamie closed her book and hurried to answer. On the doorstep stood her best friend, Alex, holding a mysterious envelope. "This just arrived for you," Alex said, eyes wide with excitement.
`;

const MODES = [
  { key: 'breakdown', icon: iconBreakdown, alt: 'Breakdown' },
  { key: 'question', icon: iconQuestion, alt: 'Question' },
  { key: 'both', icon: iconBoth, alt: 'Both' },
];

export default function DemoPassageReader() {
  const [highlight, setHighlight] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [mode, setMode] = useState('breakdown');
  const [answer, setAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [breakdown, setBreakdown] = useState('');
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [highlightCount, setHighlightCount] = useState(0);
  const [showFunFact, setShowFunFact] = useState(false);
  const [funFact, setFunFact] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const navigate = useNavigate();

  // Log state on every render
  console.log("Component state:", { loadingQuestion, question, mode });

  const demoQuiz = [
    {
      q: "What was Jamie doing when the story began?",
      a: ["reading", "reading her favorite book", "reading a book"]
    },
    {
      q: "What did Alex bring to Jamie?",
      a: ["a mysterious envelope", "envelope", "mysterious envelope"]
    },
    {
      q: "Describe the setting outside Jamie's window.",
      a: ["the sun was setting behind the mountains", "sunset", "mountains", "orange and pink sky", "the sky was orange and pink"]
    }
  ];

  const funFacts = [
    "Did you know? The longest word in English has 189,819 letters!",
    "Fun fact: Reading just 20 minutes a day exposes you to 1.8 million words a year.",
    "Encouragement: Every time you read, your brain gets stronger!",
    "Motivation: You're building your future with every page you read.",
    "Did you know? The first novel ever written on a typewriter was 'Tom Sawyer'.",
    "Keep going! Every highlight is a step toward mastery.",
    "Fun fact: People who read regularly sleep better at night.",
    "Encouragement: You're doing amazing—keep exploring new stories!"
  ];

  async function handleMouseUp() {
    console.log("handleMouseUp called");
    const selection = window.getSelection();
    const text = selection && selection.toString();
    console.log("Selected text:", text);
    console.log("Current mode:", mode);

    if (text && DEMO_PASSAGE.includes(text)) {
      console.log("Text is in passage and will proceed:", text);
      setHighlight(text);
      setShowPopup(true);
      setAnswer('');
      setShowFeedback(false);
      setLoading(['breakdown', 'both'].includes(mode));
      setBreakdown('');
      setLoadingQuestion(['question', 'both'].includes(mode));
      setQuestion('');
      // Fetch breakdown if needed
      if (['breakdown', 'both'].includes(mode)) {
        try {
          const comprehensionLevel = localStorage.getItem('vraneLevel') || 'middle school';
          const res = await fetch('/api/highlight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: DEMO_PASSAGE,
              question: '',
              answer: text,
              prompt: `You are an expert reading assistant. A student has highlighted the following text from a story. Give a unique, clear, and helpful explanation of what this text means, written in a way that matches the student's comprehension level. Do not mention the student's level or grade. Do not repeat the original text or add any headers. Only return the explanation.\n\nStudent comprehension level: ${comprehensionLevel}\nHighlighted text: \"${text}\"`
            }),
          });
          const data = await res.json();
          let explanation = data.analysis;
          if (explanation && explanation.includes(':')) {
            explanation = explanation.split(':').slice(1).join(':').trim();
          }
          setBreakdown(explanation);
        } catch (err) {
          setBreakdown('Error getting breakdown.');
        }
        setLoading(false);
      }
      // Fetch question if needed
      if (['question', 'both'].includes(mode)) {
        try {
          const comprehensionLevel = localStorage.getItem('vraneLevel') || 'middle school';
          console.log("Fetching question for:", text);
          const resQ = await fetch('/api/highlight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: DEMO_PASSAGE,
              question: 'question',
              answer: text,
              prompt: `You are a creative reading teacher. Write a unique, open-ended question about the following highlighted text that will help a student think more deeply about its meaning or importance. Make the question specific to the highlighted text and appropriate for the student's comprehension level, but do not mention the level or grade. Only return the question itself.\n\nStudent comprehension level: ${comprehensionLevel}\nHighlighted text: \"${text}\"`
            }),
          });
          const dataQ = await resQ.json();
          console.log("Question backend response:", dataQ);
          let questionText = dataQ.analysis;
          console.log("Raw questionText:", questionText);
          setQuestion(questionText);
          setLoadingQuestion(false);
          console.log("After setQuestion, state should be:", { question: questionText });
        } catch (err) {
          setQuestion('Error getting question.');
          setLoadingQuestion(false);
          console.error("Error fetching question:", err);
        }
      }
      setHighlightCount(count => {
        const newCount = count + 1;
        if (newCount % 3 === 0) {
          setShowFunFact(true);
          setFunFact(funFacts[Math.floor(Math.random() * funFacts.length)]);
        } else {
          setShowFunFact(false);
        }
        return newCount;
      });
      setFeedbackGiven(false);
    } else {
      setShowPopup(false);
      setHighlight('');
      setAnswer('');
      setShowFeedback(false);
      setBreakdown('');
      setQuestion('');
      setLoadingQuestion(false);
      setShowFunFact(false);
      setFeedbackGiven(false);
    }
  }

  function handleClosePopup() {
    setShowPopup(false);
    setHighlight('');
    setAnswer('');
    setShowFeedback(false);
  }

  function handleSubmitAnswer(e) {
    e.preventDefault();
    setShowFeedback(true);
  }

  // Chat logic
  function handleSendChat(e) {
    e && e.preventDefault && e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = { sender: 'user', text: chatInput };
    setChatMessages(msgs => [...msgs, userMsg]);
    const input = chatInput.trim().toLowerCase();
    setChatInput('');
    setSending(true);

    setTimeout(() => {
      let response;
      if (["hi", "hello", "hey"].some(greet => input === greet || input.startsWith(greet + " "))) {
        response = "Hi there! 👋 I'm Vrane, your reading assistant. If you need help or want a quiz, just ask!";
      } else if (input.includes("quiz me")) {
        setQuiz({ questions: demoQuiz, current: 0, correct: 0 });
        response = "Great! Let's start a quiz. I'll ask you questions about the passage. Type your answer and press Enter!";
        setTimeout(() => {
          setChatMessages(msgs => [...msgs, { sender: 'vrane', text: demoQuiz[0].q, quiz: true }]);
        }, 800);
      } else {
        response = "I'm here to help! You can ask about the passage, request a quiz, or just say hi.";
      }
      setChatMessages(msgs => [...msgs, { sender: 'vrane', text: response }]);
      setSending(false);
    }, 900);
  }

  // Quiz logic
  function handleQuizSubmit(e) {
    e.preventDefault();
    if (!quiz || !quiz.questions[quiz.current]) return;
    const userAns = quizAnswer.trim().toLowerCase();
    const correctAns = quiz.questions[quiz.current].a;
    const isCorrect = correctAns.some(ans => userAns.includes(ans.toLowerCase()));
    setChatMessages(msgs => [...msgs, { sender: 'user', text: quizAnswer }]);
    setQuizAnswer('');
    setTimeout(() => {
      let feedback = isCorrect
        ? "Correct! 🎉"
        : "Not quite. Take another look at the story and try to remember what happened!";
      setChatMessages(msgs => [...msgs, { sender: 'vrane', text: feedback }]);
      const next = quiz.current + 1;
      const newCorrect = quiz.correct + (isCorrect ? 1 : 0);
      if (next < quiz.questions.length) {
        setQuiz({ ...quiz, current: next, correct: newCorrect });
        setTimeout(() => {
          setChatMessages(msgs => [...msgs, { sender: 'vrane', text: quiz.questions[next].q, quiz: true }]);
        }, 700);
      } else {
        setQuiz(null);
        setTimeout(() => {
          setChatMessages(msgs => [...msgs, { sender: 'vrane', text: `Quiz complete! You got ${newCorrect} out of ${quiz.questions.length} correct. Great job!` }]);
        }, 700);
      }
    }, 700);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff8ed 0%, #ffe0b2 100%)', padding: '2.5rem', fontFamily: 'Nunito', position: 'relative' }}>
      {/* Back to Reading Assistant Button */}
      <button
        onClick={() => navigate('/reading')}
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          background: 'linear-gradient(90deg, #c95c00 0%, #e67e22 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '0.5rem 1.3rem',
          fontWeight: 700,
          fontSize: '1.05rem',
          cursor: 'pointer',
          fontFamily: 'Nunito',
          boxShadow: '0 2px 8px rgba(230,103,34,0.13)',
          zIndex: 2000
        }}
      >
        ← Back to Reading Assistant
      </button>
      <div style={{ display: 'flex', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ flex: 2, marginRight: 32 }}>
          <div style={{ maxWidth: 700, background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(230, 103, 34, 0.10)', padding: '2.5rem 2.2rem 2rem 2.2rem', position: 'relative' }}>
            <h2 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '2.1rem', letterSpacing: 1, color: '#c95c00', marginBottom: 24, textAlign: 'center' }}>
              Vrane
            </h2>
            {/* Mode Switch */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginBottom: 24 }}>
              {MODES.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  style={{
                    background: '#fff',
                    border: mode === m.key ? '2.5px solid #e67e22' : '2px solid #ffe0b2',
                    borderRadius: 10,
                    padding: 6,
                    boxShadow: mode === m.key ? '0 2px 8px rgba(230,103,34,0.13)' : 'none',
                    cursor: 'pointer',
                    outline: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 44,
                    transition: 'border 0.2s',
                  }}
                >
                  <img src={m.icon} alt={m.alt} style={{ width: m.key === 'question' ? 22 : 26, height: m.key === 'question' ? 22 : 26, display: 'block' }} />
                </button>
              ))}
            </div>
            <div
              style={{
                background: '#fff8ed',
                borderRadius: 12,
                padding: '1.5rem',
                fontSize: '1.18rem',
                color: '#c95c00',
                lineHeight: 1.7,
                cursor: 'text',
                userSelect: 'text',
                minHeight: 180,
                boxShadow: '0 2px 8px rgba(230,103,34,0.07)'
              }}
              onMouseUp={handleMouseUp}
            >
              {DEMO_PASSAGE}
            </div>
            {showPopup && (
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '60%',
                transform: 'translate(-50%, 0)',
                background: '#fff',
                border: '2px solid #e67e22',
                borderRadius: 12,
                boxShadow: '0 4px 24px rgba(230, 103, 34, 0.13)',
                padding: '1.2rem 1.5rem',
                zIndex: 100,
                minWidth: 320,
                maxWidth: 420,
                textAlign: 'left',
                marginTop: 18
              }}>
                {['breakdown', 'both'].includes(mode) && (
                  <>
                    <div style={{ fontWeight: 800, color: '#e67e22', fontFamily: 'Montserrat', fontSize: '1.08rem', marginBottom: 8 }}>Breakdown</div>
                    <div style={{ color: '#c95c00', fontWeight: 700, marginBottom: 12 }}>
                      {loading ? 'Loading breakdown...' : breakdown}
                    </div>
                    {/* Feedback for breakdown */}
                    {!loading && breakdown && !feedbackGiven && (
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ marginRight: 8 }}>Was this helpful?</span>
                        <button onClick={() => setFeedbackGiven(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#e67e22', marginRight: 4 }}>👍</button>
                        <button onClick={() => setFeedbackGiven(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#e67e22' }}>👎</button>
                      </div>
                    )}
                    {feedbackGiven && <div style={{ color: '#a85c00', fontWeight: 600, marginBottom: 8 }}>Thanks for your feedback!</div>}
                  </>
                )}
                {['question', 'both'].includes(mode) && (
                  <>
                    {console.log("Rendering question:", { loadingQuestion, question, mode })}
                    <div style={{ fontWeight: 800, color: '#e67e22', fontFamily: 'Montserrat', fontSize: '1.08rem', marginBottom: 8 }}>Vrane Question</div>
                    <div style={{ color: '#c95c00', fontWeight: 700, marginBottom: 12 }}>
                      {loadingQuestion ? 'Loading question...' : question}
                    </div>
                    {/* Feedback for question */}
                    {!loadingQuestion && question && !feedbackGiven && (
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ marginRight: 8 }}>Was this helpful?</span>
                        <button onClick={() => setFeedbackGiven(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#e67e22', marginRight: 4 }}>👍</button>
                        <button onClick={() => setFeedbackGiven(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#e67e22' }}>👎</button>
                      </div>
                    )}
                    {feedbackGiven && <div style={{ color: '#a85c00', fontWeight: 600, marginBottom: 8 }}>Thanks for your feedback!</div>}
                    <form onSubmit={e => { e.preventDefault(); setShowFeedback(true); }} style={{ marginBottom: 8 }}>
                      <input
                        type="text"
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        placeholder="Type your answer..."
                        style={{
                          width: '100%',
                          padding: '0.5em',
                          borderRadius: 6,
                          border: '1.5px solid #e67e22',
                          fontFamily: 'Nunito',
                          fontSize: '1.05rem',
                          marginBottom: 6,
                        }}
                      />
                      <button type="submit" style={{ background: '#e67e22', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5em 1.2em', fontWeight: 700, fontFamily: 'Nunito', cursor: 'pointer' }}>Submit</button>
                    </form>
                    {showFeedback && <div style={{ color: '#c95c00', fontWeight: 700 }}>Thanks for your answer!</div>}
                  </>
                )}
                {/* Fun Fact or Encouragement */}
                {showFunFact && (
                  <div style={{ background: '#fffbe9', borderRadius: 8, padding: '0.7em 1em', color: '#a85c00', fontWeight: 700, margin: '10px 0 0 0', textAlign: 'center', fontSize: '1.05rem' }}>
                    {funFact}
                  </div>
                )}
                <button onClick={handleClosePopup} style={{ background: '#fff', color: '#e67e22', border: '1.5px solid #e67e22', borderRadius: 6, padding: '0.4em 1em', fontWeight: 700, fontFamily: 'Nunito', cursor: 'pointer', marginTop: 8 }}>Close</button>
              </div>
            )}
          </div>
        </div>
        {/* Chat Sidebar */}
        <div style={{ flex: 1, minWidth: 320, maxWidth: 360, background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(230, 103, 34, 0.10)', padding: '1.5rem 1.2rem 1.2rem 1.2rem', display: 'flex', flexDirection: 'column', height: 520, marginTop: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '1.18rem', color: '#c95c00', textAlign: 'center' }}>Chat with Vrane</div>
            <button onClick={() => { setChatMessages([]); setChatInput(''); }} style={{ background: '#fff8ed', color: '#e67e22', border: '1.5px solid #e67e22', borderRadius: 8, padding: '0.3em 1em', fontWeight: 700, fontFamily: 'Nunito', cursor: 'pointer', fontSize: '0.98rem' }}>Reset Chat</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', background: '#fff8ed', borderRadius: 10, padding: '1rem', marginBottom: 12, border: '1px solid #ffe0b2' }}>
            {chatMessages.length === 0 && <div style={{ color: '#c95c00', fontFamily: 'Nunito', textAlign: 'center' }}>Ask a question about the passage!</div>}
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 10, textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                <span style={{
                  display: 'inline-block',
                  background: msg.sender === 'user' ? '#e67e22' : '#fff',
                  color: msg.sender === 'user' ? '#fff' : '#c95c00',
                  borderRadius: 8,
                  padding: '0.5em 1em',
                  fontFamily: 'Nunito',
                  fontWeight: 700,
                  maxWidth: '80%',
                  wordBreak: 'break-word',
                  boxShadow: msg.sender === 'user' ? '0 2px 8px rgba(230,103,34,0.13)' : 'none',
                  border: msg.sender === 'vrane' ? '1.5px solid #e67e22' : 'none',
                }}>{msg.text}</span>
              </div>
            ))}
            {sending && <div style={{ color: '#c95c00', fontFamily: 'Nunito', textAlign: 'left' }}>Vrane is typing...</div>}
          </div>
          <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask a question..."
              style={{ flex: 1, padding: '0.6em', borderRadius: 8, border: '1.5px solid #e67e22', fontFamily: 'Nunito', fontSize: '1.05rem' }}
              disabled={sending}
            />
            <button type="submit" style={{ background: '#e67e22', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6em 1.3em', fontWeight: 700, fontFamily: 'Nunito', cursor: 'pointer' }} disabled={sending || !chatInput.trim()}>
              Send
            </button>
          </form>
          {/* Quiz answer input if quiz is active */}
          {quiz && quiz.questions[quiz.current] && (
            <form onSubmit={handleQuizSubmit} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                type="text"
                value={quizAnswer}
                onChange={e => setQuizAnswer(e.target.value)}
                placeholder="Your answer..."
                style={{ flex: 1, padding: '0.6em', borderRadius: 8, border: '1.5px solid #e67e22', fontFamily: 'Nunito', fontSize: '1.05rem' }}
                disabled={sending}
                autoFocus
              />
              <button type="submit" style={{ background: '#e67e22', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6em 1.3em', fontWeight: 700, fontFamily: 'Nunito', cursor: 'pointer' }} disabled={sending || !quizAnswer.trim()}>
                Submit
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}