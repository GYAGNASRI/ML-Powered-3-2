import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { useStudent } from '../context/StudentContext';
import { Brain, BookOpen, TrendingUp, Bell, Calendar, BarChart3, Eye, EyeOff, Sparkles, GraduationCap, Target, Zap } from 'lucide-react';

const features = [
  { icon: Brain, label: 'ML Prediction', desc: 'AI-powered pass/fail forecasting', color: '#6366F1' },
  { icon: BarChart3, label: 'Progress Analytics', desc: 'Visualize your academic trends', color: '#10B981' },
  { icon: Bell, label: 'Smart Reminders', desc: 'Never miss study sessions', color: '#F59E0B' },
  { icon: Calendar, label: 'Class Timetable', desc: 'Personalized study schedule', color: '#EC4899' },
  { icon: BookOpen, label: 'Subject Hub', desc: 'Manage all your subjects', color: '#8B5CF6' },
  { icon: TrendingUp, label: 'Performance Tracking', desc: 'Track marks & attendance', color: '#06B6D4' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { login } = useStudent();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [debugInfo, setDebugInfo] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDebugInfo('');
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    if (isLogin) {
      setLoading(true);
      setDebugInfo(`Attempting login for: ${formData.email}`);
      console.log('Attempting login for:', formData.email);
      const success = await login(formData.email, formData.password);
      setLoading(false);
      if (success) {
        setDebugInfo(`Login successful! Redirecting to dashboard...`);
        console.log('Login successful, redirecting to dashboard');
        navigate('/app/dashboard');
      } else {
        setDebugInfo(`Login failed. Check console for details.`);
        console.log('Login failed for:', formData.email);
        setError('Invalid email or password. Please try again or sign up.');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243E 100%)' }}>
      {/* Left Panel - Hero */}
      <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-white" style={{ fontSize: '1.5rem', fontWeight: 800 }}>EduPredict AI</h2>
              <p style={{ color: '#A5B4FC', fontSize: '0.75rem' }}>ML-Powered Student Success</p>
            </div>
          </div>

          {/* Hero Content */}
          <h1 className="text-white mb-4" style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2 }}>
            Predict Your <span style={{ background: 'linear-gradient(90deg, #6366F1, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Academic Success</span>
          </h1>
          <p className="mb-8" style={{ color: '#CBD5E1', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Harness the power of AI to forecast your exam results, track progress, and achieve your academic goals with confidence.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { value: '24/7', label: 'Always Available' },
              { value: '100%', label: 'Free to Start' },
              { value: 'AI', label: 'Smart Analytics' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-white" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</div>
                <div style={{ color: '#94A3B8', fontSize: '0.7rem' }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((f, i) => (
              <motion.div key={f.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.08 }}
                className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${f.color}20` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <div>
                  <div className="text-white" style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 2 }}>{f.label}</div>
                  <div style={{ color: '#94A3B8', fontSize: '0.7rem', lineHeight: 1.3 }}>{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Catchy Tagline */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="rounded-2xl p-8 text-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.3)' }}>
            <h3 className="text-white mb-2" style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.3 }}>
              "Your Future, Predicted. Your Success, Guaranteed."
            </h3>
            <p style={{ color: '#A5B4FC', fontSize: '0.9rem' }}>
              Transform data into destiny with AI-powered academic insights
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-white" style={{ fontSize: '1.25rem', fontWeight: 800 }}>EduPredict AI</span>
          </div>

          {/* Form Card */}
          <div className="rounded-3xl p-8 lg:p-10" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)' }}>
            {/* Tabs */}
            <div className="flex gap-2 p-1 rounded-2xl mb-8" style={{ background: '#F1F5F9' }}>
              <button onClick={() => setIsLogin(true)}
                className="flex-1 py-3 rounded-xl transition-all text-sm font-semibold"
                style={{ background: isLogin ? '#6366F1' : 'transparent', color: isLogin ? '#FFFFFF' : '#64748B' }}>
                Login
              </button>
              <button onClick={() => { setIsLogin(false); navigate('/signup'); }}
                className="flex-1 py-3 rounded-xl transition-all text-sm font-semibold"
                style={{ background: !isLogin ? '#6366F1' : 'transparent', color: !isLogin ? '#FFFFFF' : '#64748B' }}>
                Sign Up
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <GraduationCap className="w-8 h-8" style={{ color: '#6366F1' }} />
                <div>
                  <h3 style={{ color: '#1E1B4B', fontSize: '1.5rem', fontWeight: 800 }}>Welcome Back!</h3>
                  <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Login to access your dashboard</p>
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
                  <p style={{ color: '#DC2626', fontSize: '0.875rem' }}>⚠️ {error}</p>
                </motion.div>
              )}

              {debugInfo && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl" style={{ background: '#E0F2FE', border: '1px solid #0EA5E9' }}>
                  <p style={{ color: '#0EA5E9', fontSize: '0.875rem' }}>🔍 {debugInfo}</p>
                </motion.div>
              )}

              <div>
                <label className="block mb-2" style={{ color: '#334155', fontSize: '0.875rem', fontWeight: 600 }}>Email Address</label>
                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@example.com"
                  className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                  style={{ background: '#F8FAFC', border: '2px solid #E2E8F0', fontSize: '1rem' }}
                  onFocus={(e) => e.target.style.borderColor = '#6366F1'}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ color: '#334155', fontSize: '0.875rem', fontWeight: 600 }}>Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 rounded-xl outline-none transition-all pr-12"
                    style={{ background: '#F8FAFC', border: '2px solid #E2E8F0', fontSize: '1rem' }}
                    onFocus={(e) => e.target.style.borderColor = '#6366F1'}
                    onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" style={{ color: '#94A3B8' }} /> : <Eye className="w-5 h-5" style={{ color: '#94A3B8' }} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-bold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: loading ? 'rgba(99,102,241,0.6)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)', fontSize: '1rem' }}>
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Login to Dashboard
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 pt-2">
                <Target className="w-4 h-4" style={{ color: '#94A3B8' }} />
                <p style={{ color: '#64748B', fontSize: '0.8rem' }}>
                  Don't have an account? <Link to="/signup" className="font-semibold hover:underline" style={{ color: '#6366F1' }}>Sign up free</Link>
                </p>
              </div>

              {/* Demo Button */}
              <div className="pt-4 border-t" style={{ borderColor: '#E2E8F0' }}>
                <Link to="/demo"
                  className="w-full py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                  style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <Zap className="w-4 h-4" />
                  View Interactive Demo
                </Link>
              </div>
            </form>
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <p style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
              By continuing, you agree to our Terms & Privacy Policy
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}