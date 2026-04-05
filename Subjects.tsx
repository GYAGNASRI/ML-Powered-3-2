import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStudent } from '../context/StudentContext';
import { Plus, X, Edit3, Check, BookOpen, TrendingUp, Award, Clock, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { AddSubjectModal } from '../components/AddSubjectModal';
import { EditSubjectModal } from '../components/EditSubjectModal';
import type { SubjectDef } from '../context/StudentContext';

const TIME_SLOTS = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Deterministic timetable generator based on subject list
function buildTimetable(subjects: { id: string; name: string; color: string; emoji: string }[]) {
  const table: Record<string, Record<string, { id: string; name: string; color: string; emoji: string } | null>> = {};
  DAYS_FULL.forEach((day, di) => {
    table[day] = {};
    TIME_SLOTS.forEach((slot, si) => {
      const idx = (di * TIME_SLOTS.length + si) % (subjects.length * 3);
      if (idx < subjects.length * 2 && (si < 2 || si > 3) && si !== 5) {
        table[day][slot] = subjects[idx % subjects.length];
      } else {
        table[day][slot] = null;
      }
    });
  });
  return table;
}

interface AddMarkModal {
  subjectId: string;
  type: 'assessment' | 'midterm';
}

export default function Subjects() {
  const { student, getSubjects, addMark, addCustomSubject, updateSubject, deleteSubject } = useStudent();
  const subjects = getSubjects();
  const [activeTab, setActiveTab] = useState<'cards' | 'timetable'>('cards');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [addMarkModal, setAddMarkModal] = useState<AddMarkModal | null>(null);
  const [markForm, setMarkForm] = useState({ marks: '', total: '100' });
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [addSubjectModal, setAddSubjectModal] = useState(false);
  const [editSubjectModal, setEditSubjectModal] = useState<SubjectDef | null>(null);

  const timetable = useMemo(() => buildTimetable(subjects), [subjects]);

  const getSubjectStats = (subjectId: string) => {
    if (!student) return { assessmentAvg: 0, midtermAvg: 0, overall: 0 };
    const assessments = student.marks.filter(m => m.subjectId === subjectId && m.type === 'assessment');
    const midterms = student.marks.filter(m => m.subjectId === subjectId && m.type === 'midterm');
    const assessmentAvg = assessments.length > 0
      ? Math.round(assessments.reduce((s, m) => s + (m.marks / m.total) * 100, 0) / assessments.length) : 0;
    const midtermAvg = midterms.length > 0
      ? Math.round(midterms.reduce((s, m) => s + (m.marks / m.total) * 100, 0) / midterms.length) : 0;
    const allMarks = [...assessments, ...midterms];
    const overall = allMarks.length > 0
      ? Math.round(allMarks.reduce((s, m) => s + (m.marks / m.total) * 100, 0) / allMarks.length) : 0;
    return { assessmentAvg, midtermAvg, overall };
  };

  const handleAddMark = () => {
    if (!addMarkModal || !markForm.marks) return;
    const marks = Number(markForm.marks);
    const total = Number(markForm.total);
    if (isNaN(marks) || isNaN(total) || marks > total || marks < 0 || total <= 0) {
      toast.error('Invalid marks. Please check your input.');
      return;
    }
    addMark({
      subjectId: addMarkModal.subjectId,
      marks,
      total,
      type: addMarkModal.type,
      date: new Date().toISOString(),
    });
    toast.success(`${addMarkModal.type === 'assessment' ? 'Assessment' : 'Midterm'} marks added!`);
    setAddMarkModal(null);
    setMarkForm({ marks: '', total: '100' });
  };

  if (!student) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 style={{ color: '#1E1B4B', fontWeight: 800, fontSize: '1.5rem' }}>📚 Subjects & Timetable</h1>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Manage your subjects, marks, and class schedule</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'cards' && (
            <button 
              onClick={() => setAddSubjectModal(true)}
              className="px-4 py-2 rounded-xl text-white flex items-center gap-2 transition-all hover:scale-105 text-sm"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)', fontWeight: 600 }}>
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          )}
          {['cards', 'timetable'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as 'cards' | 'timetable')}
              className="px-4 py-2 rounded-xl capitalize transition-all text-sm"
              style={{
                background: activeTab === tab ? '#6366F1' : '#F0F2FF',
                color: activeTab === tab ? '#FFFFFF' : '#6366F1',
                fontWeight: 600,
                border: '1px solid ' + (activeTab === tab ? '#6366F1' : '#E0E7FF'),
              }}>
              {tab === 'cards' ? '📋 Subjects' : '📅 Timetable'}
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'cards' && (
          <motion.div key="cards" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {/* Info Banner */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-2xl flex items-start gap-3"
              style={{ background: 'linear-gradient(135deg, #EDE9FE, #F0F9FF)', border: '1px solid #C7D2FE' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Pencil className="w-5 h-5" style={{ color: '#6366F1' }} />
              </div>
              <div className="flex-1">
                <h4 style={{ color: '#1E1B4B', fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>
                  ✨ Customize Your Learning Experience
                </h4>
                <p style={{ color: '#6B7280', fontSize: '0.8rem', lineHeight: 1.5 }}>
                  Click the <strong>pencil icon</strong> on any subject card to edit its name, emoji, and color. 
                  Use the <strong>\"Add Subject\"</strong> button above to create custom subjects for specialized topics or electives.
                </p>
              </div>
            </motion.div>

            {/* Subject Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {subjects.map((sub, i) => {
                const stats = getSubjectStats(sub.id);
                const isExpanded = expandedSubject === sub.id;
                const subMarks = student.marks.filter(m => m.subjectId === sub.id);
                return (
                  <motion.div key={sub.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-lg"
                    style={{ background: '#FFFFFF', border: `2px solid ${isExpanded ? sub.color : '#E8EAFF'}` }}
                    onClick={() => setExpandedSubject(isExpanded ? null : sub.id)}>

                    {/* Card Header */}
                    <div className="p-5" style={{ background: `linear-gradient(135deg, ${sub.color}15, ${sub.bg})` }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{ background: sub.bg, border: `2px solid ${sub.color}40` }}>
                          <span style={{ fontSize: '1.5rem' }}>{sub.emoji}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditSubjectModal(sub); }}
                            className="p-2 rounded-lg transition-all hover:scale-110"
                            style={{ background: 'rgba(99,102,241,0.1)' }}
                            title="Edit subject">
                            <Pencil className="w-3.5 h-3.5" style={{ color: '#6366F1' }} />
                          </button>
                          <div className="px-3 py-1 rounded-full" style={{
                            background: stats.overall >= 60 ? 'rgba(16,185,129,0.15)' : stats.overall >= 40 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                            color: stats.overall >= 60 ? '#10B981' : stats.overall >= 40 ? '#F59E0B' : '#EF4444',
                            fontSize: '0.75rem', fontWeight: 700
                          }}>
                            {stats.overall >= 60 ? '✓ Good' : stats.overall >= 40 ? '⚡ Average' : '⚠️ Weak'}
                          </div>
                        </div>
                      </div>
                      <h3 style={{ color: '#1E1B4B', fontWeight: 700, fontSize: '1rem' }}>{sub.name}</h3>
                      <div className="mt-2">
                        <div className="flex justify-between mb-1">
                          <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Overall</span>
                          <span style={{ color: sub.color, fontWeight: 700, fontSize: '0.875rem' }}>{stats.overall}%</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${stats.overall}%`, background: `linear-gradient(90deg, ${sub.color}, ${sub.color}80)` }} />
                        </div>
                      </div>
                    </div>

                    {/* Card Stats */}
                    <div className="px-5 pb-4 pt-3">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="rounded-xl p-3 text-center" style={{ background: '#F8F9FF' }}>
                          <div style={{ color: '#6366F1', fontWeight: 700 }}>{stats.assessmentAvg}%</div>
                          <div style={{ color: '#94A3B8', fontSize: '0.7rem' }}>Assessment</div>
                        </div>
                        <div className="rounded-xl p-3 text-center" style={{ background: '#F8F9FF' }}>
                          <div style={{ color: '#EC4899', fontWeight: 700 }}>{stats.midtermAvg}%</div>
                          <div style={{ color: '#94A3B8', fontSize: '0.7rem' }}>Midterm</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={e => { e.stopPropagation(); setAddMarkModal({ subjectId: sub.id, type: 'assessment' }); }}
                          className="flex-1 py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                          style={{ background: '#EDE9FE', color: '#6366F1', fontWeight: 600 }}>
                          <Plus className="w-3 h-3" /> Assessment
                        </button>
                        <button onClick={e => { e.stopPropagation(); setAddMarkModal({ subjectId: sub.id, type: 'midterm' }); }}
                          className="flex-1 py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                          style={{ background: '#FCE7F3', color: '#EC4899', fontWeight: 600 }}>
                          <Plus className="w-3 h-3" /> Midterm
                        </button>
                      </div>
                    </div>

                    {/* Expanded: Mark History */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                          style={{ borderTop: `1px solid ${sub.color}20` }}>
                          <div className="p-4">
                            <p className="mb-3" style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600 }}>MARK HISTORY</p>
                            {subMarks.length === 0 ? (
                              <p style={{ color: '#CBD5E1', fontSize: '0.8rem' }}>No marks recorded yet. Add your first mark above.</p>
                            ) : (
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {subMarks.slice(-6).reverse().map(m => (
                                  <div key={m.id} className="flex items-center justify-between p-2 rounded-lg"
                                    style={{ background: '#F8F9FF' }}>
                                    <span className="px-2 py-0.5 rounded text-xs"
                                      style={{ background: m.type === 'assessment' ? '#EDE9FE' : '#FCE7F3', color: m.type === 'assessment' ? '#6366F1' : '#EC4899' }}>
                                      {m.type === 'assessment' ? 'Assessment' : 'Midterm'}
                                    </span>
                                    <span style={{ color: '#374151', fontWeight: 600, fontSize: '0.875rem' }}>
                                      {m.marks}/{m.total} ({Math.round((m.marks / m.total) * 100)}%)
                                    </span>
                                    <span style={{ color: '#CBD5E1', fontSize: '0.7rem' }}>
                                      {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'timetable' && (
          <motion.div key="timetable" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E8EAFF' }}>
              {/* Legend */}
              <div className="p-4 flex flex-wrap gap-3" style={{ borderBottom: '1px solid #F0F2FF' }}>
                {subjects.map(s => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                    <span style={{ color: '#374151', fontSize: '0.75rem' }}>{s.emoji} {s.name}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#E5E7EB' }} />
                  <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Free / Break</span>
                </div>
              </div>

              {/* Timetable Grid */}
              <div className="overflow-x-auto">
                <table className="w-full" style={{ minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: '#F8F9FF' }}>
                      <th className="p-3 text-left" style={{ color: '#6B7280', fontSize: '0.8rem', width: 70 }}>Time</th>
                      {DAYS_SHORT.map(d => (
                        <th key={d} className="p-3 text-center" style={{ color: '#374151', fontWeight: 700, fontSize: '0.85rem' }}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((slot, si) => (
                      <tr key={slot} style={{ borderTop: '1px solid #F0F2FF' }}>
                        <td className="p-3" style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {slot} AM
                        </td>
                        {/* Break row */}
                        {si === 4 ? (
                          <td colSpan={6} className="p-3 text-center"
                            style={{ background: '#FEF9C3', color: '#CA8A04', fontSize: '0.8rem', fontWeight: 600 }}>
                            🍽️ Lunch Break (12:00 – 13:00)
                          </td>
                        ) : (
                          DAYS_FULL.map(day => {
                            const cell = timetable[day]?.[slot];
                            return (
                              <td key={day} className="p-2">
                                {cell ? (
                                  <div className="rounded-xl p-2 text-center transition-all hover:scale-105"
                                    style={{ background: (cell as any).bg, border: `1px solid ${(cell as any).color}30` }}>
                                    <div style={{ fontSize: '1rem' }}>{cell.emoji}</div>
                                    <div style={{ color: cell.color, fontSize: '0.65rem', fontWeight: 700, lineHeight: 1.3 }}>
                                      {cell.name.length > 10 ? cell.name.slice(0, 10) + '…' : cell.name}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="rounded-xl p-2 text-center" style={{ background: '#F8F9FF' }}>
                                    <div style={{ color: '#E5E7EB', fontSize: '0.65rem' }}>—</div>
                                  </div>
                                )}
                              </td>
                            );
                          })
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Mark Modal */}
      <AnimatePresence>
        {addMarkModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-3xl p-8" style={{ background: '#FFFFFF' }}>
              {(() => {
                const sub = subjects.find(s => s.id === addMarkModal.subjectId);
                return (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: sub?.bg }}>
                          <span style={{ fontSize: '1.5rem' }}>{sub?.emoji}</span>
                        </div>
                        <div>
                          <h3 style={{ color: '#1E1B4B', fontWeight: 700 }}>Add {addMarkModal.type === 'assessment' ? 'Assessment' : 'Midterm'} Marks</h3>
                          <p style={{ color: '#94A3B8', fontSize: '0.8rem' }}>{sub?.name}</p>
                        </div>
                      </div>
                      <button onClick={() => setAddMarkModal(null)}
                        className="p-2 rounded-xl" style={{ background: '#F3F4F6' }}>
                        <X className="w-5 h-5" style={{ color: '#6B7280' }} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2" style={{ color: '#374151', fontSize: '0.875rem', fontWeight: 600 }}>Marks Obtained</label>
                        <input
                          type="number" value={markForm.marks}
                          onChange={e => setMarkForm(f => ({ ...f, marks: e.target.value }))}
                          placeholder="e.g. 78"
                          className="w-full px-4 py-3 rounded-xl outline-none"
                          style={{ background: '#F8F9FF', border: '1px solid #E0E7FF', color: '#1E1B4B', fontSize: '1rem' }}
                        />
                      </div>
                      <div>
                        <label className="block mb-2" style={{ color: '#374151', fontSize: '0.875rem', fontWeight: 600 }}>Total Marks</label>
                        <input
                          type="number" value={markForm.total}
                          onChange={e => setMarkForm(f => ({ ...f, total: e.target.value }))}
                          placeholder="e.g. 100"
                          className="w-full px-4 py-3 rounded-xl outline-none"
                          style={{ background: '#F8F9FF', border: '1px solid #E0E7FF', color: '#1E1B4B', fontSize: '1rem' }}
                        />
                      </div>
                      {markForm.marks && markForm.total && (
                        <div className="p-3 rounded-xl" style={{ background: '#F0F2FF' }}>
                          <span style={{ color: '#6366F1', fontWeight: 600 }}>
                            Percentage: {Math.round((Number(markForm.marks) / Number(markForm.total)) * 100)}%
                          </span>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <button onClick={() => setAddMarkModal(null)}
                          className="flex-1 py-3 rounded-xl"
                          style={{ background: '#F3F4F6', color: '#6B7280', fontWeight: 600 }}>
                          Cancel
                        </button>
                        <button onClick={handleAddMark}
                          className="flex-1 py-3 rounded-xl text-white flex items-center justify-center gap-2"
                          style={{ background: `linear-gradient(135deg, ${sub?.color}, ${sub?.color}88)`, fontWeight: 600 }}>
                          <Check className="w-4 h-4" /> Add Marks
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Subject Modal */}
      <AddSubjectModal 
        isOpen={addSubjectModal} 
        onClose={() => setAddSubjectModal(false)}
        onAdd={(subj) => {
          addCustomSubject(subj);
        }}
        existingNames={subjects.map(s => s.name)}
      />

      {/* Edit Subject Modal */}
      <EditSubjectModal 
        isOpen={editSubjectModal !== null} 
        onClose={() => setEditSubjectModal(null)} 
        subject={editSubjectModal}
        onSave={(data) => {
          if (editSubjectModal) {
            updateSubject(editSubjectModal.id, data);
          }
        }}
        existingNames={subjects.map(s => s.name)}
      />
    </div>
  );
}