import React, { useState } from 'react';

function AssessmentComplete({ answers, questions, passages, onRetake }) {
  const [readingLevel, setReadingLevel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    async function fetchLevel() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/assessment-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers, questions, passages }),
        });
        const data = await res.json();
        setReadingLevel(data.level);
      } catch (err) {
        setError('Error getting comprehension level.');
      }
      setLoading(false);
    }
    fetchLevel();
  }, [answers, questions, passages]);

  const handleRetake = () => {
    localStorage.clear(); // Clear all localStorage (or just relevant keys)
    if (onRetake) onRetake();
    window.location.reload(); // Reload to reset the app state
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h2>Assessment Complete!</h2>
      {loading ? (
        <p>Analyzing your results...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : readingLevel ? (
        <>
          <h3>Your Comprehension Level:</h3>
          <p style={{ fontSize: '2rem', color: '#e67e22', fontWeight: 700 }}>{readingLevel}</p>
        </>
      ) : (
        <p>Your comprehension level will be shown here after Vrane analysis.</p>
      )}
      <button onClick={handleRetake} style={{ marginTop: '2rem', padding: '0.7rem 1.5rem', fontSize: '1rem', borderRadius: 8, background: '#e67e22', color: '#fff', border: 'none', cursor: 'pointer' }}>
        Retake Assessment
      </button>
    </div>
  );
}

export default AssessmentComplete;