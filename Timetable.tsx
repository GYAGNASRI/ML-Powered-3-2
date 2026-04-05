import React, { useState } from 'react';
import { useStudent, SubjectDef, Timetable as TimetableType, UnavailableBlock } from '../context/StudentContext';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Plus, Sparkles, X, Settings, Target, Ban, Trophy, TrendingUp, Zap, Info } from 'lucide-react';
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
  breakDuration: number;
  sessionLength: number;
  includeWeekends: boolean;
}

export default function Timetable() {
  const {
    student,
    getSubjects,
    updateSubject,
    getTimetable,
    updateTimetableCell,
    setCustomTimeSlots,
    setStudyGoal,
    getStudyGoals,
    addUnavailableBlock,
    removeUnavailableBlock,
    getUnavailableBlocks,
  } = useStudent();

  const [showGenerator, setShowGenerator] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [generatorStep, setGeneratorStep] = useState(1);
  const [usePersonalizedMode, setUsePersonalizedMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMode>('regular');
  
  const [config, setConfig] = useState<GeneratorConfig>({
    mode: 'regular',
    dailyHours: student?.studyHoursPerDay || 4,
    startTime: '08:00',
    endTime: '18:00',
    studyDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    subjectPriorities: {},
    examDates: {},
    breakDuration: 15,
    sessionLength: 60,
    includeWeekends: false,
  });

  const [newBlock, setNewBlock] = useState<Omit<UnavailableBlock, 'id'>>({
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    reason: 'Class',
    color: '#EF4444',
  });

  const [generatedTimetable, setGeneratedTimetable] = useState<TimetableType | null>(null);

  const subjects = getSubjects();
  const timetable = getTimetable();
  const unavailableBlocks = getUnavailableBlocks() || [];
  const studyGoals = getStudyGoals() || [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Ensure timetable has proper defaults
  const timeSlots = timetable?.timeSlots || ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const schedule = timetable?.schedule || {};

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

  // Smart Timetable Generation Algorithm with Template Support
  const generateSmartTimetable = () => {
    // Show loading toast
    toast.loading('🧠 Analyzing your schedule and generating optimal plan...', { id: 'generating' });

    const { mode, dailyHours, startTime, endTime, studyDays, subjectPriorities, examDates, breakDuration, sessionLength, includeWeekends } = config;

    // Adjust parameters based on template mode + cognitive science principles
    let effectiveDailyHours = dailyHours;
    let breakFrequency = 2; // hours between breaks
    let usePomodoro = false;
    
    if (mode === 'exam') {
      effectiveDailyHours = Math.max(dailyHours, 6);
      breakFrequency = 1.5; // More frequent breaks for intensive study (prevents burnout)
      usePomodoro = true; // Enable focused sessions for exam prep
    } else if (mode === 'light') {
      effectiveDailyHours = Math.min(dailyHours, 3);
      breakFrequency = 1; // Shorter sessions for better retention
    }

    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    const sessionDuration = sessionLength; // minutes per session
    const sessionsPerDay = Math.floor((effectiveDailyHours * 60) / sessionDuration);

    const timeSlots: string[] = [];
    for (let i = 0; i < (endHour - startHour); i++) {
      const hour = startHour + i;
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }

    // Advanced subject weight calculation with multiple factors
    const today = new Date();
    const subjectWeights: Record<string, number> = {};
    const subjectDifficulty: Record<string, number> = {};

    subjects.forEach(sub => {
      let weight = 1;
      let difficulty = 1;

      // Priority weight
      const priority = subjectPriorities[sub.id] || sub.priority || 'medium';
      if (priority === 'high') {
        weight += (mode === 'exam' ? 3 : 2);
        difficulty += 1.5;
      } else if (priority === 'medium') {
        weight += 1;
        difficulty += 0.5;
      }

      // Exam urgency weight (exponential increase as deadline approaches)
      const examDate = examDates[sub.id] || sub.examDate;
      if (examDate) {
        const daysUntilExam = Math.ceil((new Date(examDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const urgencyMultiplier = mode === 'exam' ? 2 : 1;
        
        // Exponential urgency - subjects with closer deadlines get much more weight
        if (daysUntilExam <= 3) weight += (5 * urgencyMultiplier);
        else if (daysUntilExam <= 7) weight += (3 * urgencyMultiplier);
        else if (daysUntilExam <= 14) weight += (2 * urgencyMultiplier);
        else if (daysUntilExam <= 30) weight += urgencyMultiplier;
      }

      // Performance-based adjustment - struggling subjects need more time
      if (student) {
        const subjectMarks = student.marks.filter(m => m.subjectId === sub.id);
        if (subjectMarks.length > 0) {
          const avg = subjectMarks.reduce((sum, m) => sum + (m.marks / m.total) * 100, 0) / subjectMarks.length;
          
          // Subjects below 60% get extra weight (need improvement)
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

    // Sort subjects by weight for priority allocation
    const sortedSubjects = [...subjects].sort((a, b) => 
      (subjectWeights[b.id] || 0) - (subjectWeights[a.id] || 0)
    );

    // Check if time is unavailable
    const isTimeUnavailable = (day: string, time: string): boolean => {
      return unavailableBlocks.some(block => {
        if (block.day !== day) return false;
        const blockStart = parseInt(block.startTime.split(':')[0]);
        const blockEnd = parseInt(block.endTime.split(':')[0]);
        const slotHour = parseInt(time.split(':')[0]);
        return slotHour >= blockStart && slotHour < blockEnd;
      });
    };

    // Cognitive science: Determine optimal time slots for difficult subjects
    // Morning (8-11): Peak cognitive performance - assign difficult subjects
    // Afternoon (14-17): Good for medium difficulty
    // Evening (18+): Light review or easier subjects
    const getOptimalSubjectsForTimeSlot = (hour: number): SubjectDef[] => {
      if (hour >= 8 && hour < 11) {
        // Morning: High difficulty subjects
        return sortedSubjects.filter(s => subjectDifficulty[s.id] >= 1.5);
      } else if (hour >= 14 && hour < 17) {
        // Afternoon: Medium difficulty
        return sortedSubjects.filter(s => subjectDifficulty[s.id] >= 0.5 && subjectDifficulty[s.id] < 1.5);
      } else {
        // Evening: Lighter subjects or review
        return sortedSubjects.filter(s => subjectDifficulty[s.id] < 1);
      }
    };

    // Interleaving: Rotate subjects to improve retention
    const subjectRotation: Record<string, number> = {};
    subjects.forEach(sub => subjectRotation[sub.id] = 0);

    // Generate schedule with intelligent distribution
    const schedule: TimetableType['schedule'] = {};
    
    days.forEach(day => {
      schedule[day] = {};
      
      if (!studyDays.includes(day) && !includeWeekends) {
        timeSlots.forEach(time => {
          schedule[day][time] = null;
        });
        return;
      }

      let slotIndex = 0;
      let consecutiveSessions = 0;
      let lastAssignedSubject: string | null = null;

      timeSlots.forEach((time, timeIdx) => {
        const hour = parseInt(time.split(':')[0]);

        // Skip unavailable blocks
        if (isTimeUnavailable(day, time)) {
          schedule[day][time] = null;
          consecutiveSessions = 0;
          lastAssignedSubject = null;
          return;
        }

        // Add strategic breaks based on cognitive load and mode
        if (consecutiveSessions > 0 && consecutiveSessions >= breakFrequency) {
          schedule[day][time] = null; // Break
          consecutiveSessions = 0;
          lastAssignedSubject = null;
          return;
        }

        // Assign subjects based on time optimality and rotation
        if (slotIndex < sessionsPerDay) {
          const optimalSubjects = getOptimalSubjectsForTimeSlot(hour);
          let selectedSubject: SubjectDef | null = null;

          if (optimalSubjects.length > 0) {
            // Select subject with lowest rotation count for better distribution
            selectedSubject = optimalSubjects.reduce((min, sub) => 
              subjectRotation[sub.id] < subjectRotation[min.id] ? sub : min
            );
          } else {
            // Fallback to highest priority available subject
            selectedSubject = sortedSubjects[0];
          }

          // Avoid same subject consecutively (interleaving principle)
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
    toast.success(`✨ ${templates[mode].name} schedule optimized for your success!`, { duration: 3000 });
    setGeneratorStep(4);
  };

  const applyGeneratedTimetable = () => {
    if (!generatedTimetable) return;

    setCustomTimeSlots(generatedTimetable.timeSlots);

    days.forEach(day => {
      generatedTimetable.timeSlots.forEach(time => {
        const cell = generatedTimetable.schedule[day]?.[time];
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
    setGeneratorStep(1);
    setGeneratedTimetable(null);
    setUsePersonalizedMode(false);
    toast.success('Timetable applied successfully!');
  };

  // Personalized Timetable Generation based on user interests and available time
  const generatePersonalizedTimetable = (personalizedConfig: {
    subjectInterests: Record<string, number>;
    availableTimePerDay: Record<string, number>;
    totalDailyHours: number;
    preferredStartTime: string;
    preferredEndTime: string;
  }) => {
    toast.loading('🎯 Creating your personalized schedule based on your interests...', { id: 'generating' });

    const { subjectInterests, availableTimePerDay, totalDailyHours, preferredStartTime, preferredEndTime } = personalizedConfig;

    const startHour = parseInt(preferredStartTime.split(':')[0]);
    const endHour = parseInt(preferredEndTime.split(':')[0]);

    const timeSlots: string[] = [];
    for (let i = 0; i < (endHour - startHour); i++) {
      const hour = startHour + i;
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }

    // Calculate subject weights based on interest levels
    const subjectWeights: Record<string, number> = {};
    let totalInterest = 0;

    subjects.forEach(sub => {
      const interest = subjectInterests[sub.id] || 3;
      subjectWeights[sub.id] = interest;
      totalInterest += interest;
    });

    // Sort subjects by interest (highest first)
    const sortedSubjects = [...subjects].sort((a, b) => 
      (subjectWeights[b.id] || 0) - (subjectWeights[a.id] || 0)
    );

    // Check if time is unavailable
    const isTimeUnavailable = (day: string, time: string): boolean => {
      return unavailableBlocks.some(block => {
        if (block.day !== day) return false;
        const blockStart = parseInt(block.startTime.split(':')[0]);
        const blockEnd = parseInt(block.endTime.split(':')[0]);
        const slotHour = parseInt(time.split(':')[0]);
        return slotHour >= blockStart && slotHour < blockEnd;
      });
    };

    // Generate schedule with interest-based distribution
    const schedule: TimetableType['schedule'] = {};
    
    days.forEach(day => {
      schedule[day] = {};
      
      const dailyAvailableHours = availableTimePerDay[day] || 0;
      if (dailyAvailableHours === 0) {
        timeSlots.forEach(time => {
          schedule[day][time] = null;
        });
        return;
      }

      // Calculate sessions based on available hours
      const sessionsForDay = Math.floor(dailyAvailableHours);
      let assignedSessions = 0;
      let subjectRotation: Record<string, number> = {};
      subjects.forEach(sub => subjectRotation[sub.id] = 0);
      let lastAssignedSubject: string | null = null;

      timeSlots.forEach((time, timeIdx) => {
        const hour = parseInt(time.split(':')[0]);

        // Skip unavailable blocks
        if (isTimeUnavailable(day, time)) {
          schedule[day][time] = null;
          return;
        }

        // Assign subjects based on sessions allowed for the day
        if (assignedSessions < sessionsForDay) {
          // Distribute subjects proportionally to interest levels
          const availableSubjects = sortedSubjects.filter(s => {
            const interest = subjectWeights[s.id];
            const proportion = interest / totalInterest;
            const targetSessions = Math.ceil(sessionsForDay * proportion);
            return subjectRotation[s.id] < targetSessions;
          });

          let selectedSubject: SubjectDef | null = null;

          if (availableSubjects.length > 0) {
            // Select subject with highest interest that hasn't been assigned recently
            selectedSubject = availableSubjects.find(s => s.id !== lastAssignedSubject) || availableSubjects[0];
          } else if (sortedSubjects.length > 0) {
            // Fallback: rotate through all subjects
            selectedSubject = sortedSubjects.find(s => s.id !== lastAssignedSubject) || sortedSubjects[0];
          }

          if (selectedSubject) {
            schedule[day][time] = {
              subjectId: selectedSubject.id,
              type: 'study',
            };
            subjectRotation[selectedSubject.id]++;
            lastAssignedSubject = selectedSubject.id;
            assignedSessions++;
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
    toast.success('✨ Your personalized schedule is ready! Click "Apply Timetable" to use it.', { duration: 3000 });
  };

  const handleAddUnavailableBlock = () => {
    addUnavailableBlock(newBlock);
    setShowUnavailableModal(false);
    toast.success('Unavailable time block added!');
    setNewBlock({
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      reason: 'Class',
      color: '#EF4444',
    });
  };

  const getSubjectById = (id: string): SubjectDef | undefined => {
    return subjects.find(s => s.id === id);
  };

  const getGoalProgress = (subjectId: string) => {
    const goal = studyGoals.find(g => g.subjectId === subjectId);
    if (!goal) return null;
    
    // Prevent division by zero and NaN
    if (!goal.weeklyHours || goal.weeklyHours === 0) {
      return { ...goal, percentage: 0 };
    }
    
    const percentage = (goal.currentProgress / goal.weeklyHours) * 100;
    return { ...goal, percentage: Math.min(percentage, 100) };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header - Matching Figma Design */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: '#1F2937' }}>
              Timetable
            </h1>
            <p className="text-base" style={{ color: '#9CA3AF' }}>
              Thursday, March 12, 2026
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <svg className="w-6 h-6" style={{ color: '#6B7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unavailableBlocks.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white font-bold" style={{ backgroundColor: '#EF4444' }}>
                    {unavailableBlocks.length}
                  </div>
                )}
              </button>
            </div>
            {/* User Avatar */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#A855F7' }}>
                {student?.name?.charAt(0).toUpperCase() || 'M'}
              </div>
              <span className="font-medium" style={{ color: '#1F2937' }}>
                {student?.name || 'mam'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons - Simplified */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowUnavailableModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 font-medium hover:shadow-md transition-all"
            style={{ borderColor: '#EF4444', color: '#EF4444' }}
          >
            <Ban className="w-4 h-4" />
            Mark Unavailable
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowGoalsModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 font-medium hover:shadow-md transition-all"
            style={{ borderColor: '#10B981', color: '#10B981' }}
          >
            <Target className="w-4 h-4" />
            Study Goals
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all"
            style={{ backgroundColor: '#6366F1' }}
          >
            <Sparkles className="w-4 h-4" />
            Generate Schedule
          </motion.button>
        </div>
      </motion.div>

      {/* Template Selection Bar */}
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
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected ? 'shadow-lg' : 'border-gray-200'
              }`}
              style={{
                backgroundColor: isSelected ? `${template.color}15` : '#FFFFFF',
                borderColor: isSelected ? template.color : '#E5E7EB',
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${template.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: template.color }} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold" style={{ color: '#1F2937' }}>
                    {template.name}
                  </div>
                  <div className="text-xs" style={{ color: '#6B7280' }}>
                    {template.dailyHours}h/day • {template.intensity} intensity
                  </div>
                </div>
                {isSelected && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: template.color }}
                  >
                    ✓
                  </div>
                )}
              </div>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                {template.description}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Study Goals Progress */}
      {studyGoals.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-6 bg-white rounded-2xl shadow-xl border-2"
          style={{ borderColor: '#E5E7EB' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5" style={{ color: '#F59E0B' }} />
            <h3 className="font-semibold" style={{ color: '#1F2937' }}>
              Weekly Study Goals
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {subjects.slice(0, 6).map(subject => {
              const progress = getGoalProgress(subject.id);
              if (!progress) return null;
              
              return (
                <div key={subject.id} className="p-3 rounded-xl" style={{ backgroundColor: subject.bg }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-xl">{subject.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: subject.color }}>
                        {subject.name}
                      </div>
                      <div className="text-xs" style={{ color: '#6B7280' }}>
                        {progress.currentProgress.toFixed(1)}h / {progress.weeklyHours}h
                      </div>
                    </div>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.percentage}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Unavailable Blocks Display */}
      {unavailableBlocks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 bg-red-50 rounded-xl border-2 border-red-200"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Ban className="w-5 h-5" style={{ color: '#EF4444' }} />
              <h3 className="font-semibold" style={{ color: '#991B1B' }}>
                Unavailable Time Blocks
              </h3>
            </div>
            <div className="text-sm" style={{ color: '#991B1B' }}>
              {unavailableBlocks.length} block{unavailableBlocks.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {unavailableBlocks.map(block => (
              <div
                key={block.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm"
                style={{ backgroundColor: block.color || '#EF4444' }}
              >
                <span className="font-medium">{block.day}</span>
                <span>{block.startTime} - {block.endTime}</span>
                <span className="px-2 py-0.5 rounded bg-white bg-opacity-20 text-xs">
                  {block.reason}
                </span>
                <button
                  onClick={() => {
                    removeUnavailableBlock(block.id);
                    toast.success('Block removed');
                  }}
                  className="ml-1 hover:bg-white hover:bg-opacity-20 rounded p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
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
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-left font-semibold" style={{ color: '#6B7280' }}>
                  Time
                </th>
                {days.map(day => (
                  <th key={day} className="p-3 text-center font-semibold" style={{ color: '#6B7280' }}>
                    {day.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time, idx) => (
                <tr key={time} className={idx % 2 === 0 ? '' : 'bg-gray-50'}>
                  <td className="p-3 font-medium" style={{ color: '#4B5563' }}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                      {time}
                    </div>
                  </td>
                  {days.map(day => {
                    const cell = schedule[day]?.[time];
                    const subject = cell ? getSubjectById(cell.subjectId) : null;
                    const isUnavailable = unavailableBlocks.some(block => {
                      if (block.day !== day) return false;
                      const blockStart = parseInt(block.startTime.split(':')[0]);
                      const blockEnd = parseInt(block.endTime.split(':')[0]);
                      const slotHour = parseInt(time.split(':')[0]);
                      return slotHour >= blockStart && slotHour < blockEnd;
                    });

                    return (
                      <td key={`${day}-${time}`} className="p-2">
                        {isUnavailable ? (
                          <div className="p-3 rounded-lg text-center" style={{ backgroundColor: '#FEE2E2' }}>
                            <Ban className="w-4 h-4 mx-auto" style={{ color: '#EF4444' }} />
                            <div className="text-xs mt-1" style={{ color: '#991B1B' }}>
                              Busy
                            </div>
                          </div>
                        ) : cell && subject ? (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="p-3 rounded-lg text-center cursor-pointer"
                            style={{ backgroundColor: subject.bg }}
                          >
                            <div className="text-lg mb-1">{subject.emoji}</div>
                            <div className="text-xs font-medium" style={{ color: subject.color }}>
                              {subject.name}
                            </div>
                          </motion.div>
                        ) : (
                          <div className="p-3 rounded-lg text-center" style={{ backgroundColor: '#F9FAFB' }}>
                            <div className="text-xs" style={{ color: '#D1D5DB' }}>
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

      {/* Unavailable Block Modal */}
      <AnimatePresence>
        {showUnavailableModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowUnavailableModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-x-4 top-1/4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[500px] bg-white rounded-2xl shadow-2xl z-50 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl" style={{ backgroundColor: '#FEE2E2' }}>
                    <Ban className="w-6 h-6" style={{ color: '#EF4444' }} />
                  </div>
                  <h2 className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                    Mark Unavailable Time
                  </h2>
                </div>
                <button onClick={() => setShowUnavailableModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="w-6 h-6" style={{ color: '#6B7280' }} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    Day
                  </label>
                  <select
                    value={newBlock.day}
                    onChange={(e) => setNewBlock({ ...newBlock, day: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2"
                    style={{ borderColor: '#E5E7EB' }}
                  >
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newBlock.startTime}
                      onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2"
                      style={{ borderColor: '#E5E7EB' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newBlock.endTime}
                      onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2"
                      style={{ borderColor: '#E5E7EB' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    Reason
                  </label>
                  <select
                    value={newBlock.reason}
                    onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2"
                    style={{ borderColor: '#E5E7EB' }}
                  >
                    <option value="Class">Class</option>
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Sports">Sports</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUnavailableModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl font-medium"
                    style={{ backgroundColor: '#F3F4F6', color: '#374151' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUnavailableBlock}
                    className="flex-1 px-4 py-3 rounded-xl text-white font-medium"
                    style={{ backgroundColor: '#EF4444' }}
                  >
                    Add Block
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
              className="fixed inset-4 md:inset-20 bg-white rounded-2xl shadow-2xl z-50 p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl" style={{ backgroundColor: '#D1FAE5' }}>
                    <Target className="w-6 h-6" style={{ color: '#10B981' }} />
                  </div>
                  <h2 className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                    Set Weekly Study Goals
                  </h2>
                </div>
                <button onClick={() => setShowGoalsModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="w-6 h-6" style={{ color: '#6B7280' }} />
                </button>
              </div>

              <div className="space-y-4">
                {subjects.map(subject => {
                  const goal = studyGoals.find(g => g.subjectId === subject.id);
                  return (
                    <div
                      key={subject.id}
                      className="flex items-center gap-4 p-4 rounded-xl border-2"
                      style={{ borderColor: '#E5E7EB' }}
                    >
                      <div className="text-2xl">{subject.emoji}</div>
                      <div className="flex-1">
                        <div className="font-medium" style={{ color: '#1F2937' }}>
                          {subject.name}
                        </div>
                        <div className="text-xs" style={{ color: '#6B7280' }}>
                          Current: {goal ? `${goal.currentProgress.toFixed(1)}h` : '0h'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                          className="w-20 px-3 py-2 rounded-lg border-2 text-center"
                          style={{ borderColor: '#E5E7EB' }}
                          placeholder="0"
                        />
                        <span className="text-sm" style={{ color: '#6B7280' }}>hours/week</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowGoalsModal(false);
                    toast.success('Study goals saved!');
                  }}
                  className="flex-1 px-4 py-3 rounded-xl text-white font-medium"
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
                  <div className="p-2 rounded-xl" style={{ backgroundColor: '#EDE9FE' }}>
                    <Sparkles className="w-6 h-6" style={{ color: '#6366F1' }} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                      Smart Timetable Generator
                    </h2>
                    <p className="text-sm" style={{ color: '#6B7280' }}>
                      Mode: {templates[config.mode].name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGenerator(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-6 h-6" style={{ color: '#6B7280' }} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Mode Toggle */}
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={() => setUsePersonalizedMode(false)}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                        !usePersonalizedMode ? 'shadow-lg' : ''
                      }`}
                      style={{
                        backgroundColor: !usePersonalizedMode ? templates[config.mode].color : '#F3F4F6',
                        color: !usePersonalizedMode ? '#FFFFFF' : '#6B7280',
                      }}
                    >
                      Quick Generate
                    </button>
                    <button
                      onClick={() => setUsePersonalizedMode(true)}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                        usePersonalizedMode ? 'shadow-lg' : ''
                      }`}
                      style={{
                        backgroundColor: usePersonalizedMode ? templates[config.mode].color : '#F3F4F6',
                        color: usePersonalizedMode ? '#FFFFFF' : '#6B7280',
                      }}
                    >
                      Personalized
                    </button>
                  </div>

                  {/* Show PersonalizedGenerator or Quick Mode */}
                  {usePersonalizedMode ? (
                    <PersonalizedGenerator
                      subjects={subjects}
                      onGenerate={generatePersonalizedTimetable}
                      onClose={() => setShowGenerator(false)}
                      currentMode={config.mode}
                      modeColor={templates[config.mode].color}
                    />
                  ) : (
                    <>
                      {/* Quick Info */}
                      <div className="p-4 rounded-xl" style={{ backgroundColor: `${templates[config.mode].color}15` }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-5 h-5" style={{ color: templates[config.mode].color }} />
                          <span className="font-semibold" style={{ color: '#1F2937' }}>
                            {templates[config.mode].name} Configuration
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: '#6B7280' }}>
                          {templates[config.mode].description}
                        </p>
                      </div>

                      {/* Scheduling Insights */}
                      <SchedulingInsights />

                      {/* Generate Button */}
                      <button
                        onClick={generateSmartTimetable}
                        className="w-full px-6 py-4 rounded-xl text-white font-medium text-lg flex items-center justify-center gap-2"
                        style={{ backgroundColor: templates[config.mode].color }}
                      >
                        <Sparkles className="w-6 h-6" />
                        Generate {templates[config.mode].name}
                      </button>

                      {generatedTimetable && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-4"
                        >
                          <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: '#10B981' }}>
                                ✓
                              </div>
                              <span className="font-semibold" style={{ color: '#065F46' }}>
                                Schedule Generated Successfully!
                              </span>
                            </div>
                            <p className="text-sm" style={{ color: '#047857' }}>
                              Your personalized {templates[config.mode].name.toLowerCase()} has been created. Review and apply it to your timetable.
                            </p>
                          </div>

                          <button
                            onClick={applyGeneratedTimetable}
                            className="w-full px-6 py-4 rounded-xl text-white font-medium text-lg"
                            style={{ backgroundColor: '#10B981' }}
                          >
                            Apply Timetable
                          </button>
                        </motion.div>
                      )}
                    </>
                  )}

                  {/* Apply button shown when personalized timetable is generated */}
                  {usePersonalizedMode && generatedTimetable && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4 mt-6"
                    >
                      <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: '#10B981' }}>
                            ✓
                          </div>
                          <span className="font-semibold" style={{ color: '#065F46' }}>
                            Schedule Generated Successfully!
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: '#047857' }}>
                          Your personalized schedule based on your interests has been created. Review and apply it to your timetable.
                        </p>
                      </div>

                      <button
                        onClick={applyGeneratedTimetable}
                        className="w-full px-6 py-4 rounded-xl text-white font-medium text-lg"
                        style={{ backgroundColor: '#10B981' }}
                      >
                        Apply Timetable
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