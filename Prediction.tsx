import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStudent } from '../context/StudentContext';
import {
  Brain, TrendingUp, TrendingDown, Target, AlertTriangle,
  CheckCircle, RefreshCw, ChevronDown, ChevronUp, Zap,
  BookOpen, Clock, Award, BarChart3
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell
} from 'recharts';

const SCORE_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  'A+': { color: '#10B981', bg: '#D1FAE5', label: 'Outstanding' },
  'A': { color: '#06B6D4', bg: '#CFFAFE', label: 'Excellent' },
  'B+': { color: '#6366F1', bg: '#EDE9FE', label: 'Very Good' },
  'B': { color: '#8B5CF6', bg: '#EDE9FE', label: 'Good' },
  'C': { color: '#F59E0B', bg: '#FEF3C7', label: 'Average' },
  'D': { color: '#F97316', bg: '#FFEDD5', label: 'Below Average' },
  'F': { color: '#EF4444', bg: '#FEE2E2', label: 'Failing' },
};

function AnimatedGauge({ score, pass }: { score: number; pass: boolean }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start = 0;
    const timer = setInterval(() => {
      start += 2;
      if (start >= score) { setDisplayed(score); clearInterval(timer); }
      else setDisplayed(start);
    }, 20);
    return () => clearInterval(timer);
  }, [score]);

  const angle = (displayed / 100) * 180;
  const r = 80;
  const cx = 110, cy = 100;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (from: number, to: number, radius: number) => {
    const s = { x: cx + radius * Math.cos(toRad(180 + from)), y: cy + radius * Math.sin(toRad(180 + from)) };
    const e = { x: cx + radius * Math.cos(toRad(180 + to)), y: cy + radius * Math.sin(toRad(180 + to)) };
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${to - from > 180 ? 1 : 0} 0 ${e.x} ${e.y}`;
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={220} height={130} viewBox="0 0 220 130">
        {/* Background arc */}
        <path d={arcPath(0, 180, r)} fill="none" stroke="#E8EAFF" strokeWidth={20} strokeLinecap="round" />
        {/* Colored segments */}
        <path d={arcPath(0, 36, r)} fill="none" stroke="#EF4444" strokeWidth={20} strokeLinecap="butt" opacity={0.3} />
        <path d={arcPath(36, 72, r)} fill="none" stroke="#F97316" strokeWidth={20} strokeLinecap="butt" opacity={0.3} />
        <path d={arcPath(72, 108, r)} fill="none" stroke="#F59E0B" strokeWidth={20} strokeLinecap="butt" opacity={0.3} />
        <path d={arcPath(108, 144, r)} fill="none" stroke="#6366F1" strokeWidth={20} strokeLinecap="butt" opacity={0.3} />
        <path d={arcPath(144, 180, r)} fill="none" stroke="#10B981" strokeWidth={20} strokeLinecap="butt" opacity={0.3} />
        {/* Progress arc */}
        {displayed > 0 && (
          <path d={arcPath(0, angle, r)} fill="none"
            stroke={pass ? '#10B981' : displayed > 35 ? '#F59E0B' : '#EF4444'}
            strokeWidth={20} strokeLinecap="round" />
        )}
        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={cx + (r - 10) * Math.cos(toRad(180 + angle))}
          y2={cy + (r - 10) * Math.sin(toRad(180 + angle))}
          stroke="#1E1B4B" strokeWidth={3} strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={6} fill="#1E1B4B" />
        {/* Labels */}
        <text x={30} y={120} textAnchor="middle" fill="#EF4444" fontSize={11} fontWeight={600}>0</text>
        <text x={cx} y={25} textAnchor="middle" fill="#F59E0B" fontSize={11} fontWeight={600}>50</text>
        <text x={190} y={120} textAnchor="middle" fill="#10B981" fontSize={11} fontWeight={600}>100</text>
      </svg>
      <div className="text-center -mt-2">
        <div style={{ fontSize: '3rem', fontWeight: 900, color: pass ? '#10B981' : '#EF4444', lineHeight: 1 }}>
          {displayed}
        </div>
        <div style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: 4 }}>/ 100 points</div>
      </div>
    </div>
  );
}

export default function Prediction() {
  const { student, getPrediction, getSubjects, updateStudent } = useStudent();
  const [showDetails, setShowDetails] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState({
    attendance: student?.attendance || 80,
    studyHoursPerDay: student?.studyHoursPerDay || 3,
  });

  const subjects = getSubjects();
  const prediction = getPrediction();

  const gradeInfo = SCORE_COLORS[prediction.grade] || SCORE_COLORS['F'];

  const handleReanalyze = async () => {
    setIsAnalyzing(true);
    if (editMode) {
      updateStudent(editValues);
      setEditMode(false);
    }
    await new Promise(r => setTimeout(r, 2000));
    setIsAnalyzing(false);
  };

  const subjectPredictions = subjects.map(sub => {
    const subMarks = student?.marks.filter(m => m.subjectId === sub.id) || [];
    const avg = subMarks.length > 0
      ? Math.round(subMarks.reduce((sum, m) => sum + (m.marks / m.total) * 100, 0) / subMarks.length)
      : 0;
    const pass = avg >= 35;
    return { ...sub, avg, pass };
  });

  const radarData = [
    { subject: 'Attendance', value: student?.attendance || 0, fullMark: 100 },
    { subject: 'Assessment', value: Math.round((prediction.breakdown.assessment / 25) * 100), fullMark: 100 },
    { subject: 'Midterm', value: Math.round((prediction.breakdown.midterm / 30) * 100), fullMark: 100 },
    { subject: 'Study Time', value: Math.min(Math.round(((student?.studyHoursPerDay || 0) / 6) * 100), 100), fullMark: 100 },
    { subject: 'Consistency', value: Math.min((student?.reminders.length || 0) * 20, 100), fullMark: 100 },
  ];

  const breakdownData = [
    { name: 'Attendance', score: prediction.breakdown.attendance, max: 20, color: '#10B981' },
    { name: 'Assessment', score: prediction.breakdown.assessment, max: 25, color: '#6366F1' },
    { name: 'Midterm', score: prediction.breakdown.midterm, max: 30, color: '#EC4899' },
    { name: 'Study Time', score: prediction.breakdown.studyTime, max: 15, color: '#F59E0B' },
    { name: 'Bonus', score: prediction.breakdown.bonus, max: 10, color: '#06B6D4' },
  ];

  if (!student) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 style={{ color: '#1E1B4B', fontWeight: 800, fontSize: '1.5rem' }}>🎯 Performance Prediction</h1>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>ML-powered exam outcome analysis</p>
        </div>
        <button onClick={handleReanalyze} disabled={isAnalyzing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white transition-all"
          style={{ background: isAnalyzing ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)', fontWeight: 600 }}>
          <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analyzing...' : 'Re-Analyze'}
        </button>
      </motion.div>

      {/* Main Prediction Card */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl p-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5"
          style={{ background: 'radial-gradient(circle at 70% 20%, #818CF8, transparent)' }} />

        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-12">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 relative"
                style={{ background: 'rgba(99,102,241,0.2)', border: '2px solid #6366F1' }}>
                <Brain className="w-10 h-10 text-indigo-400" />
                <div className="absolute inset-0 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
              </div>
              <h3 className="text-white mb-2" style={{ fontWeight: 700, fontSize: '1.2rem' }}>AI is analyzing your data...</h3>
              <p style={{ color: '#94A3B8' }}>Processing attendance, marks, and study patterns</p>
              <div className="mt-6 space-y-2 w-full max-w-xs">
                {['Analyzing attendance data...', 'Processing examination marks...', 'Evaluating study patterns...', 'Generating predictions...'].map((step, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.4 }}
                    className="flex items-center gap-2 text-sm" style={{ color: '#94A3B8' }}>
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: 'rgba(99,102,241,0.3)', border: '2px solid #6366F1' }} />
                    {step}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <AnimatedGauge score={prediction.score} pass={prediction.pass} />
              </div>
              <div>
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="px-4 py-2 rounded-xl flex items-center gap-2"
                      style={{ background: gradeInfo.bg + '30', border: `2px solid ${gradeInfo.color}50` }}>
                      <Award className="w-5 h-5" style={{ color: gradeInfo.color }} />
                      <span style={{ color: gradeInfo.color, fontWeight: 800, fontSize: '1.5rem' }}>{prediction.grade}</span>
                      <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>{gradeInfo.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {prediction.pass ? (
                      <div className="flex items-center gap-2 px-5 py-3 rounded-2xl"
                        style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)' }}>
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                        <div>
                          <div className="text-emerald-400" style={{ fontWeight: 800, fontSize: '1.1rem' }}>LIKELY TO PASS</div>
                          <div style={{ color: '#6EE7B7', fontSize: '0.75rem' }}>High probability of success</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-5 py-3 rounded-2xl"
                        style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}>
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                        <div>
                          <div className="text-red-400" style={{ fontWeight: 800, fontSize: '1.1rem' }}>AT RISK OF FAILING</div>
                          <div style={{ color: '#FCA5A5', fontSize: '0.75rem' }}>Immediate attention needed</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-white" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      Confidence: {prediction.confidence}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div className="h-full rounded-full" style={{ width: `${prediction.confidence}%`, background: 'linear-gradient(90deg,#F59E0B,#FDE68A)' }} />
                  </div>
                </div>

                {/* Score Breakdown Mini */}
                <div className="space-y-2">
                  {breakdownData.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span style={{ color: '#94A3B8', fontSize: '0.75rem', width: 80, flexShrink: 0 }}>{item.name}</span>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div className="h-full rounded-full" style={{ width: `${(item.score / item.max) * 100}%`, background: item.color }} />
                      </div>
                      <span style={{ color: '#E2E8F0', fontSize: '0.75rem', width: 40, textAlign: 'right', flexShrink: 0 }}>
                        {item.score}/{item.max}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Score Breakdown Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E8EAFF' }}>
          <h3 className="mb-1" style={{ color: '#1E1B4B', fontWeight: 700 }}>Score Breakdown</h3>
          <p className="mb-4" style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Points earned per category</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={breakdownData} layout="vertical">
              <XAxis type="number" domain={[0, 30]} axisLine={false} tickLine={false}
                tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false}
                tick={{ fill: '#475569', fontSize: 12 }} width={75} />
              <Tooltip
                contentStyle={{ background: '#1E1B4B', border: 'none', borderRadius: 10, color: '#F1F5F9', fontSize: 12 }}
                formatter={(v: number, n: string, p?: any) => [`${v}/${p?.payload?.max || 30}`, 'Score']}
              />
              <Bar key="pred-score-bar" dataKey="score" name="pred-score" radius={[0, 8, 8, 0]}>
                {breakdownData.map((entry, i) => (
                  <Cell key={`pred-bar-cell-${entry.name}-${i}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Radar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E8EAFF' }}>
          <h3 className="mb-1" style={{ color: '#1E1B4B', fontWeight: 700 }}>Performance Radar</h3>
          <p className="mb-2" style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Multi-dimensional analysis</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E8EAFF" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <Radar key="pred-radar" name="pred-score" dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Update Parameters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E8EAFF' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 style={{ color: '#1E1B4B', fontWeight: 700 }}>Update Parameters</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Adjust values to simulate different scenarios</p>
          </div>
          <button onClick={() => setEditMode(!editMode)}
            className="px-4 py-2 rounded-xl text-sm flex items-center gap-2"
            style={{ background: editMode ? '#EDE9FE' : '#F0F2FF', color: editMode ? '#6366F1' : '#94A3B8', fontWeight: 600, border: '1px solid #E8EAFF' }}>
            <Target className="w-4 h-4" /> {editMode ? 'Cancel' : 'Edit Values'}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2" style={{ color: '#374151', fontWeight: 600, fontSize: '0.875rem' }}>
              Attendance: <span style={{ color: '#6366F1' }}>{editMode ? editValues.attendance : student.attendance}%</span>
            </label>
            <input type="range" min="0" max="100"
              value={editMode ? editValues.attendance : student.attendance}
              disabled={!editMode}
              onChange={e => setEditValues(v => ({ ...v, attendance: Number(e.target.value) }))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: '#6366F1', opacity: editMode ? 1 : 0.5 }} />
            <div className="flex justify-between mt-1" style={{ color: '#CBD5E1', fontSize: '0.7rem' }}>
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          <div>
            <label className="block mb-2" style={{ color: '#374151', fontWeight: 600, fontSize: '0.875rem' }}>
              Daily Study Hours: <span style={{ color: '#8B5CF6' }}>{editMode ? editValues.studyHoursPerDay : student.studyHoursPerDay}h</span>
            </label>
            <input type="range" min="0" max="12" step="0.5"
              value={editMode ? editValues.studyHoursPerDay : student.studyHoursPerDay}
              disabled={!editMode}
              onChange={e => setEditValues(v => ({ ...v, studyHoursPerDay: Number(e.target.value) }))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: '#8B5CF6', opacity: editMode ? 1 : 0.5 }} />
            <div className="flex justify-between mt-1" style={{ color: '#CBD5E1', fontSize: '0.7rem' }}>
              <span>0h</span><span>6h</span><span>12h</span>
            </div>
          </div>
        </div>
        {editMode && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={handleReanalyze}
            className="mt-4 w-full py-3 rounded-xl text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', fontWeight: 600 }}>
            <RefreshCw className="w-4 h-4" /> Apply & Re-Analyze
          </motion.button>
        )}
      </motion.div>

      {/* Subject-wise Predictions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E8EAFF' }}>
        <h3 className="mb-1" style={{ color: '#1E1B4B', fontWeight: 700 }}>Subject-wise Prediction</h3>
        <p className="mb-4" style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Individual subject pass/fail forecast</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjectPredictions.map((sub, i) => (
            <motion.div key={sub.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="p-4 rounded-xl"
              style={{ background: sub.pass ? `${sub.color}10` : '#FEF2F2', border: `1px solid ${sub.pass ? sub.color + '30' : '#FEE2E2'}` }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: '1.1rem' }}>{sub.emoji}</span>
                <span style={{ color: '#374151', fontWeight: 600, fontSize: '0.85rem', flex: 1 }} className="truncate">{sub.name}</span>
                <span className="px-2 py-0.5 rounded-full text-xs"
                  style={{ background: sub.pass ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: sub.pass ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                  {sub.pass ? 'PASS' : 'RISK'}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: '#E5E7EB' }}>
                <div className="h-full rounded-full" style={{ width: `${sub.avg}%`, background: sub.pass ? sub.color : '#EF4444' }} />
              </div>
              <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>Avg: {sub.avg}%</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* AI Recommendations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)', border: '1px solid #DDD6FE' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#6366F1' }}>
            <Brain className="w-4 h-4 text-white" />
          </div>
          <h3 style={{ color: '#1E1B4B', fontWeight: 700 }}>AI Recommendations</h3>
        </div>
        <div className="space-y-3">
          {prediction.recommendations.map((rec, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-white"
              style={{ border: '1px solid #DDD6FE' }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{rec.charAt(0)}</span>
              <p style={{ color: '#374151', fontSize: '0.875rem', lineHeight: 1.5 }}>{rec.slice(2)}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}