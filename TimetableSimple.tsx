import React, { useState } from 'react';
import { useStudent, SubjectDef, Timetable as TimetableType } from '../context/StudentContext';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Sparkles, X, Target, Trophy, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { SchedulingInsights } from '../components/SchedulingInsights';
import { PersonalizedGenerator } from '../components/PersonalizedGenerator';

type TemplateMode = 'regular' | 'exam' | 'light';

interface GeneratorConfig {
  mode: TemplateMode;
  dailyHours: number;
  startTime: string;
  endTime: string;
  studyDays: string[];
  subjectPriorities: Record<string, 'low' | 'medium' | 'high'>;
  examDates: Record<string, string>;
  sessionLength: number;
  includeWeekends: boolean;
}

export default function TimetableSimple() {
  const {
    student,
    getSubjects,
    updateSubject,
    getTimetable,
    updateTimetableCell,
    setCustomTimeSlots,
    setStudyGoal,
    getStudyGoals,
  } = useStudent();

  const [showGenerator, setShowGenerator] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMode>('regular');
  const [generatorStep, setGeneratorStep] = useState(1);
  
  const [config, setConfig] = useState<GeneratorConfig>({
    mode: 'regular',
    dailyHours: student?.studyHoursPerDay || 4,
    startTime: '08:00',
    endTime: '18:00',
    studyDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    subjectPriorities: {},
    examDates: {},
    sessionLength: 60,
    includeWeekends: false,
  });

  const [generatedTimetable, setGeneratedTimetable] = useState<TimetableType | null>(null);
  const [subjectInterests, setSubjectInterests] = useState<Record<string, number>>({});
  const [availableTimePerDay, setAvailableTimePerDay] = useState<Record<string, number>>({});

  const subjects = getSubjects();
  const timetable = getTimetable();
  const studyGoals = getStudyGoals() || [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Ensure timetable has proper defaults
  const timeSlots = timetable?.timeSlots || ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const schedule = timetable?.schedule || {};

  // Debug logging
  console.log('Current timetable:', timetable);
  console.log('Time slots:', timeSlots);
  console.log('Schedule:', schedule);

  // Template definitions
  const templates = {
    regular: {
      name: 'Regular Week',
      description: 'Balanced study schedule with regular breaks',
      icon: Calendar,
      color: '#6366F1',
      dailyHours: 4,
      intensity: 'medium',
    },
    exam: {
      name: 'Exam Week',
      description: 'Intensive study schedule for exam preparation',
      icon: Zap,
      color: '#EF4444',
      dailyHours: 6,
      intensity: 'high',
    },
    light: {
      name: 'Light Mode',
      description: 'Reduced intensity for recovery or low-stress weeks',
      icon: Target,
      color: '#10B981',
      dailyHours: 2,
      intensity: 'low',
    },
  };

  // Smart Timetable Generation Algorithm - Focused on Study Goals
  const generateSmartTimetable = (customInterests?: Record<string, number>, customAvailableTime?: Record<string, number>) => {
    toast.loading('🧠 Analyzing your interests and creating personalized plan...', { id: 'generating' });

    const { mode, dailyHours, startTime, endTime, studyDays, subjectPriorities, examDates, sessionLength, includeWeekends } = config;

    // Adjust parameters based on template mode
    let effectiveDailyHours = dailyHours;
    let breakFrequency = 2;
    
    if (mode === 'exam') {
      effectiveDailyHours = Math.max(dailyHours, 6);
      breakFrequency = 1.5;
    } else if (mode === 'light') {
      effectiveDailyHours = Math.min(dailyHours, 3);
      breakFrequency = 1;
    }

    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    const sessionsPerDay = Math.floor((effectiveDailyHours * 60) / sessionLength);

    const timeSlots: string[] = [];
    for (let i = 0; i < (endHour - startHour); i++) {
      const hour = startHour + i;
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }

    // Calculate subject weights based on INTERESTS, goals, performance, and deadlines
    const today = new Date();
    const subjectWeights: Record<string, number> = {};
    const subjectDifficulty: Record<string, number> = {};

    subjects.forEach(sub => {
      let weight = 1;
      let difficulty = 1;

      // INTEREST WEIGHT - This is the key personalization factor!
      const interest = customInterests ? customInterests[sub.id] : (subjectInterests[sub.id] || 3);
      weight += interest * 1.5; // High interest (5) gets +7.5, Low (1) gets +1.5

      // Study goal weight - subjects with higher goals get more time
      const goal = studyGoals.find(g => g.subjectId === sub.id);
      if (goal && goal.weeklyHours > 0) {
        weight += goal.weeklyHours / 2; // More weight for subjects with higher weekly goals
      }

      // Priority weight
      const priority = subjectPriorities[sub.id] || sub.priority || 'medium';
      if (priority === 'high') {
        weight += (mode === 'exam' ? 3 : 2);
        difficulty += 1.5;
      } else if (priority === 'medium') {
        weight += 1;
        difficulty += 0.5;
      }

      // Exam urgency weight
      const examDate = examDates[sub.id] || sub.examDate;
      if (examDate) {
        const daysUntilExam = Math.ceil((new Date(examDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const urgencyMultiplier = mode === 'exam' ? 2 : 1;
        
        if (daysUntilExam <= 3) weight += (5 * urgencyMultiplier);
        else if (daysUntilExam <= 7) weight += (3 * urgencyMultiplier);
        else if (daysUntilExam <= 14) weight += (2 * urgencyMultiplier);
        else if (daysUntilExam <= 30) weight += urgencyMultiplier;
      }

      // Performance-based adjustment
      if (student) {
        const subjectMarks = student.marks.filter(m => m.subjectId === sub.id);
        if (subjectMarks.length > 0) {
          const avg = subjectMarks.reduce((sum, m) => sum + (m.marks / m.total) * 100, 0) / subjectMarks.length;
          
          if (avg < 60) {
            weight += 2;
            difficulty += 1;
          } else if (avg < 75) {
            weight += 1;
            difficulty += 0.5;
          }
        }
      }

      subjectWeights[sub.id] = weight;
      subjectDifficulty[sub.id] = difficulty;
    });

    // Sort subjects by weight
    const sortedSubjects = [...subjects].sort((a, b) => 
      (subjectWeights[b.id] || 0) - (subjectWeights[a.id] || 0)
    );

    // Optimal time slot selection based on difficulty
    const getOptimalSubjectsForTimeSlot = (hour: number): SubjectDef[] => {
      if (hour >= 8 && hour < 11) {
        return sortedSubjects.filter(s => subjectDifficulty[s.id] >= 1.5);
      } else if (hour >= 14 && hour < 17) {
        return sortedSubjects.filter(s => subjectDifficulty[s.id] >= 0.5 && subjectDifficulty[s.id] < 1.5);
      } else {
        return sortedSubjects.filter(s => subjectDifficulty[s.id] < 1);
      }
    };

    // Subject rotation for interleaving
    const subjectRotation: Record<string, number> = {};
    subjects.forEach(sub => subjectRotation[sub.id] = 0);

    // Generate schedule
    const schedule: TimetableType['schedule'] = {};
    
    days.forEach(day => {
      schedule[day] = {};
      
      // Check if this day has available time
      const dayAvailableHours = customAvailableTime ? customAvailableTime[day] : (availableTimePerDay[day] || 0);
      const daySessionCount = Math.floor(dayAvailableHours);
      
      if (dayAvailableHours === 0 || (!studyDays.includes(day) && !includeWeekends)) {
        timeSlots.forEach(time => {
          schedule[day][time] = null;
        });
        return;
      }

      let slotIndex = 0;
      let consecutiveSessions = 0;
      let lastAssignedSubject: string | null = null;

      timeSlots.forEach((time) => {
        const hour = parseInt(time.split(':')[0]);

        // Add strategic breaks
        if (consecutiveSessions > 0 && consecutiveSessions >= breakFrequency) {
          schedule[day][time] = null;
          consecutiveSessions = 0;
          lastAssignedSubject = null;
          return;
        }

        // Assign subjects based on available hours for this day
        if (slotIndex < daySessionCount) {
          const optimalSubjects = getOptimalSubjectsForTimeSlot(hour);
          let selectedSubject: SubjectDef | null = null;

          if (optimalSubjects.length > 0) {
            selectedSubject = optimalSubjects.reduce((min, sub) => 
              subjectRotation[sub.id] < subjectRotation[min.id] ? sub : min
            );
          } else {
            selectedSubject = sortedSubjects[0];
          }

          // Avoid consecutive same subjects
          if (selectedSubject && selectedSubject.id === lastAssignedSubject && sortedSubjects.length > 1) {
            const alternatives = sortedSubjects.filter(s => s.id !== lastAssignedSubject);
            if (alternatives.length > 0) {
              selectedSubject = alternatives[0];
            }
          }

          if (selectedSubject) {
            schedule[day][time] = {
              subjectId: selectedSubject.id,
              type: 'study',
            };
            subjectRotation[selectedSubject.id]++;
            lastAssignedSubject = selectedSubject.id;
            slotIndex++;
            consecutiveSessions++;
          } else {
            schedule[day][time] = null;
          }
        } else {
          schedule[day][time] = null;
        }
      });
    });

    const generated: TimetableType = {
      timeSlots,
      schedule,
    };

    setGeneratedTimetable(generated);
    toast.dismiss('generating');
    toast.success(`✨ ${templates[mode].name} schedule created based on your interests!`, { duration: 3000 });
    
    // Auto-apply the generated schedule
    setTimeout(() => {
      applyGeneratedSchedule(generated);
    }, 500);
  };

  const applyGeneratedSchedule = (generated: TimetableType) => {
    console.log('Applying schedule...', generated);
    setCustomTimeSlots(generated.timeSlots);

    days.forEach(day => {
      generated.timeSlots.forEach(time => {
        const cell = generated.schedule[day]?.[time];
        updateTimetableCell(day, time, cell?.subjectId || null, cell?.type);
      });
    });

    // Update subject data
    Object.entries(config.examDates).forEach(([subjectId, date]) => {
      updateSubject(subjectId, { examDate: date });
    });
    Object.entries(config.subjectPriorities).forEach(([subjectId, priority]) => {
      updateSubject(subjectId, { priority });
    });

    setShowGenerator(false);
    setGeneratedTimetable(null);
    toast.success('Timetable applied successfully! 🎉');
  };

  const getSubjectById = (id: string): SubjectDef | undefined => {
    return subjects.find(s => s.id === id);
  };

  const getGoalProgress = (subjectId: string) => {
    const goal = studyGoals.find(g => g.subjectId === subjectId);
    if (!goal) return null;
    
    if (!goal.weeklyHours || goal.weeklyHours === 0) {
      return { ...goal, percentage: 0 };
    }
    
    const percentage = (goal.currentProgress / goal.weeklyHours) * 100;
    return { ...goal, percentage: Math.min(percentage, 100) };
  };

  // Calculate total weekly study hours from goals
  const totalWeeklyGoalHours = studyGoals.reduce((sum, goal) => sum + goal.weeklyHours, 0);
  const totalCurrentProgress = studyGoals.reduce((sum, goal) => sum + goal.currentProgress, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: '#1F2937' }}>
              My Study Timetable
            </h1>
            <p className="text-base" style={{ color: '#9CA3AF' }}>
              Personalized to your interests and goals
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#A855F7' }}>
              {student?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <span className="font-medium" style={{ color: '#1F2937' }}>
              {student?.name || 'Student'}
            </span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowGoalsModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 font-semibold hover:shadow-md transition-all"
            style={{ borderColor: '#10B981', color: '#10B981', backgroundColor: '#D1FAE5' }}
          >
            <Target className="w-5 h-5" />
            Set Study Goals
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold shadow-md hover:shadow-lg transition-all"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            <Sparkles className="w-5 h-5" />
            Generate Personalized Schedule
          </motion.button>
        </div>
      </motion.div>

      {/* Template Selection */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(Object.keys(templates) as TemplateMode[]).map((templateKey) => {
          const template = templates[templateKey];
          const Icon = template.icon;
          const isSelected = selectedTemplate === templateKey;
          
          return (
            <motion.button
              key={templateKey}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedTemplate(templateKey);
                setConfig({ ...config, mode: templateKey });
              }}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                isSelected ? 'shadow-xl' : ''
              }`}
              style={{
                backgroundColor: isSelected ? `${template.color}15` : '#FFFFFF',
                borderColor: isSelected ? template.color : '#E5E7EB',
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: `${template.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: template.color }} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg" style={{ color: '#1F2937' }}>
                    {template.name}
                  </div>
                  <div className="text-sm" style={{ color: '#6B7280' }}>
                    {template.dailyHours}h/day • {template.intensity} intensity
                  </div>
                </div>
                {isSelected && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: template.color }}
                  >
                    ✓
                  </div>
                )}
              </div>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>
                {template.description}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Study Goals Overview */}
      {studyGoals.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-xl border-2"
          style={{ borderColor: '#E5E7EB' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6" style={{ color: '#F59E0B' }} />
              <div>
                <h3 className="text-xl font-bold" style={{ color: '#1F2937' }}>
                  Weekly Study Goals
                </h3>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Total: {totalCurrentProgress.toFixed(1)}h / {totalWeeklyGoalHours}h per week
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGoalsModal(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#FFFFFF', color: '#6366F1', border: '2px solid #6366F1' }}
            >
              Edit Goals
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {subjects.slice(0, 6).map(subject => {
              const progress = getGoalProgress(subject.id);
              if (!progress) return null;
              
              return (
                <div key={subject.id} className="p-4 rounded-xl bg-white shadow-sm" style={{ border: `2px solid ${subject.color}20` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-2xl">{subject.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate" style={{ color: subject.color }}>
                        {subject.name}
                      </div>
                      <div className="text-xs font-medium" style={{ color: '#6B7280' }}>
                        {progress.currentProgress.toFixed(1)}h / {progress.weeklyHours}h
                      </div>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.percentage}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                  </div>
                  <div className="text-right text-xs font-bold mt-1" style={{ color: subject.color }}>
                    {progress.percentage.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Timetable Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-xl p-6 border-2"
        style={{ borderColor: '#E5E7EB' }}
      >
        <div className="mb-4">
          <h2 className="text-xl font-bold" style={{ color: '#1F2937' }}>Your Schedule</h2>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>Organized by subjects based on your preferences</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-left font-bold" style={{ color: '#6B7280', backgroundColor: '#F9FAFB' }}>
                  Time
                </th>
                {days.map(day => (
                  <th key={day} className="p-3 text-center font-bold" style={{ color: '#6B7280', backgroundColor: '#F9FAFB' }}>
                    {day.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time, idx) => (
                <tr key={time} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-3 font-semibold" style={{ color: '#4B5563' }}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                      {time}
                    </div>
                  </td>
                  {days.map(day => {
                    const cell = schedule[day]?.[time];
                    const subject = cell ? getSubjectById(cell.subjectId) : null;

                    return (
                      <td key={`${day}-${time}`} className="p-2">
                        {cell && subject ? (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="p-3 rounded-xl text-center cursor-pointer shadow-sm"
                            style={{ backgroundColor: subject.bg, border: `2px solid ${subject.color}40` }}
                          >
                            <div className="text-2xl mb-1">{subject.emoji}</div>
                            <div className="text-xs font-bold" style={{ color: subject.color }}>
                              {subject.name}
                            </div>
                          </motion.div>
                        ) : (
                          <div className="p-3 rounded-xl text-center" style={{ backgroundColor: '#F9FAFB' }}>
                            <div className="text-xs font-medium" style={{ color: '#D1D5DB' }}>
                              Free
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Study Goals Modal */}
      <AnimatePresence>
        {showGoalsModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowGoalsModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-4 md:inset-20 bg-white rounded-3xl shadow-2xl z-50 p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: '#D1FAE5' }}>
                    <Target className="w-7 h-7" style={{ color: '#10B981' }} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                      Set Weekly Study Goals
                    </h2>
                    <p className="text-sm" style={{ color: '#6B7280' }}>
                      Define how many hours you want to dedicate to each subject
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowGoalsModal(false)} className="p-2 rounded-xl hover:bg-gray-100">
                  <X className="w-6 h-6" style={{ color: '#6B7280' }} />
                </button>
              </div>

              <div className="space-y-3">
                {subjects.map(subject => {
                  const goal = studyGoals.find(g => g.subjectId === subject.id);
                  return (
                    <div
                      key={subject.id}
                      className="flex items-center gap-4 p-5 rounded-2xl border-2 hover:shadow-md transition-all"
                      style={{ borderColor: `${subject.color}30`, backgroundColor: subject.bg }}
                    >
                      <div className="text-3xl">{subject.emoji}</div>
                      <div className="flex-1">
                        <div className="font-bold text-lg" style={{ color: '#1F2937' }}>
                          {subject.name}
                        </div>
                        <div className="text-sm" style={{ color: '#6B7280' }}>
                          Current progress: {goal ? `${goal.currentProgress.toFixed(1)}h` : '0h'}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          defaultValue={goal?.weeklyHours || 0}
                          onChange={(e) => {
                            const hours = parseFloat(e.target.value) || 0;
                            setStudyGoal(subject.id, hours);
                          }}
                          className="w-24 px-4 py-3 rounded-xl border-2 text-center font-bold text-lg"
                          style={{ borderColor: subject.color, color: subject.color }}
                          placeholder="0"
                        />
                        <span className="text-sm font-medium" style={{ color: '#6B7280' }}>hours/week</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowGoalsModal(false);
                    toast.success('Study goals saved! 🎯');
                  }}
                  className="flex-1 px-6 py-4 rounded-xl text-white font-bold text-lg"
                  style={{ backgroundColor: '#10B981' }}
                >
                  Save Goals
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Generator Modal */}
      <AnimatePresence>
        {showGenerator && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowGenerator(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 md:inset-20 bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: '#EDE9FE' }}>
                    <Sparkles className="w-7 h-7" style={{ color: '#6366F1' }} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                      Personalized Timetable Generator
                    </h2>
                    <p className="text-sm" style={{ color: '#6B7280' }}>
                      Based on your interests and available time - {templates[config.mode].name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGenerator(false)}
                  className="p-2 rounded-xl hover:bg-gray-100"
                >
                  <X className="w-6 h-6" style={{ color: '#6B7280' }} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto">
                  <PersonalizedGenerator
                    subjects={subjects}
                    currentMode={templates[config.mode].name}
                    modeColor={templates[config.mode].color}
                    onGenerate={(personalConfig) => {
                      console.log('Personal Config received:', personalConfig);
                      
                      // Update config with personalized data
                      const updatedConfig = {
                        ...config,
                        dailyHours: personalConfig.totalDailyHours,
                        startTime: personalConfig.preferredStartTime,
                        endTime: personalConfig.preferredEndTime,
                      };
                      setConfig(updatedConfig);
                      setSubjectInterests(personalConfig.subjectInterests);
                      setAvailableTimePerDay(personalConfig.availableTimePerDay);
                      
                      console.log('Updated config:', updatedConfig);
                      console.log('Subject interests:', personalConfig.subjectInterests);
                      console.log('Available time per day:', personalConfig.availableTimePerDay);
                      
                      // Generate the timetable after a short delay to ensure state is updated
                      setTimeout(() => {
                        generateSmartTimetable(personalConfig.subjectInterests, personalConfig.availableTimePerDay);
                      }, 100);
                    }}
                    onClose={() => setShowGenerator(false)}
                  />

                  {generatedTimetable && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4 mt-6"
                    >
                      <div className="p-5 bg-green-50 rounded-2xl border-2 border-green-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#10B981' }}>
                            ✓
                          </div>
                          <span className="font-bold text-lg" style={{ color: '#065F46' }}>
                            Schedule Generated Successfully!
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: '#047857' }}>
                          Your personalized timetable is ready. It's tailored to your interests and available time!
                        </p>
                      </div>

                      <button
                        onClick={() => applyGeneratedSchedule(generatedTimetable)}
                        className="w-full px-6 py-5 rounded-2xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                        style={{ backgroundColor: '#10B981' }}
                      >
                        Apply to My Timetable
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}