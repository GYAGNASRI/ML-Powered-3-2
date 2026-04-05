import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useStudent } from '../context/StudentContext';
import {
  TrendingUp, TrendingDown, Calendar, Bell, Target, BookOpen,
  Clock, Award, Zap, ChevronRight, BarChart3, Brain, LogOut
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return '☀️ Good Morning';
  if (h < 17) return '🌤️ Good Afternoon';
  return '🌙 Good Evening';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { student, getSubjects, getPrediction } = useStudent();
  const subjects = getSubjects();
  const prediction = getPrediction();

  const studyData = useMemo(() => {
    if (!student) return [];
    const today = new Date();
    const result: Array<{ id: string; day: string; hours: number; dayIndex: number }> = [];
    
    DAYS.forEach((day, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      const sessions = student.studySessions.filter(s => s.date === dateStr);
      const total = sessions.reduce((sum, s) => sum + s.hours, 0);
      
      // Create absolutely unique identifier
      const uniqueId = `study-${dateStr}-idx${i}`;
      
      result.push({ 
        id: uniqueId,
        day: `${day}-${i}`, // Make day unique by adding index
        hours: Math.round(total * 10) / 10,
        dayIndex: i
      });
    });
    
    return result;
  }, [student]);

  const subjectPerformance = useMemo(() => {
    if (!student) return [];
    return subjects.map(sub => {
      const subMarks = student.marks.filter(m => m.subjectId === sub.id);
      const avg = subMarks.length > 0
        ? subMarks.reduce((sum, m) => sum + (m.marks / m.total) * 100, 0) / subMarks.length
        : 0;
      return { ...sub, avg: Math.round(avg) };
    });
  }, [student, subjects]);

  const overallAvg = useMemo(() => {
    if (!student || student.marks.length === 0) return 0;
    return Math.round(student.marks.reduce((sum, m) => sum + (m.marks / m.total) * 100, 0) / student.marks.length);
  }, [student]);

  const upcomingReminders = useMemo(() => {
    if (!student) return [];
    const today = new Date();
    return student.reminders
      .filter(r => new Date(r.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [student]);

  const totalStudyHours = useMemo(() => {
    return studyData.reduce((sum, d) => sum + d.hours, 0);
  }, [studyData]);

  const statCards = [
    {
      label: 'Attendance', value: `${student?.attendance || 0}%`, icon: TrendingUp,
      color: '#10B981', bg: '#D1FAE5', trend: (student?.attendance ?? 0) >= 75 ? '+Good' : '⚠️ Low',
      sub: 'This semester', trendPos: (student?.attendance ?? 0) >= 75
    },
    {
      label: 'Avg. Marks', value: `${overallAvg}%`, icon: Award,
      color: '#6366F1', bg: '#EDE9FE', trend: overallAvg >= 60 ? '📈 On Track' : '📉 Needs Work',
      sub: 'All subjects', trendPos: overallAvg >= 60
    },
    {
      label: 'Prediction Score', value: `${prediction.score}/100`, icon: Brain,
      color: prediction.pass ? '#10B981' : '#EF4444',
      bg: prediction.pass ? '#D1FAE5' : '#FEE2E2',
      trend: prediction.pass ? `Grade: ${prediction.grade}` : '⚠️ At Risk',
      sub: 'ML estimate', trendPos: prediction.pass
    },
    {
      label: 'Study This Week', value: `${Math.round(totalStudyHours)}h`, icon: Clock,
      color: '#F59E0B', bg: '#FEF3C7',
      trend: totalStudyHours >= 15 ? '🔥 Excellent' : totalStudyHours >= 10 ? '👍 Good' : '💪 Needs More',
      sub: 'Past 7 days', trendPos: totalStudyHours >= 10
    },
  ];

  const pieData = subjectPerformance.slice(0, 5).map((s, idx) => ({ 
    id: `pie-${s.id}-${idx}`, // Ensure unique ID with index
    name: s.name, 
    value: s.avg || 1, 
    color: s.color 
  }));

  if (!student) return null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #818CF8, transparent)' }} />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #EC4899, transparent)' }} />
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <p style={{ color: '#A5B4FC', fontSize: '0.875rem', marginBottom: 4 }}>{getGreeting()}</p>
            <h1 className="text-white mb-2" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              {student.name}! 🎯
            </h1>
            <p style={{ color: '#C7D2FE', fontSize: '0.9rem' }}>
              {student.curriculum.charAt(0).toUpperCase() + student.curriculum.slice(1)} • Grade {student.grade}
              {student.stream && student.stream !== 'general' && ` • ${student.stream.charAt(0).toUpperCase() + student.stream.slice(1)} Stream`}
            </p>
            <div className="flex items-center gap-3 mt-4">
              <Link to="/app/prediction"
                className="px-4 py-2 rounded-xl text-white flex items-center gap-2 transition-all"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', fontSize: '0.85rem', fontWeight: 600 }}>
                <Target className="w-4 h-4" /> View Prediction
              </Link>
              <Link to="/app/reminders"
                className="px-4 py-2 rounded-xl text-white flex items-center gap-2"
                style={{ background: 'rgba(236,72,153,0.3)', border: '1px solid rgba(236,72,153,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>
                <Bell className="w-4 h-4" /> Set Reminder
              </Link>
              <button onClick={() => navigate('/logout')}
                className="px-4 py-2 rounded-xl text-white flex items-center gap-2 transition-all hover:scale-105"
                style={{ background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: prediction.pass
                  ? 'conic-gradient(#10B981 0%, #10B981 ' + prediction.score + '%, rgba(255,255,255,0.1) ' + prediction.score + '%)'
                  : 'conic-gradient(#EF4444 0%, #EF4444 ' + prediction.score + '%, rgba(255,255,255,0.1) ' + prediction.score + '%)',
                padding: 4
              }}>
              <div className="w-full h-full rounded-full flex flex-col items-center justify-center"
                style={{ background: '#1E1B4B' }}>
                <div className="text-white" style={{ fontSize: '1.25rem', fontWeight: 800 }}>{prediction.score}</div>
                <div style={{ color: '#94A3B8', fontSize: '0.55rem' }}>SCORE</div>
              </div>
            </div>
            <div className="mt-2 px-3 py-1 rounded-full" style={{
              background: prediction.pass ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
              color: prediction.pass ? '#6EE7B7' : '#FCA5A5', fontSize: '0.75rem', fontWeight: 700
            }}>
              {prediction.pass ? '✓ LIKELY PASS' : '⚠️ AT RISK'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl p-5 transition-all hover:shadow-lg"
            style={{ background: '#FFFFFF', border: '1px solid #E8EAFF' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <span className="px-2 py-1 rounded-lg text-xs" style={{
                background: card.trendPos ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: card.trendPos ? '#10B981' : '#EF4444'
              }}>{card.trend}</span>
            </div>
            <div style={{ color: '#1E1B4B', fontSize: '1.5rem', fontWeight: 800 }}>{card.value}</div>
            <div style={{ color: '#94A3B8', fontSize: '0.8rem' }}>{card.label}</div>
            <div style={{ color: '#CBD5E1', fontSize: '0.7rem' }}>{card.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Study Hours Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E8EAFF' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 style={{ color: '#1E1B4B', fontWeight: 700 }}>Weekly Study Hours</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Your study pattern this week</p>
            </div>
            <Link to="/app/progress" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: '#EDE9FE', color: '#6366F1', fontWeight: 600 }}>
              <BarChart3 className="w-3 h-3" /> Full Report
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={studyData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }} id="dashboard-study-hours-chart">
              <defs>
                <linearGradient id="dashStudyGradient-unique-2024" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="id"
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#94A3B8', fontSize: 12 }}
                ticks={studyData.map(d => d.id)}
                tickFormatter={(id) => {
                  const item = studyData.find(d => d.id === id);
                  if (!item) return id;
                  return DAYS[item.dayIndex];
                }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94A3B8', fontSize: 12 }}
                width={30}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ background: '#1E1B4B', border: 'none', borderRadius: 12, color: '#F1F5F9' }}
                formatter={(v: number) => [`${v}h`, 'Study Hours']}
                labelFormatter={(id) => {
                  const item = studyData.find(d => d.id === id);
                  if (!item) return id;
                  return DAYS[item.dayIndex];
                }}
              />
              <Area 
                key="area-study-hours-dashboard"
                type="monotone" 
                dataKey="hours" 
                name="Study Hours" 
                stroke="#6366F1" 
                strokeWidth={3}
                fill="url(#dashStudyGradient-unique-2024)" 
                dot={false}
                activeDot={{ r: 6, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Subject Distribution Pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E8EAFF' }}>
          <h3 className="mb-1" style={{ color: '#1E1B4B', fontWeight: 700 }}>Performance Split</h3>
          <p className="mb-4" style={{ color: '#94A3B8', fontSize: '0.8rem' }}>By subject averages</p>
          <div className="flex justify-center">
            <PieChart width={160} height={160}>
              <Pie 
                key="dashboard-performance-pie"
                data={pieData} 
                cx={75} 
                cy={75} 
                innerRadius={40} 
                outerRadius={70} 
                paddingAngle={3} 
                dataKey="value"
                nameKey="name"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${entry.id}-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1E1B4B', border: 'none', borderRadius: 8, color: '#F1F5F9', fontSize: 12 }} />
            </PieChart>
          </div>
          <div className="space-y-2 mt-2">
            {pieData.slice(0, 4).map((s) => (
              <div key={`dash-legend-${s.id}`} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="flex-1 truncate" style={{ color: '#475569', fontSize: '0.75rem' }}>{s.name}</span>
                <span style={{ color: '#1E1B4B', fontWeight: 600, fontSize: '0.8rem' }}>{s.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E8EAFF' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 style={{ color: '#1E1B4B', fontWeight: 700 }}>Subject Performance</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Average marks per subject</p>
            </div>
            <Link to="/app/subjects" className="flex items-center gap-1 text-xs"
              style={{ color: '#6366F1', fontWeight: 600 }}>
              Manage <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {subjectPerformance.slice(0, 5).map((sub, i) => (
              <div key={sub.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '0.9rem' }}>{sub.emoji}</span>
                    <span style={{ color: '#374151', fontSize: '0.85rem', fontWeight: 500 }}>{sub.name}</span>
                  </div>
                  <span style={{ color: sub.color, fontWeight: 700, fontSize: '0.875rem' }}>{sub.avg}%</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${sub.avg}%` }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${sub.color}, ${sub.color}88)` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Reminders */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E8EAFF' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 style={{ color: '#1E1B4B', fontWeight: 700 }}>Upcoming Reminders</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Your scheduled study sessions</p>
            </div>
            <Link to="/app/reminders" className="flex items-center gap-1 text-xs"
              style={{ color: '#6366F1', fontWeight: 600 }}>
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {upcomingReminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="w-12 h-12 mb-3" style={{ color: '#DDD6FE' }} />
              <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>No upcoming reminders</p>
              <Link to="/app/reminders" className="mt-3 px-4 py-2 rounded-xl text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', fontWeight: 600 }}>
                + Add Reminder
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingReminders.map((r, i) => {
                const sub = subjects.find(s => s.id === r.subjectId);
                const date = new Date(r.date);
                return (
                  <motion.div key={r.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: `${r.color}12`, border: `1px solid ${r.color}25` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${r.color}25` }}>
                      <span style={{ fontSize: '1.2rem' }}>{sub?.emoji || '📚'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ color: '#1E1B4B', fontWeight: 600, fontSize: '0.875rem' }} className="truncate">{r.title}</div>
                      <div style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {r.time}
                      </div>
                    </div>
                    <div className="flex-shrink-0 w-2 h-2 rounded-full" style={{ background: r.color }} />
                  </motion.div>
                );
              })}
              <Link to="/app/reminders"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl transition-all"
                style={{ background: '#F0F2FF', color: '#6366F1', fontWeight: 600, fontSize: '0.875rem', border: '1px solid #E0E7FF' }}>
                <Bell className="w-4 h-4" /> + Add New Reminder
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/app/prediction', icon: Target, label: 'Run Prediction', color: '#6366F1', bg: '#EDE9FE', emoji: '🎯' },
          { to: '/app/subjects', icon: BookOpen, label: 'Update Marks', color: '#F59E0B', bg: '#FEF3C7', emoji: '📝' },
          { to: '/app/reminders', icon: Bell, label: 'Set Reminder', color: '#06B6D4', bg: '#CFFAFE', emoji: '🔔' },
          { to: '/app/progress', icon: BarChart3, label: 'View Analytics', color: '#10B981', bg: '#D1FAE5', emoji: '📊' },
        ].map((item, i) => (
          <Link key={item.to} to={item.to}
            className="rounded-2xl p-5 flex flex-col items-center gap-3 transition-all hover:shadow-md group"
            style={{ background: '#FFFFFF', border: '1px solid #E8EAFF' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
              style={{ background: item.bg }}>
              <span style={{ fontSize: '1.5rem' }}>{item.emoji}</span>
            </div>
            <span style={{ color: '#374151', fontWeight: 600, fontSize: '0.85rem', textAlign: 'center' }}>{item.label}</span>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}