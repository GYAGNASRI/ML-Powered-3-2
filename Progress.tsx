import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useStudent } from '../context/StudentContext';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  LineChart, Line, CartesianGrid
} from 'recharts';
import { TrendingUp, Award, Target, Clock, BookOpen } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CUSTOM_TOOLTIP = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl p-3 shadow-lg" style={{ background: '#1E1B4B', border: '1px solid rgba(99,102,241,0.3)' }}>
        <p style={{ color: '#A5B4FC', fontSize: '0.75rem', marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: '0.875rem', fontWeight: 600 }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Inline legend to avoid Recharts internal key collision from <Legend> component
function ChartLegend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="flex items-center gap-5 mt-3 justify-center flex-wrap">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-1.5">
          {item.dashed ? (
            <div className="w-6 h-0 border-t-2 border-dashed" style={{ borderColor: item.color }} />
          ) : (
            <div className="w-3 h-3 rounded" style={{ background: item.color }} />
          )}
          <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Progress() {
  const { student, getSubjects, getPrediction } = useStudent();
  const subjects = getSubjects();
  const prediction = getPrediction();
  const [activeChart, setActiveChart] = useState<'weekly' | 'subject' | 'trend'>('weekly');

  const subjectStats = useMemo(() => {
    if (!student) return [];
    return subjects.map(sub => {
      const assessments = student.marks.filter(m => m.subjectId === sub.id && m.type === 'assessment');
      const midterms = student.marks.filter(m => m.subjectId === sub.id && m.type === 'midterm');
      const assessmentAvg = assessments.length > 0
        ? Math.round(assessments.reduce((s, m) => s + (m.marks / m.total) * 100, 0) / assessments.length) : 0;
      const midtermAvg = midterms.length > 0
        ? Math.round(midterms.reduce((s, m) => s + (m.marks / m.total) * 100, 0) / midterms.length) : 0;
      const overall = assessments.length + midterms.length > 0
        ? Math.round(([...assessments, ...midterms].reduce((s, m) => s + (m.marks / m.total) * 100, 0)) / (assessments.length + midterms.length)) : 0;
      return { ...sub, assessmentAvg, midtermAvg, overall };
    });
  }, [student, subjects]);

  const weeklyStudyData = useMemo(() => {
    if (!student) return [];
    const today = new Date();
    return DAYS.map((day, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      const sessions = student.studySessions.filter(s => s.date === dateStr);
      const totalHours = sessions.reduce((sum, s) => sum + s.hours, 0);
      return { id: `day-${i}`, day, hours: Math.round(totalHours * 10) / 10, target: student.studyHoursPerDay };
    });
  }, [student, subjects]);

  const pieData = useMemo(() => {
    return subjectStats.filter(s => s.overall > 0).map(s => ({
      id: s.id,  // Use unique subject ID
      name: s.name, 
      value: s.overall, 
      color: s.color, 
      emoji: s.emoji
    }));
  }, [subjectStats]);

  const progressTrendData = useMemo(() => {
    if (!student) return [];
    const sorted = [...student.marks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const weekMap: Record<string, number[]> = {};
    sorted.forEach(m => {
      const d = new Date(m.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!weekMap[key]) weekMap[key] = [];
      weekMap[key].push((m.marks / m.total) * 100);
    });
    return Object.entries(weekMap).map(([week, values]) => ({
      week, avg: Math.round(values.reduce((s, v) => s + v, 0) / values.length), count: values.length
    })).slice(-6);
  }, [student]);

  const radarData = useMemo(() => {
    return subjectStats.slice(0, 6).map(s => ({
      subject: s.name.split(' ')[0],
      assessment: s.assessmentAvg,
      midterm: s.midtermAvg,
      fullMark: 100,
    }));
  }, [subjectStats]);

  const totalStudyHours = weeklyStudyData.reduce((s, d) => s + d.hours, 0);
  const overallAvg = subjectStats.length > 0
    ? Math.round(subjectStats.reduce((s, sub) => s + sub.overall, 0) / subjectStats.length) : 0;

  if (!student) return null;

  const summaryCards = [
    { label: 'Overall Average', value: `${overallAvg}%`, icon: Award, color: '#6366F1', bg: '#EDE9FE', trend: overallAvg >= 70 ? '↑ Strong' : overallAvg >= 50 ? '→ Average' : '↓ Weak', pos: overallAvg >= 50 },
    { label: 'Prediction Score', value: `${prediction.score}/100`, icon: Target, color: prediction.pass ? '#10B981' : '#EF4444', bg: prediction.pass ? '#D1FAE5' : '#FEE2E2', trend: prediction.pass ? 'Likely Pass' : 'At Risk', pos: prediction.pass },
    { label: 'Weekly Study', value: `${Math.round(totalStudyHours)}h`, icon: Clock, color: '#F59E0B', bg: '#FEF3C7', trend: totalStudyHours >= 15 ? '🔥 Excellent' : '💪 Keep Going', pos: totalStudyHours >= 10 },
    { label: 'Subjects Tracked', value: `${subjects.length}`, icon: BookOpen, color: '#06B6D4', bg: '#CFFAFE', trend: `${subjectStats.filter(s => s.overall >= 60).length} on track`, pos: true },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ color: '#1E1B4B', fontWeight: 800, fontSize: '1.5rem' }}>📊 Progress & Analytics</h1>
        <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Visualize your academic journey with interactive charts</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E8EAFF' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <span className="px-2 py-1 rounded-lg text-xs"
                style={{ background: card.pos ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: card.pos ? '#10B981' : '#EF4444' }}>
                {card.trend}
              </span>
            </div>
            <div style={{ color: '#1E1B4B', fontSize: '1.5rem', fontWeight: 800 }}>{card.value}</div>
            <div style={{ color: '#94A3B8', fontSize: '0.8rem' }}>{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Chart Selector */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'weekly', label: '📅 Weekly Study', color: '#6366F1' },
          { key: 'subject', label: '📚 Subject Marks', color: '#EC4899' },
          { key: 'trend', label: '📈 Progress Trend', color: '#10B981' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveChart(tab.key as 'weekly' | 'subject' | 'trend')}
            className="px-4 py-2 rounded-xl text-sm transition-all"
            style={{
              background: activeChart === tab.key ? tab.color : '#F0F2FF',
              color: activeChart === tab.key ? '#FFFFFF' : '#94A3B8',
              border: `1px solid ${activeChart === tab.key ? tab.color : '#E0E7FF'}`,
              fontWeight: 600
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Chart — key forces full remount on tab switch */}
      <motion.div key={activeChart} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E8EAFF' }}>

        {activeChart === 'weekly' && (
          <>
            <div className="mb-4">
              <h3 style={{ color: '#1E1B4B', fontWeight: 700 }}>Weekly Study Hours</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Hours studied vs. daily target ({student.studyHoursPerDay}h/day)</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weeklyStudyData} id="progress-weekly-study-chart">
                <defs>
                  <linearGradient id="prog-hoursGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="prog-targetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="id" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  ticks={weeklyStudyData.map(d => d.id)}
                  tickFormatter={(id) => {
                    const item = weeklyStudyData.find(d => d.id === id);
                    return item ? item.day : id;
                  }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Area 
                  key="progress-target-area"
                  type="monotone" 
                  dataKey="target" 
                  name="Target" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  fill="url(#prog-targetGrad)" 
                  strokeDasharray="5 5" 
                  dot={false} 
                />
                <Area 
                  key="progress-hours-area"
                  type="monotone" 
                  dataKey="hours" 
                  name="Actual" 
                  stroke="#6366F1" 
                  strokeWidth={3}
                  fill="url(#prog-hoursGrad)" 
                  dot={{ fill: '#6366F1', r: 5, strokeWidth: 2, stroke: '#fff' }} 
                />
              </AreaChart>
            </ResponsiveContainer>
            <ChartLegend items={[
              { label: 'Target', color: '#10B981', dashed: true },
              { label: 'Actual', color: '#6366F1' },
            ]} />
          </>
        )}

        {activeChart === 'subject' && (
          <>
            <div className="mb-4">
              <h3 style={{ color: '#1E1B4B', fontWeight: 700 }}>Subject-wise Performance</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Assessment vs. Midterm marks comparison</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={subjectStats} layout="vertical">
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false}
                  tick={{ fill: '#475569', fontSize: 12 }} width={100} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Bar key="progress-assessment-bar" dataKey="assessmentAvg" name="Assessment" radius={[0, 4, 4, 0]} fill="#6366F1" />
                <Bar key="progress-midterm-bar" dataKey="midtermAvg" name="Midterm" radius={[0, 4, 4, 0]} fill="#EC4899" />
              </BarChart>
            </ResponsiveContainer>
            <ChartLegend items={[
              { label: 'Assessment', color: '#6366F1' },
              { label: 'Midterm', color: '#EC4899' },
            ]} />
          </>
        )}

        {activeChart === 'trend' && (
          <>
            <div className="mb-4">
              <h3 style={{ color: '#1E1B4B', fontWeight: 700 }}>Performance Trend Over Time</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Weekly average score progression</p>
            </div>
            {progressTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={progressTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F2FF" />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Line type="monotone" dataKey="avg" name="Avg Score" stroke="#10B981" strokeWidth={3}
                    dot={{ fill: '#10B981', r: 6, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-center">
                <div>
                  <TrendingUp className="w-12 h-12 mx-auto mb-3" style={{ color: '#DDD6FE' }} />
                  <p style={{ color: '#94A3B8' }}>Not enough data yet. Add more marks to see your trend.</p>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Two Column Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E8EAFF' }}>
          <h3 className="mb-1" style={{ color: '#1E1B4B', fontWeight: 700 }}>Performance Distribution</h3>
          <p className="mb-4" style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Overall average by subject</p>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <PieChart width={180} height={180}>
                <Pie data={pieData} cx={85} cy={85} outerRadius={75} innerRadius={35} paddingAngle={3} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={`prog-pie-cell-${entry.id}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1E1B4B', border: 'none', borderRadius: 10, color: '#F1F5F9', fontSize: 12 }} />
              </PieChart>
              <div className="flex-1 space-y-2">
                {pieData.map((s) => (
                  <div key={`prog-pie-legend-${s.id}`} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span style={{ color: '#475569', fontSize: '0.75rem', flex: 1 }}>{s.emoji} {s.name.split(' ')[0]}</span>
                    <span style={{ color: '#1E1B4B', fontWeight: 700, fontSize: '0.8rem' }}>{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>No marks data available yet</p>
          )}
        </motion.div>

        {/* Radar Chart — no <Legend> inside, custom HTML legend below */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E8EAFF' }}>
          <h3 className="mb-1" style={{ color: '#1E1B4B', fontWeight: 700 }}>Skills Radar</h3>
          <p className="mb-2" style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Assessment vs Midterm performance</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E8EAFF" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <Radar name="Assessment" dataKey="assessment" stroke="#6366F1" fill="#6366F1" fillOpacity={0.25} />
              <Radar name="Midterm" dataKey="midterm" stroke="#EC4899" fill="#EC4899" fillOpacity={0.2} />
              <Tooltip contentStyle={{ background: '#1E1B4B', border: 'none', borderRadius: 10, color: '#F1F5F9', fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
          <ChartLegend items={[
            { label: 'Assessment', color: '#6366F1' },
            { label: 'Midterm', color: '#EC4899' },
          ]} />
        </motion.div>
      </div>

      {/* Attendance Progress */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E8EAFF' }}>
        <h3 className="mb-4" style={{ color: '#1E1B4B', fontWeight: 700 }}>Attendance & Study Analysis</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Attendance Gauge */}
          <div className="flex flex-col items-center">
            <div className="relative w-36 h-36 mb-3">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#F0F2FF" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke={student.attendance >= 75 ? '#10B981' : '#EF4444'}
                  strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 40 * (student.attendance / 100)} ${2 * Math.PI * 40}`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: student.attendance >= 75 ? '#10B981' : '#EF4444' }}>
                  {student.attendance}%
                </span>
                <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Attendance</span>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full text-sm" style={{
              background: student.attendance >= 75 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: student.attendance >= 75 ? '#10B981' : '#EF4444', fontWeight: 600
            }}>
              {student.attendance >= 75 ? '✓ Eligible' : '⚠️ Below Minimum'}
            </div>
          </div>

          {/* Subject Health Check */}
          <div className="md:col-span-2">
            <p className="mb-3" style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600 }}>SUBJECT HEALTH CHECK</p>
            <div className="space-y-3">
              {subjectStats.slice(0, 5).map(sub => (
                <div key={sub.id} className="flex items-center gap-3">
                  <span style={{ fontSize: '0.9rem', width: 24 }}>{sub.emoji}</span>
                  <span style={{ color: '#374151', fontSize: '0.8rem', width: 100, flexShrink: 0 }} className="truncate">{sub.name.split(' ')[0]}</span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: '#F0F2FF' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${sub.overall}%`, background: sub.overall >= 75 ? '#10B981' : sub.overall >= 50 ? '#F59E0B' : '#EF4444' }} />
                  </div>
                  <span style={{ color: '#1E1B4B', fontWeight: 700, fontSize: '0.8rem', width: 40 }}>{sub.overall}%</span>
                  <span style={{ fontSize: '0.7rem', width: 60 }}>
                    {sub.overall >= 75 ? '🟢 Strong' : sub.overall >= 50 ? '🟡 Average' : '🔴 Weak'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Study Streak */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, #1E1B4B, #312E81)' }}>
        <h3 className="text-white mb-1" style={{ fontWeight: 700 }}>🔥 Study Streak & Consistency</h3>
        <p className="mb-5" style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Daily study hours this week</p>
        <div className="flex items-end gap-4 justify-center">
          {weeklyStudyData.map((d, i) => {
            const maxH = Math.max(...weeklyStudyData.map(x => x.hours), student.studyHoursPerDay);
            const barHeight = maxH > 0 ? (d.hours / maxH) * 140 : 0;
            const targetHeight = maxH > 0 ? (student.studyHoursPerDay / maxH) * 140 : 0;
            const isToday = i === weeklyStudyData.length - 1;
            return (
              <div key={d.day} className="flex flex-col items-center gap-2 flex-1">
                <span style={{ color: '#A5B4FC', fontSize: '0.75rem', fontWeight: 600 }}>{d.hours}h</span>
                <div className="relative flex items-end justify-center w-full" style={{ height: 150 }}>
                  <div className="absolute w-full border-t-2 border-dashed border-green-400/40"
                    style={{ bottom: targetHeight }} />
                  <motion.div initial={{ height: 0 }} animate={{ height: barHeight }}
                    transition={{ delay: 0.4 + i * 0.06, duration: 0.6, ease: 'easeOut' }}
                    className="w-full rounded-t-xl"
                    style={{
                      background: d.hours >= student.studyHoursPerDay
                        ? 'linear-gradient(to top, #10B981, #34D399)'
                        : d.hours > 0
                          ? 'linear-gradient(to top, #6366F1, #818CF8)'
                          : 'rgba(255,255,255,0.05)',
                      minHeight: d.hours > 0 ? 8 : 4,
                      border: isToday ? '2px solid rgba(255,255,255,0.4)' : 'none',
                    }} />
                </div>
                <span style={{ color: isToday ? '#F0F9FF' : '#64748B', fontSize: '0.75rem', fontWeight: isToday ? 700 : 400 }}>
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 justify-center flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#10B981' }} />
            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Met target</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#6366F1' }} />
            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Studied (below target)</span>
          </div>
          <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Daily target: {student.studyHoursPerDay}h</span>
        </div>
      </motion.div>
    </div>
  );
}