import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, updateDoc, doc, Timestamp, getDoc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList, LineChart, Line } from 'recharts';

const DATE_RANGES = [
  { label: 'All time', value: 'all' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 7 days', value: '7d' },
];

function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [assessments, setAssessments] = useState([]);
  const [progressFilter, setProgressFilter] = useState('week'); // 'week', 'month', 'schoolYear'
  const [studentProgressFilter, setStudentProgressFilter] = useState('week');
  const [selectedProgressStudent, setSelectedProgressStudent] = useState('all');
  const [note, setNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);
  const [selectedClass, setSelectedClass] = useState('1');

  useEffect(() => {
    const fetchStudents = async () => {
      const usersCol = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCol);
      const usersList = usersSnapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
        .filter(user => user.role === 'student' || !user.role);

      // One-time migration: set assessmentCompletedAt for legacy users
      const now = Timestamp.now();
      const updates = usersList
        .filter(s => s.assessmentCompleted && !s.assessmentCompletedAt)
        .map(s => updateDoc(doc(db, 'users', s.id), { assessmentCompletedAt: now }));

      if (updates.length > 0) {
        await Promise.all(updates);
        // Refetch after migration
        const refreshedSnapshot = await getDocs(usersCol);
        const refreshedList = refreshedSnapshot.docs
          .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
          .filter(user => user.role === 'student' || !user.role);
        setStudents(refreshedList);
      } else {
        setStudents(usersList);
      }
      setLoading(false);
    };
    fetchStudents();

    // Fetch all assessments for progress over time
    const fetchAssessments = async () => {
      const assessmentsCol = collection(db, 'assessments');
      const assessmentsSnapshot = await getDocs(assessmentsCol);
      const assessmentsList = assessmentsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setAssessments(assessmentsList);
    };
    fetchAssessments();
  }, []);

  const handleResetAssessment = async (studentId) => {
    setResetting(studentId);
    await updateDoc(doc(db, 'users', studentId), {
      assessmentCompleted: false,
      readingLevel: '',
    });
    setStudents(students => students.map(s => s.id === studentId ? { ...s, assessmentCompleted: false, readingLevel: '' } : s));
    setResetting(null);
  };

  const openModal = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
  };

  // --- Date Range Filtering ---
  const now = Timestamp.now();
  let filteredStudents = students;
  if (dateRange !== 'all') {
    let cutoff;
    if (dateRange === '30d') {
      cutoff = Timestamp.fromMillis(now.toMillis() - 30 * 24 * 60 * 60 * 1000);
    } else if (dateRange === '7d') {
      cutoff = Timestamp.fromMillis(now.toMillis() - 7 * 24 * 60 * 60 * 1000);
    }
    filteredStudents = students.filter(s => {
      if (!s.assessmentCompletedAt) return false;
      // Firestore Timestamp or string
      const ts = s.assessmentCompletedAt.seconds ? s.assessmentCompletedAt : Timestamp.fromDate(new Date(s.assessmentCompletedAt));
      return ts.toMillis() >= cutoff.toMillis();
    });
  }

  // --- Analytics ---
  // Reading level extraction utility
  const getLevel = (readingLevel) => {
    const match = (readingLevel || '').match(/\d{1,2}(st|nd|rd|th) grade/i);
    return match ? match[0][0].toUpperCase() + match[0].slice(1) : null;
  };

  // Reading level distribution
  const levelCounts = {};
  filteredStudents.forEach(s => {
    const level = getLevel(s.readingLevel);
    if (level) {
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    }
  });
  const levelData = Object.entries(levelCounts).map(([level, count]) => ({ level, count }));

  // Assessment completion rate
  const completed = filteredStudents.filter(s => s.assessmentCompleted).length;
  const total = filteredStudents.length;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  // Average reading level (numeric)
  const levelNums = filteredStudents
    .map(s => {
      const match = (s.readingLevel || '').match(/(\d{1,2})/);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter(n => n !== null);
  const avgLevel = levelNums.length ? (levelNums.reduce((a, b) => a + b, 0) / levelNums.length).toFixed(1) : 'N/A';

  // --- Leaderboard: Top Readers by Reading Level ---
  const leaderboard = [...filteredStudents]
    .map(s => ({
      name: s.email ? s.email.split('@')[0] : 'Student',
      level: getLevel(s.readingLevel),
      levelNum: (() => {
        const match = (s.readingLevel || '').match(/(\d{1,2})/);
        return match ? parseInt(match[1], 10) : 0;
      })(),
      completed: s.assessmentCompleted
    }))
    .filter(s => s.levelNum > 0)
    .sort((a, b) => b.levelNum - a.levelNum)
    .slice(0, 5);

  // --- Recognition Badges ---
  const badgeDefs = [
    { label: 'Assessment Complete', check: s => s.assessmentCompleted, color: '#e67e22' },
    { label: '8th Grade+', check: s => {
      const match = (s.readingLevel || '').match(/(\d{1,2})/);
      return match && parseInt(match[1], 10) >= 8;
    }, color: '#c95c00' },
    // Add more badges as needed
  ];

  // Export CSV logic
  const handleExportCSV = () => {
    const headers = ['Email', 'Comprehension Level', 'Assessment Status', 'Assessment Completed At'];
    const rows = filteredStudents.map(s => [
      s.email || '',
      s.readingLevel || '',
      s.assessmentCompleted ? 'Completed' : 'Not Completed',
      s.assessmentCompletedAt && s.assessmentCompletedAt.seconds
        ? new Date(s.assessmentCompletedAt.seconds * 1000).toLocaleString()
        : ''
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vrane-students-${dateRange}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Progress Over Time Chart Data ---
  function getWeekKey(ts) {
    const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
    const year = date.getFullYear();
    const week = Math.ceil(((date - new Date(year, 0, 1)) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
    return `${year}-W${week}`;
  }
  function getMonthKey(ts) {
    const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }
  function getSchoolYearKey(ts) {
    const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
    let year = date.getFullYear();
    // School year starts in August (8)
    const schoolYearStartMonth = 8;
    if (date.getMonth() + 1 < schoolYearStartMonth) {
      // Before August, part of previous school year
      return `${year - 1}-${year}`;
    } else {
      // August or later, part of current school year
      return `${year}-${year + 1}`;
    }
  }
  let progressDataMap = {};
  let keyFunc = getWeekKey;
  if (progressFilter === 'month') keyFunc = getMonthKey;
  if (progressFilter === 'schoolYear') keyFunc = getSchoolYearKey;
  assessments.forEach(a => {
    const match = (a.readingLevel || '').match(/(\d{1,2})/);
    if (!match || !a.created) return;
    const level = parseInt(match[1], 10);
    const key = keyFunc(a.created.seconds ? a.created.toDate() : a.created);
    if (!progressDataMap[key]) progressDataMap[key] = { key, total: 0, count: 0 };
    progressDataMap[key].total += level;
    progressDataMap[key].count += 1;
  });
  const progressData = Object.values(progressDataMap)
    .map(d => ({ key: d.key, avgLevel: (d.total / d.count).toFixed(2) }))
    .sort((a, b) => a.key.localeCompare(b.key));

  // --- Per-Student Progress Data ---
  const studentOptions = [{ value: 'all', label: 'All Students' }, ...students.map(s => ({ value: s.id, label: s.email ? s.email.split('@')[0] : 'Student' }))];
  let studentProgressData = [];
  if (selectedProgressStudent === 'all') {
    // Use class progress data, but with studentProgressFilter
    let map = {};
    let keyFunc = getWeekKey;
    if (studentProgressFilter === 'month') keyFunc = getMonthKey;
    if (studentProgressFilter === 'schoolYear') keyFunc = getSchoolYearKey;
    assessments.forEach(a => {
      const match = (a.readingLevel || '').match(/(\d{1,2})/);
      if (!match || !a.created) return;
      const level = parseInt(match[1], 10);
      const key = keyFunc(a.created.seconds ? a.created.toDate() : a.created);
      if (!map[key]) map[key] = { key, total: 0, count: 0 };
      map[key].total += level;
      map[key].count += 1;
    });
    studentProgressData = Object.values(map)
      .map(d => ({ key: d.key, avgLevel: (d.total / d.count).toFixed(2) }))
      .sort((a, b) => a.key.localeCompare(b.key));
  } else {
    // Filter assessments for the selected student
    let map = {};
    let keyFunc = getWeekKey;
    if (studentProgressFilter === 'month') keyFunc = getMonthKey;
    if (studentProgressFilter === 'schoolYear') keyFunc = getSchoolYearKey;
    assessments.filter(a => a.userId === selectedProgressStudent).forEach(a => {
      const match = (a.readingLevel || '').match(/(\d{1,2})/);
      if (!match || !a.created) return;
      const level = parseInt(match[1], 10);
      const key = keyFunc(a.created.seconds ? a.created.toDate() : a.created);
      if (!map[key]) map[key] = { key, total: 0, count: 0 };
      map[key].total += level;
      map[key].count += 1;
    });
    studentProgressData = Object.values(map)
      .map(d => ({ key: d.key, avgLevel: (d.total / d.count).toFixed(2) }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  function getStudentGrowth(student, assessments) {
    const studentAssessments = assessments
      .filter(a => a.userId === student.id)
      .sort((a, b) => {
        const tA = a.created?.seconds ? a.created.seconds : (a.created ? new Date(a.created).getTime() / 1000 : 0);
        const tB = b.created?.seconds ? b.created.seconds : (b.created ? new Date(b.created).getTime() / 1000 : 0);
        return tA - tB;
      });
    if (studentAssessments.length < 2) return null;
    const getLevelNum = a => {
      const match = (a.readingLevel || '').match(/(\d{1,2})/);
      return match ? parseInt(match[1], 10) : null;
    };
    const first = getLevelNum(studentAssessments[0]);
    const last = getLevelNum(studentAssessments[studentAssessments.length - 1]);
    if (first === null || last === null) return null;
    return last - first;
  }

  function getStudentStreak(student, assessments) {
    // Get all assessment dates for this student, sorted ascending
    const studentAssessments = assessments
      .filter(a => a.userId === student.id && a.created)
      .map(a => a.created.seconds ? new Date(a.created.seconds * 1000) : new Date(a.created))
      .sort((a, b) => a - b);
    if (studentAssessments.length === 0) return 0;
    // Map to week numbers (year-week)
    const weeks = studentAssessments.map(date => {
      const year = date.getFullYear();
      const week = Math.ceil(((date - new Date(year, 0, 1)) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
      return `${year}-W${week}`;
    });
    // Remove duplicates
    const uniqueWeeks = Array.from(new Set(weeks));
    // Calculate current streak (ending with the most recent week)
    let streak = 1;
    for (let i = uniqueWeeks.length - 1; i > 0; i--) {
      const [year1, w1] = uniqueWeeks[i].split('-W').map(Number);
      const [year0, w0] = uniqueWeeks[i - 1].split('-W').map(Number);
      if ((year1 === year0 && w1 - w0 === 1) || (year1 - year0 === 1 && w1 === 1 && w0 === 52)) {
        streak++;
      } else {
        break;
      }
    }
    // Only count streak if last assessment was this week
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisWeek = Math.ceil(((now - new Date(thisYear, 0, 1)) / 86400000 + new Date(thisYear, 0, 1).getDay() + 1) / 7);
    if (uniqueWeeks.length === 0 || uniqueWeeks[uniqueWeeks.length - 1] !== `${thisYear}-W${thisWeek}`) return 0;
    return streak;
  }

  // Load note when modal opens
  useEffect(() => {
    async function fetchNote() {
      if (showModal && selectedStudent) {
        setNoteLoading(true);
        setNoteSuccess(false);
        try {
          const userDoc = await getDoc(doc(db, 'users', selectedStudent.id));
          setNote(userDoc.data()?.notes || '');
        } catch {
          setNote('');
        }
        setNoteLoading(false);
      }
    }
    fetchNote();
    // eslint-disable-next-line
  }, [showModal, selectedStudent]);

  async function handleSaveNote() {
    setNoteLoading(true);
    setNoteSuccess(false);
    try {
      await updateDoc(doc(db, 'users', selectedStudent.id), { notes: note });
      setNoteSuccess(true);
      setTimeout(() => setNoteSuccess(false), 1500);
    } catch {}
    setNoteLoading(false);
  }

  // For demo: assign class 1-4 if not present
  const studentsWithClass = students.map((s, i) => ({ ...s, class: s.class || ((i % 4) + 1).toString() }));
  // Filter assessments for selected class
  const classStudentIds = studentsWithClass.filter(s => s.class === selectedClass).map(s => s.id);
  let classProgressDataMap = {};
  let classKeyFunc = getWeekKey;
  if (progressFilter === 'month') classKeyFunc = getMonthKey;
  if (progressFilter === 'schoolYear') classKeyFunc = getSchoolYearKey;
  assessments.filter(a => classStudentIds.includes(a.userId)).forEach(a => {
    const match = (a.readingLevel || '').match(/(\d{1,2})/);
    if (!match || !a.created) return;
    const level = parseInt(match[1], 10);
    const key = classKeyFunc(a.created.seconds ? a.created.toDate() : a.created);
    if (!classProgressDataMap[key]) classProgressDataMap[key] = { key, total: 0, count: 0 };
    classProgressDataMap[key].total += level;
    classProgressDataMap[key].count += 1;
  });
  const classProgressData = Object.values(classProgressDataMap)
    .map(d => ({ key: d.key, avgLevel: (d.total / d.count).toFixed(2) }))
    .sort((a, b) => a.key.localeCompare(b.key));

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fff8ed 0%, #ffe0b2 100%)' }}>
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff8ed 0%, #ffe0b2 100%)', padding: '2rem', position: 'relative' }}>
      <button
        onClick={async () => { await import('./firebase').then(({ auth }) => auth.signOut()); window.location.reload(); }}
        style={{
          position: 'fixed',
          top: 32,
          right: 32,
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
          zIndex: 2000
        }}
      >
        Sign Out
      </button>
      {/* Teacher Dashboard (student table) at the top */}
      <div style={{ maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(230, 103, 34, 0.10)', padding: '2.5rem 2.2rem 2rem 2.2rem', marginBottom: 36 }}>
        <h2 style={{ fontFamily: "'Montserrat'", fontWeight: 900, fontSize: '2.1rem', letterSpacing: 1, color: '#c95c00', marginBottom: 32, textAlign: 'center' }}>
          Teacher Dashboard
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Nunito', fontSize: '1.08rem' }}>
          <thead>
            <tr style={{ background: '#fff3e0' }}>
              <th style={{ padding: '0.8rem', borderBottom: '2px solid #ffe0b2', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '0.8rem', borderBottom: '2px solid #ffe0b2', textAlign: 'left' }}>Comprehension Level</th>
              <th style={{ padding: '0.8rem', borderBottom: '2px solid #ffe0b2', textAlign: 'left' }}>Assessment Status</th>
              <th style={{ padding: '0.8rem', borderBottom: '2px solid #ffe0b2', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id} style={{ borderBottom: '1px solid #ffe0b2' }}>
                <td style={{ padding: '0.7rem 0.8rem' }}>{student.nickname ? student.nickname : student.email}</td>
                <td style={{ padding: '0.7rem 0.8rem' }}>{(() => {
                  const match = (student.readingLevel || '').match(/\d{1,2}(st|nd|rd|th) grade/i);
                  return match ? match[0][0].toUpperCase() + match[0].slice(1) : 'Not set';
                })()}</td>
                <td style={{ padding: '0.7rem 0.8rem' }}>{student.assessmentCompleted ? 'Completed' : 'Not Completed'}</td>
                <td style={{ padding: '0.7rem 0.8rem' }}>
                  <button
                    style={{
                      background: '#fff3e0',
                      color: '#e67e22',
                      border: '1.5px solid #e67e22',
                      borderRadius: 8,
                      padding: '0.5rem 1.2rem',
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      fontFamily: 'Nunito',
                    }}
                    onClick={() => openModal(student)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Analytics Section below */}
      {/* Date Range Picker and Export Button */}
      <div style={{ maxWidth: 900, margin: '0 auto', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16 }}>
        <label style={{ fontFamily: 'Nunito', fontWeight: 700, color: '#c95c00', marginRight: 8 }}>Date Range:</label>
        <select
          value={dateRange}
          onChange={e => setDateRange(e.target.value)}
          style={{
            fontFamily: 'Nunito',
            fontWeight: 700,
            borderRadius: 8,
            border: '1.5px solid #e67e22',
            padding: '0.4rem 1rem',
            fontSize: '1rem',
            color: '#c95c00',
            background: '#fff8ed',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {DATE_RANGES.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={handleExportCSV}
          style={{
            fontFamily: 'Nunito',
            fontWeight: 700,
            borderRadius: 8,
            border: '1.5px solid #e67e22',
            padding: '0.4rem 1.2rem',
            fontSize: '1rem',
            color: '#fff',
            background: 'linear-gradient(90deg, #e67e22 0%, #c95c00 100%)',
            cursor: 'pointer',
            marginLeft: 8
          }}
        >
          Export CSV
        </button>
      </div>
      <div style={{ marginBottom: 36, background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(230,103,34,0.08)', padding: '2rem 2rem 1.5rem 2rem', maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
        <h3 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '1.3rem', color: '#c95c00', marginBottom: 18, textAlign: 'center' }}>
          Class Analytics
        </h3>
        {/* Per-Student Progress Chart */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h4 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '1.1rem', color: '#e67e22', margin: 0 }}>Student Progress Over Time</h4>
            <select
              value={selectedProgressStudent}
              onChange={e => setSelectedProgressStudent(e.target.value)}
              style={{
                fontFamily: 'Nunito',
                fontWeight: 700,
                borderRadius: 8,
                border: '1.5px solid #e67e22',
                padding: '0.3rem 1rem',
                fontSize: '1rem',
                color: '#c95c00',
                background: '#fff8ed',
                outline: 'none',
                cursor: 'pointer',
                marginLeft: 8
              }}
            >
              {studentOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={studentProgressFilter}
              onChange={e => setStudentProgressFilter(e.target.value)}
              style={{
                fontFamily: 'Nunito',
                fontWeight: 700,
                borderRadius: 8,
                border: '1.5px solid #e67e22',
                padding: '0.3rem 1rem',
                fontSize: '1rem',
                color: '#c95c00',
                background: '#fff8ed',
                outline: 'none',
                cursor: 'pointer',
                marginLeft: 8
              }}
            >
              <option value="week">By Week</option>
              <option value="month">By Month</option>
              <option value="schoolYear">By School Year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={studentProgressData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="key" stroke="#c95c00" style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: '0.95rem' }} />
              <YAxis allowDecimals={true} stroke="#c95c00" style={{ fontFamily: 'Nunito', fontWeight: 700 }} />
              <Tooltip />
              <Line type="monotone" dataKey="avgLevel" stroke="#e67e22" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Progress Over Time Chart (Class) */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h4 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '1.1rem', color: '#e67e22', margin: 0 }}>Class Progress Over Time</h4>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              style={{
                fontFamily: 'Nunito',
                fontWeight: 700,
                borderRadius: 8,
                border: '1.5px solid #e67e22',
                padding: '0.3rem 1rem',
                fontSize: '1rem',
                color: '#c95c00',
                background: '#fff8ed',
                outline: 'none',
                cursor: 'pointer',
                marginLeft: 8
              }}
            >
              <option value="1">Class 1</option>
              <option value="2">Class 2</option>
              <option value="3">Class 3</option>
              <option value="4">Class 4</option>
            </select>
            <select
              value={progressFilter}
              onChange={e => setProgressFilter(e.target.value)}
              style={{
                fontFamily: 'Nunito',
                fontWeight: 700,
                borderRadius: 8,
                border: '1.5px solid #e67e22',
                padding: '0.3rem 1rem',
                fontSize: '1rem',
                color: '#c95c00',
                background: '#fff8ed',
                outline: 'none',
                cursor: 'pointer',
                marginLeft: 8
              }}
            >
              <option value="week">By Week</option>
              <option value="month">By Month</option>
              <option value="schoolYear">By School Year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={classProgressData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="key" stroke="#c95c00" style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: '0.95rem' }} />
              <YAxis allowDecimals={true} stroke="#c95c00" style={{ fontFamily: 'Nunito', fontWeight: 700 }} />
              <Tooltip />
              <Line type="monotone" dataKey="avgLevel" stroke="#e67e22" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ minWidth: 260, flex: 1 }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={levelData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="level" stroke="#c95c00" style={{ fontFamily: 'Nunito', fontWeight: 700 }} />
                <YAxis allowDecimals={false} stroke="#c95c00" style={{ fontFamily: 'Nunito', fontWeight: 700 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#e67e22" radius={[8, 8, 0, 0]}>
                  <LabelList dataKey="count" position="top" style={{ fontFamily: 'Nunito', fontWeight: 700, fill: '#c95c00' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', fontFamily: 'Nunito', color: '#c95c00', fontWeight: 700, marginTop: 8 }}>
              Comprehension Level Distribution
            </div>
          </div>
          <div style={{ minWidth: 180, flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: '1.1rem', color: '#e67e22', marginBottom: 10 }}>
              Assessment Completion Rate
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#c95c00', marginBottom: 18 }}>{completionRate}%</div>
            <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: '1.1rem', color: '#e67e22', marginBottom: 10 }}>
              Average Comprehension Level
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#c95c00' }}>{avgLevel !== 'N/A' ? `${avgLevel} Grade` : 'N/A'}</div>
          </div>
        </div>
        {/* Leaderboard */}
        <div style={{ marginTop: 32 }}>
          <h4 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '1.1rem', color: '#e67e22', marginBottom: 12 }}>Top Readers</h4>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {leaderboard.length === 0 && <div style={{ color: '#c95c00', fontFamily: 'Nunito' }}>No data yet.</div>}
            {leaderboard.map((s, i) => (
              <div key={s.name} style={{ background: '#fff8ed', borderRadius: 10, boxShadow: '0 1px 4px rgba(230,103,34,0.07)', padding: '1rem 1.3rem', minWidth: 120, textAlign: 'center', fontFamily: 'Nunito', fontWeight: 700, color: '#c95c00', position: 'relative' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#e67e22', marginBottom: 4 }}>#{i + 1}</div>
                <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>{s.name}</div>
                <div style={{ fontSize: '1.05rem', color: '#e67e22' }}>{s.level}</div>
                {s.completed && <div style={{ fontSize: '0.9rem', color: '#27ae60', marginTop: 2 }}>✓ Assessment</div>}
              </div>
            ))}
          </div>
        </div>
        {/* Recognition Badges */}
        <div style={{ marginTop: 32 }}>
          <h4 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '1.1rem', color: '#e67e22', marginBottom: 12 }}>Recognition Badges</h4>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {filteredStudents.length === 0 && <div style={{ color: '#c95c00', fontFamily: 'Nunito' }}>No students yet.</div>}
            {filteredStudents.map(s => (
              <div key={s.email} style={{ background: '#fff8ed', borderRadius: 10, boxShadow: '0 1px 4px rgba(230,103,34,0.07)', padding: '1rem 1.3rem', minWidth: 120, textAlign: 'center', fontFamily: 'Nunito', fontWeight: 700, color: '#c95c00', position: 'relative' }}>
                <div style={{ fontSize: '1.1rem', marginBottom: 6 }}>{s.email ? s.email.split('@')[0] : 'Student'}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                  {badgeDefs.map(badge => badge.check(s) && (
                    <span key={badge.label} style={{ background: badge.color, color: '#fff', borderRadius: 6, padding: '0.2em 0.7em', fontSize: '0.95rem', fontWeight: 700, margin: 2 }}>{badge.label}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showModal && selectedStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(230, 103, 34, 0.13)',
            padding: '2.2rem 2.2rem 1.5rem 2.2rem',
            minWidth: 340,
            maxWidth: 400,
            width: '100%',
            textAlign: 'left',
            position: 'relative',
            fontFamily: 'Nunito'
          }}>
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                fontSize: 22,
                color: '#e67e22',
                cursor: 'pointer',
                fontWeight: 700
              }}
              aria-label="Close"
            >
              ×
            </button>
            <h3 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '1.3rem', color: '#c95c00', marginBottom: 18 }}>
              Student Details
            </h3>
            <div style={{ marginBottom: 12 }}><strong>Nickname:</strong> {selectedStudent.nickname || <span style={{ color: '#bbb' }}>Not set</span>}</div>
            <div style={{ marginBottom: 12 }}><strong>Email:</strong> {selectedStudent.email}</div>
            <div style={{ marginBottom: 12 }}><strong>Comprehension Level:</strong> {(() => {
              const match = (selectedStudent.readingLevel || '').match(/\d{1,2}(st|nd|rd|th) grade/i);
              return match ? match[0][0].toUpperCase() + match[0].slice(1) : 'Not set';
            })()}</div>
            <div style={{ marginBottom: 12 }}><strong>Assessment Status:</strong> {selectedStudent.assessmentCompleted ? 'Completed' : 'Not Completed'}</div>
            {/* Assessment Growth Indicator */}
            <div style={{ marginBottom: 16 }}>
              <strong>Growth:</strong>{' '}
              {(() => {
                const growth = getStudentGrowth(selectedStudent, assessments);
                if (growth === null) return <span style={{ color: '#888', fontWeight: 700 }}>No growth data yet.</span>;
                if (growth > 0) return <span style={{ color: '#27ae60', fontWeight: 800, fontSize: '1.08em' }}>+{growth} <span style={{ fontSize: '1.1em' }}>↑</span> grades since first assessment</span>;
                if (growth < 0) return <span style={{ color: '#e74c3c', fontWeight: 800, fontSize: '1.08em' }}>{growth} <span style={{ fontSize: '1.1em' }}>↓</span> grades since first assessment</span>;
                return <span style={{ color: '#c95c00', fontWeight: 800, fontSize: '1.08em' }}>No change</span>;
              })()}
            </div>
            {/* Reading Streak Indicator */}
            <div style={{ marginBottom: 16 }}>
              <strong>Streak:</strong>{' '}
              {(() => {
                const streak = getStudentStreak(selectedStudent, assessments);
                if (streak > 1) return <span style={{ color: '#e67e22', fontWeight: 800, fontSize: '1.08em' }}>{streak}-Week Reading Streak! <span style={{ fontSize: '1.1em' }}>🔥</span></span>;
                if (streak === 1) return <span style={{ color: '#c95c00', fontWeight: 800, fontSize: '1.08em' }}>1 week active <span style={{ fontSize: '1.1em' }}>📖</span></span>;
                return <span style={{ color: '#888', fontWeight: 700 }}>No current streak.</span>;
              })()}
            </div>
            {/* Recognition Badges */}
            <div style={{ marginBottom: 18 }}>
              <strong>Badges:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                {badgeDefs.map(badge => badge.check(selectedStudent) && (
                  <span key={badge.label} style={{ display: 'flex', alignItems: 'center', background: badge.color, color: '#fff', borderRadius: 6, padding: '0.2em 0.7em', fontSize: '0.97rem', fontWeight: 700, margin: 2 }}>
                    {/* Simple icon: check for complete, star for 8th+ */}
                    <span style={{ marginRight: 6, fontSize: '1.1em' }}>{badge.label === 'Assessment Complete' ? '✓' : badge.label === '8th Grade+' ? '★' : '🏅'}</span>
                    {badge.label}
                  </span>
                ))}
                {/* If no badges, show a message */}
                {badgeDefs.every(badge => !badge.check(selectedStudent)) && (
                  <span style={{ color: '#c95c00', fontWeight: 600, fontSize: '0.97rem' }}>No badges yet.</span>
                )}
              </div>
            </div>
            {/* Notes Section */}
            <div style={{ marginBottom: 18 }}>
              <strong>Notes:</strong>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  borderRadius: 8,
                  border: '1.5px solid #e67e22',
                  padding: '0.7em',
                  fontFamily: 'Nunito',
                  fontSize: '1.05rem',
                  marginTop: 6,
                  resize: 'vertical',
                  minHeight: 60,
                  background: noteLoading ? '#fff8ed' : '#fff',
                  color: '#c95c00',
                  outline: 'none',
                  opacity: noteLoading ? 0.7 : 1
                }}
                disabled={noteLoading}
              />
              <button
                onClick={handleSaveNote}
                disabled={noteLoading}
                style={{
                  marginTop: 8,
                  background: 'linear-gradient(90deg, #e67e22 0%, #c95c00 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.5rem 1.2rem',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: noteLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Nunito',
                  opacity: noteLoading ? 0.7 : 1
                }}
              >
                {noteLoading ? 'Saving...' : noteSuccess ? 'Saved!' : 'Save'}
              </button>
            </div>
            {/* Restore prominent Reset Assessment Button */}
            <button
              onClick={() => handleResetAssessment(selectedStudent.id)}
              style={{
                background: 'linear-gradient(90deg, #c95c00 0%, #e67e22 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '0.7rem 1.5rem',
                fontWeight: 800,
                fontSize: '1.08rem',
                cursor: 'pointer',
                fontFamily: 'Nunito',
                marginTop: 10,
                width: '100%',
                boxShadow: '0 2px 8px rgba(230,103,34,0.10)',
                opacity: resetting === selectedStudent.id ? 0.6 : 1
              }}
              disabled={resetting === selectedStudent.id}
            >
              {resetting === selectedStudent.id ? 'Resetting...' : 'Reset Assessment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;
