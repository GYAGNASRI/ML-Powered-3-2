import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { motion, useInView, useScroll, useTransform } from 'motion/react';
import {
  Brain,
  BookOpen,
  TrendingUp,
  Bell,
  Calendar,
  BarChart3,
  Target,
  Zap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  CheckCircle,
  Users,
  Award,
  Clock,
  ArrowRight,
  Star,
  Activity,
  Trophy,
  Flame,
} from 'lucide-react';
import { LineChart, Line, PieChart as RePieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const DEMO_SCREENS = [
  {
    title: 'Dashboard Overview',
    description: 'Get a comprehensive view of your academic performance, upcoming tasks, and personalized insights at a glance.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200',
    features: ['Real-time Analytics', 'Quick Actions', 'Performance Metrics', 'Study Streak'],
    color: '#6366F1',
  },
  {
    title: 'ML Prediction Engine',
    description: 'Advanced machine learning algorithms analyze your data to predict exam outcomes with 94% accuracy.',
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200',
    features: ['Pass/Fail Prediction', 'Confidence Score', 'Risk Analysis', 'Improvement Tips'],
    color: '#8B5CF6',
  },
  {
    title: 'Subject Management',
    description: 'Organize your subjects with color-coded categories, track progress, and manage course materials efficiently.',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200',
    features: ['Color Coding', 'Material Library', 'Class Schedules', 'Grade Tracking'],
    color: '#EC4899',
  },
  {
    title: 'Smart Reminders',
    description: 'Never miss a study session with intelligent reminders based on your schedule and performance patterns.',
    image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200',
    features: ['Calendar View', 'Push Notifications', 'Recurring Tasks', 'Priority Alerts'],
    color: '#F59E0B',
  },
  {
    title: 'Progress Analytics',
    description: 'Visualize your academic journey with interactive charts, performance trends, and detailed reports.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200',
    features: ['Interactive Charts', 'Trend Analysis', 'Comparative Reports', 'Goal Tracking'],
    color: '#10B981',
  },
];

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Predictions',
    description: 'Machine learning models trained on thousands of student records to provide accurate performance forecasts.',
    color: '#6366F1',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    icon: BarChart3,
    title: 'Visual Analytics',
    description: 'Interactive charts and graphs that make it easy to understand your academic performance trends.',
    color: '#10B981',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Context-aware reminders that adapt to your study patterns and upcoming deadlines.',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Calendar,
    title: 'Dynamic Timetables',
    description: 'Automatically generated schedules that align with your class level and curriculum requirements.',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Target,
    title: 'Goal Setting',
    description: 'Set academic goals and track your progress with personalized milestones and achievements.',
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    icon: BookOpen,
    title: 'Subject Hub',
    description: 'Centralized platform for managing all your subjects, notes, and study materials.',
    color: '#8B5CF6',
    gradient: 'from-violet-500 to-purple-500',
  },
];

const STATS = [
  { value: '10,000+', label: 'Active Students', icon: Users },
  { value: '98%', label: 'User Satisfaction', icon: Star },
  { value: '500K+', label: 'Study Sessions', icon: Clock },
  { value: '24/7', label: 'Platform Uptime', icon: Zap },
];

const CHART_DATA = [
  { name: 'Week 1', score: 65 },
  { name: 'Week 2', score: 72 },
  { name: 'Week 3', score: 78 },
  { name: 'Week 4', score: 85 },
  { name: 'Week 5', score: 88 },
  { name: 'Week 6', score: 92 },
];

const PIE_DATA = [
  { name: 'Excellent', value: 35, color: '#10B981' },
  { name: 'Good', value: 45, color: '#6366F1' },
  { name: 'Needs Work', value: 20, color: '#F59E0B' },
];

export default function Demo() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const demoRef = useRef(null);
  const statsRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true });
  const featuresInView = useInView(featuresRef, { once: true });
  const demoInView = useInView(demoRef, { once: true });
  const statsInView = useInView(statsRef, { once: true });

  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % DEMO_SCREENS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % DEMO_SCREENS.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + DEMO_SCREENS.length) % DEMO_SCREENS.length);
    setIsAutoPlaying(false);
  };

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      {/* Animated Background */}
      <motion.div 
        className="fixed inset-0 pointer-events-none"
        style={{ y: backgroundY }}
      >
        <div className="absolute inset-0" style={{ 
          background: 'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139,92,246,0.15) 0%, transparent 50%)',
        }} />
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: '#6366F1' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: '#EC4899' }} />
      </motion.div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: 'rgba(10,10,15,0.8)', borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-lg">EduPredict AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Home
            </Link>
            <Link 
              to="/signup" 
              className="px-6 py-2 rounded-xl text-white font-semibold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-indigo-300 text-sm font-medium">Interactive Platform Demo</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Experience the Future of
              <span className="block mt-2" style={{ 
                background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #EC4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Academic Success
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
              Discover how EduPredict AI combines machine learning, smart analytics, and personalized insights 
              to help students achieve their academic goals.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/signup"
                className="flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold transition-all hover:scale-105 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                <PlayCircle className="w-5 h-5" />
                Start Free Trial
              </Link>
              <button
                onClick={() => document.getElementById('demo-carousel')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <Activity className="w-5 h-5" />
                Watch Demo
              </button>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            ref={statsRef}
            initial={{ opacity: 0, y: 30 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
          >
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={statsInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="p-6 rounded-2xl text-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3" style={{ color: '#6366F1' }} />
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Interactive Demo Carousel */}
      <section id="demo-carousel" ref={demoRef} className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={demoInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Platform Showcase
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Explore the powerful features that make EduPredict AI the ultimate academic companion
            </p>
          </motion.div>

          <div className="relative">
            {/* Main Carousel */}
            <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">
                {/* Left: Content */}
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col justify-center"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 self-start"
                    style={{ background: `${DEMO_SCREENS[currentSlide].color}25`, border: `1px solid ${DEMO_SCREENS[currentSlide].color}50` }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: DEMO_SCREENS[currentSlide].color }} />
                    <span className="text-sm font-medium" style={{ color: DEMO_SCREENS[currentSlide].color }}>
                      Feature {currentSlide + 1} of {DEMO_SCREENS.length}
                    </span>
                  </div>

                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    {DEMO_SCREENS[currentSlide].title}
                  </h3>
                  
                  <p className="text-gray-400 text-lg mb-8">
                    {DEMO_SCREENS[currentSlide].description}
                  </p>

                  <div className="space-y-3">
                    {DEMO_SCREENS[currentSlide].features.map((feature, i) => (
                      <motion.div
                        key={feature}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: DEMO_SCREENS[currentSlide].color }} />
                        <span className="text-gray-300">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Right: Image */}
                <motion.div
                  key={`img-${currentSlide}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative rounded-2xl overflow-hidden"
                  style={{ minHeight: 400 }}
                >
                  <img 
                    src={DEMO_SCREENS[currentSlide].image} 
                    alt={DEMO_SCREENS[currentSlide].title}
                    className="w-full h-full object-cover"
                  />
                  <div 
                    className="absolute inset-0" 
                    style={{ background: `linear-gradient(135deg, ${DEMO_SCREENS[currentSlide].color}40, transparent)` }}
                  />
                  
                  {/* Floating Stats Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="absolute bottom-6 left-6 right-6 p-4 rounded-xl backdrop-blur-xl"
                    style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)' }}
                  >
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-400" />
                        <span className="text-sm font-medium">Live Demo</span>
                      </div>
                      <div className="text-sm text-gray-300">Real-time updates</div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>

              {/* Carousel Controls */}
              <div className="flex items-center justify-between p-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-2">
                  {DEMO_SCREENS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setCurrentSlide(i);
                        setIsAutoPlaying(false);
                      }}
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: i === currentSlide ? 32 : 8,
                        background: i === currentSlide ? DEMO_SCREENS[currentSlide].color : 'rgba(255,255,255,0.2)'
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={prevSlide}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section ref={featuresRef} className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to excel academically, all in one platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl group cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${feature.gradient}`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Analytics Preview */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold text-white mb-6">
                Real-Time Performance Analytics
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Track your progress with beautiful, interactive visualizations that update in real-time as you study and complete assignments.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: TrendingUp, label: 'Performance Trends', value: '+23% this month' },
                  { icon: Trophy, label: 'Achievement Score', value: '1,247 points' },
                  { icon: Clock, label: 'Study Time', value: '42.5 hours' },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-indigo-400" />
                      <span className="text-white font-medium">{item.label}</span>
                    </div>
                    <span className="text-emerald-400 font-semibold">{item.value}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              {/* Line Chart */}
              <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold">Weekly Progress</h4>
                  <span className="text-emerald-400 text-sm font-medium">+15% improvement</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={CHART_DATA}>
                    <Line type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={3} dot={{ fill: '#6366F1', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h4 className="text-white font-semibold mb-4">Subject Performance</h4>
                <div className="flex items-center gap-6">
                  <RePieChart width={120} height={120}>
                    <Pie data={PIE_DATA} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={50}>
                      {PIE_DATA.map((entry, idx) => (
                        <Cell key={`demo-pie-cell-${idx}-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RePieChart>
                  <div className="space-y-2 flex-1">
                    {PIE_DATA.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                          <span className="text-gray-300 text-sm">{item.name}</span>
                        </div>
                        <span className="text-white font-medium text-sm">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="p-12 rounded-3xl text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6, #EC4899)' }}
          >
            {/* Decorative elements */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl" style={{ background: 'white' }} />
              <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl" style={{ background: 'white' }} />
            </div>

            <div className="relative z-10">
              <Award className="w-16 h-16 text-white mx-auto mb-6" />
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Ready to Transform Your Academic Journey?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of students who are already achieving their goals with EduPredict AI
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/signup"
                  className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 shadow-xl"
                  style={{ background: 'white', color: '#6366F1' }}
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/"
                  className="flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold transition-all hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}
                >
                  Learn More
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-lg">EduPredict AI</span>
          </div>
          <p className="text-gray-400 mb-2">"Your Future, Predicted. Your Success, Guaranteed."</p>
          <p className="text-gray-500 text-sm mb-4">Transform data into destiny with AI-powered academic insights</p>
          <p className="text-gray-500 text-sm">© 2026 EduPredict AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}