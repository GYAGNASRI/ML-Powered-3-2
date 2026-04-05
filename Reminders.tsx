import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStudent } from '../context/StudentContext';
import { Bell, Plus, X, Trash2, Clock, Calendar, ChevronLeft, ChevronRight, BellOff, BellRing, Check, Repeat } from 'lucide-react';
import { toast } from 'sonner';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const REPEAT_OPTIONS = [
  { value: 'none', label: 'No Repeat', icon: '🔕' },
  { value: 'daily', label: 'Daily', icon: '📅' },
  { value: 'weekly', label: 'Weekly', icon: '🗓️' },
];

function requestNotificationPermission() {
  if ('Notification' in window) {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        toast.success('Push notifications enabled! You\'ll be notified before study sessions.');
      } else {
        toast.error('Notification permission denied. Please enable it in browser settings.');
      }
    });
  } else {
    toast.error('Your browser doesn\'t support push notifications.');
  }
}

function scheduleNotification(reminder: { title: string; date: string; time: string }) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const [hours, minutes] = reminder.time.split(':').map(Number);
  const notifDate = new Date(reminder.date);
  notifDate.setHours(hours, minutes - 10, 0, 0); // 10 min before
  const now = new Date();
  const delay = notifDate.getTime() - now.getTime();
  if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
    setTimeout(() => {
      new Notification('📚 EduPredict Study Reminder', {
        body: `${reminder.title} starts in 10 minutes!`,
        icon: '/favicon.ico',
      });
    }, delay);
  }
}

export default function Reminders() {
  const { student, getSubjects, addReminder, removeReminder, updateReminder } = useStudent();
  const subjects = getSubjects();
  const today = new Date();

  const [viewDate, setViewDate] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(Notification.permission === 'granted');
  const [form, setForm] = useState({
    subjectId: subjects[0]?.id || '',
    title: '',
    date: today.toISOString().split('T')[0],
    time: '09:00',
    note: '',
    repeat: 'none' as 'none' | 'daily' | 'weekly',
  });

  const remindersOnDate = useMemo(() => {
    if (!student) return [];
    return student.reminders.filter(r => r.date === selectedDate);
  }, [student, selectedDate]);

  const reminderDates = useMemo(() => {
    if (!student) return new Set<string>();
    return new Set(student.reminders.map(r => r.date));
  }, [student]);

  const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
  const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month);

  const prevMonth = () => {
    setViewDate(d => d.month === 0 ? { year: d.year - 1, month: 11 } : { ...d, month: d.month - 1 });
  };
  const nextMonth = () => {
    setViewDate(d => d.month === 11 ? { year: d.year + 1, month: 0 } : { ...d, month: d.month + 1 });
  };

  const handleAddReminder = () => {
    if (!form.title.trim() || !form.subjectId) {
      toast.error('Please fill in all required fields.');
      return;
    }
    const sub = subjects.find(s => s.id === form.subjectId);
    addReminder({
      ...form,
      color: sub?.color || '#6366F1',
      notified: false,
    });
    if (notifEnabled) scheduleNotification(form);
    toast.success('Reminder added successfully! 🔔');
    setShowAddModal(false);
    setSelectedDate(form.date);
    setForm(f => ({ ...f, title: '', note: '' }));
  };

  const handleToggleNotifications = () => {
    if (!notifEnabled) {
      requestNotificationPermission();
      setNotifEnabled(true);
    } else {
      setNotifEnabled(false);
      toast.info('Push notifications disabled.');
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = new Date(today.getTime() + 86400000).toISOString().split('T')[0];
    if (dateStr === todayStr) return 'Today';
    if (dateStr === tomorrowStr) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const upcomingReminders = useMemo(() => {
    if (!student) return [];
    return student.reminders
      .filter(r => r.date >= today.toISOString().split('T')[0])
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .slice(0, 10);
  }, [student]);

  if (!student) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ color: '#1E1B4B', fontWeight: 800, fontSize: '1.5rem' }}>🔔 Study Reminders</h1>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Calendar view with push notifications</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleToggleNotifications}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
            style={{
              background: notifEnabled ? 'rgba(16,185,129,0.1)' : '#F0F2FF',
              color: notifEnabled ? '#10B981' : '#94A3B8',
              border: `1px solid ${notifEnabled ? 'rgba(16,185,129,0.3)' : '#E0E7FF'}`,
              fontWeight: 600
            }}>
            {notifEnabled ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            {notifEnabled ? 'Notifications On' : 'Enable Notifications'}
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', fontWeight: 600 }}>
            <Plus className="w-4 h-4" /> Add Reminder
          </button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E8EAFF' }}>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-2 rounded-xl transition-all" style={{ background: '#F0F2FF' }}>
              <ChevronLeft className="w-5 h-5" style={{ color: '#6366F1' }} />
            </button>
            <h3 style={{ color: '#1E1B4B', fontWeight: 700, fontSize: '1.1rem' }}>
              {MONTHS[viewDate.month]} {viewDate.year}
            </h3>
            <button onClick={nextMonth} className="p-2 rounded-xl transition-all" style={{ background: '#F0F2FF' }}>
              <ChevronRight className="w-5 h-5" style={{ color: '#6366F1' }} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center py-2" style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600 }}>{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === today.toISOString().split('T')[0];
              const isSelected = dateStr === selectedDate;
              const hasReminder = reminderDates.has(dateStr);
              const remindersForDay = student.reminders.filter(r => r.date === dateStr);

              return (
                <button key={day} onClick={() => setSelectedDate(dateStr)}
                  className="aspect-square flex flex-col items-center justify-center rounded-xl transition-all relative p-1"
                  style={{
                    background: isSelected ? '#6366F1' : isToday ? '#EDE9FE' : hasReminder ? '#F0F2FF' : 'transparent',
                    border: isToday && !isSelected ? '2px solid #6366F1' : '2px solid transparent',
                  }}>
                  <span style={{
                    color: isSelected ? '#FFFFFF' : isToday ? '#6366F1' : '#374151',
                    fontWeight: isSelected || isToday ? 700 : 400,
                    fontSize: '0.875rem',
                  }}>{day}</span>
                  {hasReminder && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {remindersForDay.slice(0, 3).map((r, ri) => (
                        <div key={ri} className="w-1.5 h-1.5 rounded-full"
                          style={{ background: isSelected ? 'rgba(255,255,255,0.7)' : r.color }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Reminders */}
          <div className="mt-6" style={{ borderTop: '1px solid #F0F2FF', paddingTop: 20 }}>
            <div className="flex items-center justify-between mb-4">
              <h4 style={{ color: '#1E1B4B', fontWeight: 700 }}>
                {formatDateLabel(selectedDate)}
              </h4>
              <button onClick={() => { setForm(f => ({ ...f, date: selectedDate })); setShowAddModal(true); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
                style={{ background: '#EDE9FE', color: '#6366F1', fontWeight: 600 }}>
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            {remindersOnDate.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center" style={{ color: '#CBD5E1' }}>
                <Calendar className="w-10 h-10 mb-2" style={{ color: '#DDD6FE' }} />
                <p style={{ fontSize: '0.875rem' }}>No reminders for this day</p>
                <p style={{ fontSize: '0.75rem', marginTop: 4 }}>Click "Add" to schedule a study session</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {remindersOnDate.map(r => {
                    const sub = subjects.find(s => s.id === r.subjectId);
                    return (
                      <motion.div key={r.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3 p-4 rounded-xl"
                        style={{ background: `${r.color}10`, border: `1px solid ${r.color}30` }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${r.color}25` }}>
                          <span style={{ fontSize: '1.2rem' }}>{sub?.emoji || '📚'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div style={{ color: '#1E1B4B', fontWeight: 600, fontSize: '0.9rem' }}>{r.title}</div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1" style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                              <Clock className="w-3 h-3" /> {r.time}
                            </span>
                            {r.repeat !== 'none' && (
                              <span className="flex items-center gap-1" style={{ color: r.color, fontSize: '0.75rem' }}>
                                <Repeat className="w-3 h-3" /> {r.repeat}
                              </span>
                            )}
                          </div>
                          {r.note && <p style={{ color: '#94A3B8', fontSize: '0.75rem', marginTop: 2 }}>{r.note}</p>}
                        </div>
                        <button onClick={() => { removeReminder(r.id); toast.success('Reminder removed'); }}
                          className="p-2 rounded-lg transition-all"
                          style={{ color: '#EF4444' }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>

        {/* Upcoming Reminders Sidebar */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="space-y-4">
          {/* Notification Status */}
          <div className="rounded-2xl p-5" style={{ background: notifEnabled ? 'rgba(16,185,129,0.05)' : '#FFFFFF', border: `1px solid ${notifEnabled ? 'rgba(16,185,129,0.3)' : '#E8EAFF'}` }}>
            <div className="flex items-center gap-3 mb-2">
              {notifEnabled ? <BellRing className="w-5 h-5 text-emerald-500" /> : <BellOff className="w-5 h-5" style={{ color: '#94A3B8' }} />}
              <span style={{ color: '#1E1B4B', fontWeight: 600, fontSize: '0.9rem' }}>
                {notifEnabled ? 'Notifications Active' : 'Notifications Off'}
              </span>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.75rem', lineHeight: 1.5 }}>
              {notifEnabled
                ? 'You\'ll receive browser notifications 10 minutes before scheduled study sessions.'
                : 'Enable notifications to get reminded 10 minutes before your study sessions start.'}
            </p>
          </div>

          {/* Upcoming List */}
          <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E8EAFF' }}>
            <h4 className="mb-4" style={{ color: '#1E1B4B', fontWeight: 700 }}>Upcoming Sessions</h4>
            {upcomingReminders.length === 0 ? (
              <p style={{ color: '#CBD5E1', fontSize: '0.8rem', textAlign: 'center', padding: '16px 0' }}>No upcoming reminders</p>
            ) : (
              <div className="space-y-3">
                {upcomingReminders.map(r => {
                  const sub = subjects.find(s => s.id === r.subjectId);
                  const dateD = new Date(r.date + 'T12:00:00');
                  const todayStr = today.toISOString().split('T')[0];
                  const isToday = r.date === todayStr;
                  return (
                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: `${r.color}08`, border: `1px solid ${r.color}20` }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                      <div className="flex-1 min-w-0">
                        <div style={{ color: '#374151', fontWeight: 600, fontSize: '0.8rem' }} className="truncate">{r.title}</div>
                        <div style={{ color: '#94A3B8', fontSize: '0.7rem' }}>
                          {isToday ? '📍 Today' : dateD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {r.time}
                        </div>
                      </div>
                      <span style={{ fontSize: '1rem' }}>{sub?.emoji}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subject Quick Add */}
          <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E8EAFF' }}>
            <h4 className="mb-3" style={{ color: '#1E1B4B', fontWeight: 700 }}>Quick Add by Subject</h4>
            <div className="grid grid-cols-2 gap-2">
              {subjects.slice(0, 6).map(sub => (
                <button key={sub.id}
                  onClick={() => { setForm(f => ({ ...f, subjectId: sub.id, title: `Study ${sub.name}`, date: selectedDate })); setShowAddModal(true); }}
                  className="p-2.5 rounded-xl flex items-center gap-2 transition-all hover:scale-105"
                  style={{ background: sub.bg, border: `1px solid ${sub.color}30` }}>
                  <span style={{ fontSize: '0.9rem' }}>{sub.emoji}</span>
                  <span style={{ color: sub.color, fontSize: '0.7rem', fontWeight: 600 }} className="truncate">{sub.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Add Reminder Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-3xl p-8" style={{ background: '#FFFFFF' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <h3 style={{ color: '#1E1B4B', fontWeight: 700 }}>Add Study Reminder</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl" style={{ background: '#F3F4F6' }}>
                  <X className="w-5 h-5" style={{ color: '#6B7280' }} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2" style={{ color: '#374151', fontWeight: 600, fontSize: '0.875rem' }}>Subject *</label>
                  <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                    {subjects.map(sub => (
                      <button key={sub.id} onClick={() => setForm(f => ({ ...f, subjectId: sub.id }))}
                        className="p-2 rounded-xl flex flex-col items-center gap-1 transition-all"
                        style={{
                          background: form.subjectId === sub.id ? sub.bg : '#F8F9FF',
                          border: `2px solid ${form.subjectId === sub.id ? sub.color : 'transparent'}`,
                        }}>
                        <span style={{ fontSize: '1rem' }}>{sub.emoji}</span>
                        <span style={{ color: form.subjectId === sub.id ? sub.color : '#94A3B8', fontSize: '0.6rem', fontWeight: 600, textAlign: 'center' }}>
                          {sub.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block mb-2" style={{ color: '#374151', fontWeight: 600, fontSize: '0.875rem' }}>Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Chapter 5 Revision"
                    className="w-full px-4 py-3 rounded-xl outline-none"
                    style={{ background: '#F8F9FF', border: '1px solid #E0E7FF', color: '#1E1B4B' }} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-2" style={{ color: '#374151', fontWeight: 600, fontSize: '0.875rem' }}>Date *</label>
                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full px-3 py-3 rounded-xl outline-none"
                      style={{ background: '#F8F9FF', border: '1px solid #E0E7FF', color: '#1E1B4B', fontSize: '0.875rem' }} />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ color: '#374151', fontWeight: 600, fontSize: '0.875rem' }}>Time *</label>
                    <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                      className="w-full px-3 py-3 rounded-xl outline-none"
                      style={{ background: '#F8F9FF', border: '1px solid #E0E7FF', color: '#1E1B4B', fontSize: '0.875rem' }} />
                  </div>
                </div>

                <div>
                  <label className="block mb-2" style={{ color: '#374151', fontWeight: 600, fontSize: '0.875rem' }}>Repeat</label>
                  <div className="flex gap-2">
                    {REPEAT_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setForm(f => ({ ...f, repeat: opt.value as 'none' | 'daily' | 'weekly' }))}
                        className="flex-1 py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                        style={{
                          background: form.repeat === opt.value ? '#EDE9FE' : '#F8F9FF',
                          border: `1px solid ${form.repeat === opt.value ? '#6366F1' : '#E0E7FF'}`,
                          color: form.repeat === opt.value ? '#6366F1' : '#94A3B8',
                          fontWeight: form.repeat === opt.value ? 600 : 400
                        }}>
                        <span>{opt.icon}</span> {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block mb-2" style={{ color: '#374151', fontWeight: 600, fontSize: '0.875rem' }}>Note (Optional)</label>
                  <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="e.g. Focus on important theorems..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl outline-none resize-none"
                    style={{ background: '#F8F9FF', border: '1px solid #E0E7FF', color: '#1E1B4B', fontSize: '0.875rem' }} />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 rounded-xl"
                    style={{ background: '#F3F4F6', color: '#6B7280', fontWeight: 600 }}>
                    Cancel
                  </button>
                  <button onClick={handleAddReminder}
                    className="flex-1 py-3 rounded-xl text-white flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', fontWeight: 600 }}>
                    <Bell className="w-4 h-4" /> Set Reminder
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
