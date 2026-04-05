import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useStudent } from '../context/StudentContext';
import { Brain, ChevronRight, ChevronLeft, User, BookOpen, BarChart3, Check, GraduationCap, Clock, CalendarCheck, CalendarDays } from 'lucide-react';
import type { Curriculum, Stream } from '../context/StudentContext';

const CURRICULA = [
  { value: 'schooling', label: 'Schooling', desc: 'Grades 6–10', emoji: '🏫', color: '#6366F1', bg: 'rgba(99,102,241,0.18)' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Grades 11–12', emoji: '📚', color: '#10B981', bg: 'rgba(16,185,129,0.18)' },
  { value: 'degree', label: 'Degree (UG)', desc: "Bachelor's Program", emoji: '🎓', color: '#F59E0B', bg: 'rgba(245,158,11,0.18)' },
  { value: 'graduation', label: 'Post-Graduation', desc: "Master's Program", emoji: '🏆', color: '#EC4899', bg: 'rgba(236,72,153,0.18)' },
];

const STREAMS: Record<string, { value: string; label: string; emoji: string; color: string }[]> = {
  intermediate: [
    { value: 'science', label: 'Science', emoji: '⚛️', color: '#38BDF8' },
    { value: 'commerce', label: 'Commerce', emoji: '💼', color: '#34D399' },
    { value: 'arts', label: 'Arts', emoji: '🎨', color: '#F472B6' },
  ],
  degree: [
    { value: 'engineering', label: 'Engineering / CS', emoji: '💻', color: '#818CF8' },
    { value: 'medical', label: 'Medical / Life Sciences', emoji: '🏥', color: '#34D399' },
    { value: 'commerce', label: 'Commerce / BBA', emoji: '📊', color: '#FBBF24' },
    { value: 'arts', label: 'Arts / Humanities', emoji: '🎭', color: '#F472B6' },
  ],
  graduation: [
    { value: 'engineering', label: 'M.Tech / M.Sc (CS)', emoji: '🤖', color: '#818CF8' },
    { value: 'general', label: 'MBA / M.Com / MA', emoji: '📜', color: '#FBBF24' },
  ],
};

const GRADES: Record<string, string[]> = {
  schooling: ['6', '7', '8', '9', '10'],
  intermediate: ['11', '12'],
  degree: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
  graduation: ['1st Year PG', '2nd Year PG'],
};

const STUDY_HOURS_OPTIONS = [
  { value: 1, label: '1 hr', desc: 'Light', icon: '🌱', color: '#94A3B8' },
  { value: 2, label: '2 hrs', desc: 'Casual', icon: '📖', color: '#38BDF8' },
  { value: 3, label: '3 hrs', desc: 'Regular', icon: '📚', color: '#34D399' },
  { value: 5, label: '5 hrs', desc: 'Focused', icon: '🎯', color: '#F59E0B' },
  { value: 8, label: '8 hrs', desc: 'Intensive', icon: '🔥', color: '#F472B6' },
  { value: 10, label: '10+ hrs', desc: 'Marathon', icon: '⚡', color: '#EC4899' },
];

const WEEK_DAYS = [
  { value: 1, label: 'Mon', full: 'Monday' },
  { value: 2, label: 'Tue', full: 'Tuesday' },
  { value: 3, label: 'Wed', full: 'Wednesday' },
  { value: 4, label: 'Thu', full: 'Thursday' },
  { value: 5, label: 'Fri', full: 'Friday' },
  { value: 6, label: 'Sat', full: 'Saturday' },
  { value: 7, label: 'Sun', full: 'Sunday' },
];

const DAY_INTENSITY: Record<number, { label: string; color: string; tip: string }> = {
  1: { label: 'Minimal', color: '#94A3B8', tip: 'Very light schedule' },
  2: { label: 'Light', color: '#38BDF8', tip: 'Easy-going week' },
  3: { label: 'Moderate', color: '#34D399', tip: 'Balanced approach' },
  4: { label: 'Good', color: '#A3E635', tip: 'Solid commitment' },
  5: { label: 'Focused', color: '#FBBF24', tip: 'Weekday warrior' },
  6: { label: 'Dedicated', color: '#F97316', tip: 'Near full week' },
  7: { label: 'Full Week', color: '#F472B6', tip: 'Maximum effort!' },
};

const steps = [
  { icon: User, label: 'Personal Info', color: '#6366F1' },
  { icon: BookOpen, label: 'Academic Details', color: '#10B981' },
  { icon: BarChart3, label: 'Study Profile', color: '#F59E0B' },
];

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useStudent();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    curriculum: '' as Curriculum | '',
    stream: '' as Stream | '',
    grade: '',
    attendance: 80,
    studyHoursPerDay: 3,
    studyDaysPerWeek: 5,
  });

  const update = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email required';
      if (!formData.password || formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }
    if (step === 1) {
      if (!formData.curriculum) newErrors.curriculum = 'Please select your curriculum';
      if (!formData.grade) newErrors.grade = 'Please select your grade/year';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true);
    try {
      await signup({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        curriculum: formData.curriculum as Curriculum,
        stream: (formData.stream || 'general') as Stream,
        grade: formData.grade,
        attendance: formData.attendance,
        studyHoursPerDay: formData.studyHoursPerDay,
        studyDaysPerWeek: formData.studyDaysPerWeek,
      });
      setLoading(false);
      navigate('/app/dashboard');
    } catch (error: any) {
      setLoading(false);
      const errorMessage = error?.message || 'Signup failed. Please try again.';
      setErrors({ submit: errorMessage });
      console.error('Signup failed:', error);
    }
  };

  const needsStream = formData.curriculum && formData.curriculum !== 'schooling';
  const availableStreams = formData.curriculum ? STREAMS[formData.curriculum] || [] : [];
  const availableGrades = formData.curriculum ? GRADES[formData.curriculum] || [] : [];

  const attendanceColor = formData.attendance >= 75 ? '#10B981' : formData.attendance >= 50 ? '#F59E0B' : '#EF4444';
  const attendanceLabel = formData.attendance >= 75 ? 'Eligible for exams ✓' : formData.attendance >= 50 ? 'At risk – below 75% ⚠️' : 'Critical – very low attendance ✗';

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243e 100%)' }}>
      <div className="w-full max-w-lg">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div className="text-white" style={{ fontSize: '1.25rem', fontWeight: 700 }}>EduPredict AI</div>
          </div>
          <h1 className="text-white mb-2" style={{ fontSize: '1.75rem', fontWeight: 700 }}>Create Your Account</h1>
          <p style={{ color: '#94A3B8' }}>Join thousands of students on their path to success</p>
        </motion.div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: i < step ? '#10B981' : i === step ? s.color : 'rgba(255,255,255,0.1)',
                    border: `2px solid ${i <= step ? (i < step ? '#10B981' : s.color) : 'rgba(255,255,255,0.2)'}`,
                    boxShadow: i === step ? `0 0 16px ${s.color}55` : 'none',
                  }}>
                  {i < step ? <Check className="w-5 h-5 text-white" /> : <s.icon className="w-5 h-5 text-white" />}
                </div>
                <span style={{ color: i === step ? '#E2E8F0' : '#64748B', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="w-12 h-0.5 mb-4" style={{ background: i < step ? '#10B981' : 'rgba(255,255,255,0.15)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <motion.div className="rounded-3xl p-8"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }}>
          
          {/* Error Display */}
          {errors.submit && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 rounded-xl flex items-start gap-3"
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            >
              <div className="text-lg mt-0.5">⚠️</div>
              <div>
                <div style={{ color: '#FCA5A5', fontWeight: 600, fontSize: '0.9rem' }}>Signup Error</div>
                <div style={{ color: '#FECACA', fontSize: '0.85rem' }}>{errors.submit}</div>
              </div>
            </motion.div>
          )}
          
          <AnimatePresence mode="wait">

            {/* Step 0 - Personal Info */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                className="space-y-4">
                <h3 className="text-white mb-6" style={{ fontSize: '1.1rem', fontWeight: 600 }}>👤 Personal Information</h3>
                <InputField label="Full Name" value={formData.name} onChange={v => update('name', v)} placeholder="e.g. Arjun Sharma" error={errors.name} />
                <InputField label="Email Address" type="email" value={formData.email} onChange={v => update('email', v)} placeholder="you@example.com" error={errors.email} />
                <InputField label="Phone Number (Optional)" type="tel" value={formData.phone} onChange={v => update('phone', v)} placeholder="+91 9876543210" />
                <InputField label="Password" type="password" value={formData.password} onChange={v => update('password', v)} placeholder="Min. 6 characters" error={errors.password} />
                <InputField label="Confirm Password" type="password" value={formData.confirmPassword} onChange={v => update('confirmPassword', v)} placeholder="Re-enter password" error={errors.confirmPassword} />
                <button onClick={handleNext} className="w-full py-3 rounded-xl text-white flex items-center justify-center gap-2 mt-4"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', fontWeight: 600 }}>
                  Next Step <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* Step 1 - Academic Details */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h3 className="text-white mb-5" style={{ fontSize: '1.1rem', fontWeight: 600 }}>🎓 Academic Information</h3>

                {/* ── Curriculum Selection ── */}
                <div className="mb-6">
                  <label className="block mb-3 flex items-center gap-2" style={{ color: '#E2E8F0', fontSize: '0.875rem', fontWeight: 600 }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: '#6366F1', color: '#fff' }}>1</span>
                    Select Your Curriculum
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {CURRICULA.map(c => {
                      const selected = formData.curriculum === c.value;
                      return (
                        <button
                          key={c.value}
                          onClick={() => { update('curriculum', c.value); update('stream', ''); update('grade', ''); }}
                          className="relative p-4 rounded-2xl text-left transition-all"
                          style={{
                            background: selected ? c.bg : 'rgba(255,255,255,0.06)',
                            border: `2px solid ${selected ? c.color : 'rgba(255,255,255,0.18)'}`,
                            boxShadow: selected ? `0 0 20px ${c.color}40, inset 0 0 12px ${c.color}10` : 'none',
                            transform: selected ? 'scale(1.02)' : 'scale(1)',
                          }}>
                          {/* Radio indicator */}
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{
                              border: `2px solid ${selected ? c.color : 'rgba(255,255,255,0.35)'}`,
                              background: selected ? c.color : 'transparent',
                              boxShadow: selected ? `0 0 8px ${c.color}80` : 'none',
                            }}>
                            {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </div>

                          <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{c.emoji}</div>
                          <div style={{
                            color: selected ? '#FFFFFF' : '#CBD5E1',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            marginBottom: '2px',
                          }}>{c.label}</div>
                          <div style={{
                            color: selected ? c.color : '#94A3B8',
                            fontSize: '0.72rem',
                            fontWeight: 500,
                          }}>{c.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.curriculum && (
                    <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' }}>
                      <span style={{ color: '#FCA5A5', fontSize: '0.8rem' }}>⚠ {errors.curriculum}</span>
                    </div>
                  )}
                </div>

                {/* ── Stream Selection ── */}
                {needsStream && availableStreams.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <label className="block mb-3 flex items-center gap-2" style={{ color: '#E2E8F0', fontSize: '0.875rem', fontWeight: 600 }}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: '#10B981', color: '#fff' }}>2</span>
                      Select Your Stream
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {availableStreams.map(s => {
                        const selected = formData.stream === s.value;
                        return (
                          <button
                            key={s.value}
                            onClick={() => update('stream', s.value)}
                            className="flex items-center gap-3 p-3.5 rounded-xl transition-all"
                            style={{
                              background: selected ? `rgba(${s.color === '#38BDF8' ? '56,189,248' : s.color === '#34D399' ? '52,211,153' : '244,114,182'},0.15)` : 'rgba(255,255,255,0.07)',
                              border: `2px solid ${selected ? s.color : 'rgba(255,255,255,0.18)'}`,
                              boxShadow: selected ? `0 0 16px ${s.color}35` : 'none',
                            }}>
                            {/* Radio dot */}
                            <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                              style={{
                                border: `2px solid ${selected ? s.color : 'rgba(255,255,255,0.40)'}`,
                                background: selected ? s.color : 'transparent',
                              }}>
                              {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <span style={{ fontSize: '1.2rem' }}>{s.emoji}</span>
                            <span style={{ color: selected ? '#FFFFFF' : '#CBD5E1', fontWeight: selected ? 700 : 500, fontSize: '0.9rem', flex: 1, textAlign: 'left' }}>
                              {s.label}
                            </span>
                            {selected && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                                style={{ background: s.color, color: '#0F0C29' }}>Selected</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* ── Grade Selection ── */}
                {formData.curriculum && availableGrades.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <label className="block mb-3 flex items-center gap-2" style={{ color: '#E2E8F0', fontSize: '0.875rem', fontWeight: 600 }}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                        style={{ background: '#F59E0B', color: '#0F0C29' }}>
                        {needsStream ? '3' : '2'}
                      </span>
                      Select Grade / Year
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableGrades.map(g => {
                        const selected = formData.grade === g;
                        return (
                          <button
                            key={g}
                            onClick={() => update('grade', g)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all"
                            style={{
                              background: selected ? 'rgba(99,102,241,0.28)' : 'rgba(255,255,255,0.08)',
                              border: `2px solid ${selected ? '#818CF8' : 'rgba(255,255,255,0.22)'}`,
                              color: selected ? '#C7D2FE' : '#CBD5E1',
                              fontWeight: selected ? 700 : 500,
                              fontSize: '0.875rem',
                              boxShadow: selected ? '0 0 14px rgba(99,102,241,0.5)' : 'none',
                              transform: selected ? 'scale(1.06)' : 'scale(1)',
                            }}>
                            {selected && <Check className="w-3.5 h-3.5" style={{ color: '#818CF8' }} strokeWidth={3} />}
                            {g}
                          </button>
                        );
                      })}
                    </div>
                    {errors.grade && (
                      <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' }}>
                        <span style={{ color: '#FCA5A5', fontSize: '0.8rem' }}>⚠ {errors.grade}</span>
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.22)', color: '#CBD5E1', fontWeight: 500 }}>
                    <ChevronLeft className="w-5 h-5" /> Back
                  </button>
                  <button onClick={handleNext} className="flex-1 py-3 rounded-xl text-white flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', fontWeight: 600 }}>
                    Next <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2 - Study Profile */}
            {step === 2 && (
              <motion.form key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                onSubmit={handleSubmit}>
                <h3 className="text-white mb-5" style={{ fontSize: '1.1rem', fontWeight: 600 }}>📊 Study Profile</h3>

                {/* ── Attendance ── */}
                <div className="mb-6">
                  <label className="block mb-3 flex items-center gap-2" style={{ color: '#E2E8F0', fontSize: '0.875rem', fontWeight: 600 }}>
                    <CalendarCheck className="w-4 h-4" style={{ color: '#A5B4FC' }} />
                    Attendance Percentage
                    <span className="ml-auto px-2.5 py-0.5 rounded-full text-sm font-bold"
                      style={{ background: `${attendanceColor}22`, color: attendanceColor, border: `1px solid ${attendanceColor}55` }}>
                      {formData.attendance}%
                    </span>
                  </label>

                  {/* Visual track */}
                  <div className="relative mb-2">
                    <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${formData.attendance}%`,
                          background: `linear-gradient(90deg, #EF4444, ${formData.attendance >= 75 ? '#10B981' : '#F59E0B'})`,
                          boxShadow: `0 0 10px ${attendanceColor}80`,
                        }} />
                    </div>
                    <input type="range" min="0" max="100" value={formData.attendance}
                      onChange={e => update('attendance', Number(e.target.value))}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer h-3" />
                  </div>

                  <div className="flex justify-between mb-2" style={{ color: '#475569', fontSize: '0.7rem' }}>
                    <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                  </div>

                  {/* Threshold markers */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: `${attendanceColor}14`, border: `1.5px solid ${attendanceColor}45` }}>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: attendanceColor, boxShadow: `0 0 6px ${attendanceColor}` }} />
                    <span style={{ color: attendanceColor, fontSize: '0.82rem', fontWeight: 600 }}>{attendanceLabel}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {[
                      { pct: 60, label: '60%', note: 'Low' },
                      { pct: 75, label: '75%', note: 'Min. eligible' },
                      { pct: 90, label: '90%', note: 'Excellent' },
                    ].map(q => (
                      <button key={q.pct} type="button" onClick={() => update('attendance', q.pct)}
                        className="py-1.5 rounded-lg text-center transition-all"
                        style={{
                          background: formData.attendance === q.pct ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)',
                          border: `1.5px solid ${formData.attendance === q.pct ? '#818CF8' : 'rgba(255,255,255,0.15)'}`,
                          color: formData.attendance === q.pct ? '#C7D2FE' : '#94A3B8',
                          fontSize: '0.72rem',
                          fontWeight: formData.attendance === q.pct ? 700 : 400,
                        }}>
                        <div style={{ fontWeight: 700 }}>{q.label}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.75 }}>{q.note}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Daily Study Hours ── */}
                <div className="mb-6">
                  <label className="block mb-3 flex items-center gap-2" style={{ color: '#E2E8F0', fontSize: '0.875rem', fontWeight: 600 }}>
                    <Clock className="w-4 h-4" style={{ color: '#A5B4FC' }} />
                    Daily Study Hours
                    <span className="ml-auto px-2.5 py-0.5 rounded-full text-sm font-bold"
                      style={{ background: 'rgba(139,92,246,0.25)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.45)' }}>
                      {formData.studyHoursPerDay} hrs/day
                    </span>
                  </label>

                  {/* Card-based radio options */}
                  <div className="grid grid-cols-3 gap-2">
                    {STUDY_HOURS_OPTIONS.map(opt => {
                      const selected = formData.studyHoursPerDay === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => update('studyHoursPerDay', opt.value)}
                          className="relative flex flex-col items-center py-3 px-2 rounded-xl transition-all"
                          style={{
                            background: selected ? `${opt.color}20` : 'rgba(255,255,255,0.07)',
                            border: `2px solid ${selected ? opt.color : 'rgba(255,255,255,0.18)'}`,
                            boxShadow: selected ? `0 0 16px ${opt.color}45` : 'none',
                            transform: selected ? 'scale(1.05)' : 'scale(1)',
                          }}>
                          {/* Selected check badge */}
                          {selected && (
                            <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ background: opt.color }}>
                              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                            </div>
                          )}
                          <span style={{ fontSize: '1.4rem', marginBottom: '2px' }}>{opt.icon}</span>
                          <span style={{ color: selected ? '#FFFFFF' : '#CBD5E1', fontWeight: 700, fontSize: '0.85rem' }}>{opt.label}</span>
                          <span style={{ color: selected ? opt.color : '#94A3B8', fontSize: '0.68rem', fontWeight: 500 }}>{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Fine-tune slider */}
                  <div className="mt-3">
                    <div className="relative">
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${(formData.studyHoursPerDay / 12) * 100}%`,
                            background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                            boxShadow: '0 0 8px rgba(139,92,246,0.6)',
                          }} />
                      </div>
                      <input type="range" min="0" max="12" step="0.5" value={formData.studyHoursPerDay}
                        onChange={e => update('studyHoursPerDay', Number(e.target.value))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer h-2" />
                    </div>
                    <div className="flex justify-between mt-1" style={{ color: '#475569', fontSize: '0.68rem' }}>
                      <span>0h</span><span>3h</span><span>6h (Ideal)</span><span>9h</span><span>12h</span>
                    </div>
                  </div>
                </div>

                {/* ── Study Days Per Week ── */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <label className="flex items-center gap-2" style={{ color: '#E2E8F0', fontSize: '0.875rem', fontWeight: 600 }}>
                      <CalendarDays className="w-4 h-4" style={{ color: '#A5B4FC' }} />
                      Study Days Per Week
                    </label>
                    <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: 'rgba(99,102,241,0.25)', color: '#C7D2FE', border: '1px solid rgba(99,102,241,0.45)' }}>
                      Optional
                    </span>
                  </div>
                  <p className="mb-3" style={{ color: '#64748B', fontSize: '0.72rem' }}>
                    Tap the days you plan to study each week — helps us build a realistic timetable for you.
                  </p>

                  {/* Individual day toggles */}
                  <div className="grid grid-cols-7 gap-1.5 mb-3">
                    {WEEK_DAYS.map((day, idx) => {
                      const intensity = DAY_INTENSITY[formData.studyDaysPerWeek];
                      const isActive = idx < formData.studyDaysPerWeek;
                      const isEdge = idx === formData.studyDaysPerWeek - 1;
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => update('studyDaysPerWeek', isActive && !isEdge ? idx : idx + 1)}
                          className="flex flex-col items-center py-2 rounded-xl transition-all"
                          style={{
                            background: isActive ? `${intensity.color}25` : 'rgba(255,255,255,0.06)',
                            border: `2px solid ${isActive ? intensity.color : 'rgba(255,255,255,0.18)'}`,
                            boxShadow: isEdge ? `0 0 12px ${intensity.color}60` : 'none',
                            transform: isEdge ? 'scale(1.08)' : 'scale(1)',
                          }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isActive ? intensity.color : '#64748B' }}>
                            {day.label}
                          </span>
                          <div className="w-1.5 h-1.5 rounded-full mt-1"
                            style={{ background: isActive ? intensity.color : 'rgba(255,255,255,0.15)' }} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Count stepper */}
                  <div className="flex items-center gap-3">
                    <button type="button"
                      onClick={() => update('studyDaysPerWeek', Math.max(1, formData.studyDaysPerWeek - 1))}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold transition-all"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.22)', color: '#CBD5E1' }}>
                      −
                    </button>

                    <div className="flex-1 rounded-xl px-4 py-2.5 flex items-center justify-between"
                      style={{
                        background: `${DAY_INTENSITY[formData.studyDaysPerWeek].color}15`,
                        border: `1.5px solid ${DAY_INTENSITY[formData.studyDaysPerWeek].color}50`,
                      }}>
                      <div>
                        <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1.1rem' }}>
                          {formData.studyDaysPerWeek}
                        </span>
                        <span style={{ color: '#94A3B8', fontSize: '0.8rem', marginLeft: '4px' }}>
                          day{formData.studyDaysPerWeek !== 1 ? 's' : ''} / week
                        </span>
                      </div>
                      <div className="text-right">
                        <div style={{ color: DAY_INTENSITY[formData.studyDaysPerWeek].color, fontWeight: 700, fontSize: '0.78rem' }}>
                          {DAY_INTENSITY[formData.studyDaysPerWeek].label}
                        </div>
                        <div style={{ color: '#64748B', fontSize: '0.65rem' }}>
                          {DAY_INTENSITY[formData.studyDaysPerWeek].tip}
                        </div>
                      </div>
                    </div>

                    <button type="button"
                      onClick={() => update('studyDaysPerWeek', Math.min(7, formData.studyDaysPerWeek + 1))}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold transition-all"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.22)', color: '#CBD5E1' }}>
                      +
                    </button>
                  </div>

                  {/* Weekly hours estimate */}
                  <div className="mt-2.5 flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}>
                    <span style={{ fontSize: '0.95rem' }}>📅</span>
                    <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>
                      Estimated weekly study time:
                    </span>
                    <span style={{ color: '#A5B4FC', fontWeight: 700, fontSize: '0.85rem', marginLeft: 'auto' }}>
                      ~{formData.studyDaysPerWeek * formData.studyHoursPerDay} hrs/week
                    </span>
                  </div>
                </div>

                {/* ── Account Summary ── */}
                <div className="rounded-2xl p-4 mb-6" style={{ background: 'rgba(99,102,241,0.1)', border: '1.5px solid rgba(99,102,241,0.3)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-5 h-5" style={{ color: '#A5B4FC' }} />
                    <span className="text-white" style={{ fontWeight: 700, fontSize: '0.9rem' }}>Account Summary</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Name', value: formData.name },
                      { label: 'Curriculum', value: CURRICULA.find(c => c.value === formData.curriculum)?.label || '-' },
                      { label: 'Stream', value: formData.stream || 'N/A' },
                      { label: 'Grade', value: formData.grade || '-' },
                      { label: 'Attendance', value: `${formData.attendance}%` },
                      { label: 'Study / Day', value: `${formData.studyHoursPerDay} hrs` },
                      { label: 'Days / Week', value: `${formData.studyDaysPerWeek} days` },
                    ].map(item => (
                      <div key={item.label} className="flex flex-col">
                        <span style={{ color: '#64748B', fontSize: '0.7rem' }}>{item.label}</span>
                        <span style={{ color: '#E2E8F0', fontSize: '0.85rem', fontWeight: 600 }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.22)', color: '#CBD5E1', fontWeight: 500 }}>
                    <ChevronLeft className="w-5 h-5" /> Back
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl text-white flex items-center justify-center gap-2"
                    style={{ background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)', fontWeight: 600 }}>
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
                    ) : (<><Check className="w-5 h-5" /> Create Account</>)}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="text-center mt-6" style={{ color: '#64748B', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <Link to="/" style={{ color: '#A5B4FC', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder, error }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; error?: string;
}) {
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === 'password';
  return (
    <div>
      <label className="block mb-1.5" style={{ color: '#CBD5E1', fontSize: '0.875rem', fontWeight: 500 }}>{label}</label>
      <div className="relative">
        <input
          type={isPassword ? (showPass ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl outline-none transition-all pr-12"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: `1.5px solid ${error ? '#EF4444' : 'rgba(255,255,255,0.18)'}`,
            color: '#F1F5F9',
            fontSize: '0.9rem',
          }}
          onFocus={e => (e.target.style.borderColor = '#6366F1')}
          onBlur={e => (e.target.style.borderColor = error ? '#EF4444' : 'rgba(255,255,255,0.18)')}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#64748B' }}>
            {showPass ? '👁️' : '🙈'}
          </button>
        )}
      </div>
      {error && <p className="mt-1" style={{ color: '#FCA5A5', fontSize: '0.78rem' }}>{error}</p>}
    </div>
  );
}