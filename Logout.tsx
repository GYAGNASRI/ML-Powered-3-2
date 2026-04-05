import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useStudent } from '../context/StudentContext';
import { LogOut, ChevronLeft, Download, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

type LogoutPhase = 'confirmation' | 'processing' | 'complete';

export default function Logout() {
  const navigate = useNavigate();
  const { student, logout } = useStudent();
  const [phase, setPhase] = useState<LogoutPhase>('confirmation');
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);
  const [secondsUntilRedirect, setSecondsUntilRedirect] = useState(3);

  // Auto-redirect after logout
  useEffect(() => {
    if (phase === 'complete' && secondsUntilRedirect > 0) {
      const timer = setTimeout(() => {
        setSecondsUntilRedirect(s => s - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'complete' && secondsUntilRedirect === 0) {
      navigate('/');
      return;
    }
    return undefined;
  }, [phase, secondsUntilRedirect, navigate]);

  const handleCancel = () => {
    navigate('/app/dashboard');
  };

  const handleDownloadData = async () => {
    if (!student) return;
    
    try {
      const dataStr = JSON.stringify(student, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `student_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Data downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download data');
    }
  };

  const handleConfirmLogout = async () => {
    setPhase('processing');
    const steps = [
      'Syncing your data...',
      'Clearing session...',
      'Logging you out...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setProcessingSteps(prev => [...prev, steps[i]]);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Perform logout
    try {
      await logout();
      setProcessingSteps(prev => [...prev, 'Redirecting...']);
      setTimeout(() => {
        setPhase('complete');
      }, 300);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
      navigate('/app/dashboard');
    }
  };

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243e 100%)' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="text-white text-xl font-semibold mb-2">Loading...</div>
          <p style={{ color: '#94A3B8' }}>Please wait while we prepare your logout</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243e 100%)' }}>
      <AnimatePresence mode="wait">
        {phase === 'confirmation' && (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-md"
          >
            {/* Confirmation Card */}
            <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-8"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
                  <LogOut className="w-8 h-8" style={{ color: '#EF4444' }} />
                </div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: '#1E1B4B' }}>Sign Out</h1>
                <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
                  Are you sure you want to sign out from your account?
                </p>
              </motion.div>

              {/* Student Info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-xl mb-6"
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #EC4899)' }}>
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: '#1E1B4B' }}>{student.name}</div>
                    <div style={{ color: '#64748B', fontSize: '0.85rem' }}>{student.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Curriculum</div>
                    <div className="font-semibold" style={{ color: '#1E1B4B' }}>{student.curriculum}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Grade</div>
                    <div className="font-semibold" style={{ color: '#1E1B4B' }}>{student.grade}</div>
                  </div>
                </div>
              </motion.div>

              {/* Info Box */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 rounded-xl mb-6 flex gap-3"
                style={{ background: 'rgba(251, 146, 60, 0.1)', border: '1px solid rgba(251, 146, 60, 0.3)' }}
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#FB923C' }} />
                <div style={{ fontSize: '0.85rem', color: '#7C2D12' }}>
                  <div className="font-semibold mb-1">Before you go:</div>
                  <ul className="space-y-1 text-xs">
                    <li>• Your data will remain securely stored</li>
                    <li>• You can log back in anytime</li>
                    <li>• Consider downloading your data first</li>
                  </ul>
                </div>
              </motion.div>

              {/* Download Data Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownloadData}
                className="w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mb-3"
                style={{ background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}
              >
                <Download className="w-4 h-4" />
                Download My Data
              </motion.button>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex gap-3"
              >
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  style={{ background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#E5E7EB';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6';
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Keep Me Logged In
                </button>

                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #EF4444, #F87171)', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 20px rgba(239,68,68,0.4)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Yes, Sign Out
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {phase === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md"
          >
            {/* Processing Card */}
            <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                <Clock className="w-8 h-8 text-white" />
              </motion.div>

              <h2 className="text-2xl font-bold text-center mb-6" style={{ color: '#1E1B4B' }}>
                Signing You Out
              </h2>

              {/* Progress Steps */}
              <div className="space-y-3 mb-8">
                {processingSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: '#F8FAFC' }}
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                      style={{ background: '#10B981' }}>
                      ✓
                    </div>
                    <span style={{ color: '#64748B', fontSize: '0.9rem' }}>{step}</span>
                  </motion.div>
                ))}
              </div>

              {/* Animated Dots */}
              <div className="flex items-center justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#6366F1' }}
                  />
                ))}
              </div>

              <p className="text-center mt-6" style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                Please wait while we secure your session...
              </p>
            </div>
          </motion.div>
        )}

        {phase === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md"
          >
            {/* Success Card */}
            <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: 'rgba(16, 185, 129, 0.15)' }}
              >
                <CheckCircle2 className="w-8 h-8" style={{ color: '#10B981' }} />
              </motion.div>

              <h2 className="text-2xl font-bold text-center mb-2" style={{ color: '#1E1B4B' }}>
                Signed Out Successfully
              </h2>

              <p className="text-center mb-8" style={{ color: '#64748B', fontSize: '0.9rem' }}>
                You have been securely logged out. Redirecting you to the home page...
              </p>

              {/* Countdown */}
              <div className="w-full py-4 rounded-xl text-center" style={{ background: '#F0F9FF', border: '1px solid #E0F2FE' }}>
                <div className="text-3xl font-bold" style={{ color: '#0284C7' }}>
                  {secondsUntilRedirect}
                </div>
                <div style={{ color: '#64748B', fontSize: '0.85rem' }}>
                  seconds until redirect
                </div>
              </div>

              {/* Quick Navigation */}
              <button
                onClick={() => navigate('/')}
                className="w-full mt-6 py-3 rounded-xl font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                Return to Home Now
              </button>
            </div>

            {/* Footer Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mt-6"
            >
              <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                See you again soon! 👋
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
