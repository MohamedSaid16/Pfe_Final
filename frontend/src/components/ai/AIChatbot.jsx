import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const SparklesIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
  </svg>
);

const SendIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.126A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5" />
  </svg>
);

const XIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const MinusIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
  </svg>
);

const PlusIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const API_URL = 'http://localhost:8081/chat';

// ==================== أسئلة لكل دور حسب اللغة ====================

const getRoleSpecificButtons = (role, lang) => {
  // ADMIN
  if (role === 'admin') {
    if (lang === 'ar') {
      return [
        { icon: "🗑️", question: "كيف أحذف مستخدم؟", answer: "لحذف مستخدم كمدير:\n\n1. اذهب إلى Admin Panel → Users\n2. ابحث عن المستخدم\n3. اضغط 'Delete'\n4. تأكيد الحذف" },
        { icon: "➕", question: "كيف أضيف مستخدم جديد؟", answer: "لإضافة مستخدم:\n\n1. اذهب إلى Admin Panel → Users\n2. املأ النموذج\n3. اضغط 'Create User'" },
        { icon: "📰", question: "كيف أدير الإعلانات؟", answer: "لإدارة الإعلانات:\n\n1. اذهب إلى Admin Panel → Announcements\n2. يمكنك إنشاء، تعديل، حذف" },
        { icon: "📚", question: "كيف أعطي أستاذ مواد معينة؟", answer: "لتعيين أستاذ على مواد:\n\n1. اذهب إلى Admin Panel → Academic Assignments\n2. اختر الأستاذ\n3. اختر المواد\n4. اضغط 'Save'" },
        { icon: "🎯", question: "كيف أنشئ حملة توجيه؟", answer: "لإنشاء حملة توجيه:\n\n1. اذهب إلى Admin Panel → Academic Management\n2. أنشئ Specialites, Promos, Modules\n3. اذهب إلى Campaigns → 'New Campaign'" },
        { icon: "⚙️", question: "كيف أغير إعدادات الموقع؟", answer: "لتغيير إعدادات الموقع:\n\n1. اذهب إلى Admin Panel → Site Settings\n2. عدل الشعار والنصوص\n3. اضغط 'Save'" },
      ];
    }
    return [
      { icon: "🗑️", question: "How to delete a user?", answer: "To delete a user:\n\n1. Admin Panel → Users\n2. Find user\n3. Click 'Delete'\n4. Confirm" },
      { icon: "➕", question: "How to add a new user?", answer: "To add a user:\n\n1. Admin Panel → Users\n2. Fill the form\n3. Click 'Create User'" },
      { icon: "📰", question: "How to manage announcements?", answer: "To manage announcements:\n\n1. Admin Panel → Announcements\n2. Create, edit, or delete" },
      { icon: "📚", question: "How to assign modules to a teacher?", answer: "To assign modules:\n\n1. Admin Panel → Academic Assignments\n2. Select teacher\n3. Check modules\n4. Save" },
      { icon: "🎯", question: "How to create an orientation campaign?", answer: "To create a campaign:\n\n1. Academic Management\n2. Create Specialites, Promos, Modules\n3. Campaigns → New Campaign" },
      { icon: "⚙️", question: "How to change site settings?", answer: "To change site settings:\n\n1. Admin Panel → Site Settings\n2. Modify\n3. Save" },
    ];
  }

  // STUDENT
  if (role === 'student' || role === 'etudiant') {
    if (lang === 'ar') {
      return [
        { icon: "📝", question: "كيف أقدم شكوى؟", answer: "لتقديم شكوى كطالب:\n\n1. سجل الدخول\n2. اذهب إلى Dashboard → Reclamations\n3. اضغط 'New Reclamation'\n4. املأ البيانات\n5. اضغط 'Submit'" },
        { icon: "📄", question: "كيف أقدم مبرر غياب؟", answer: "لتقديم مبرر غياب:\n\n1. سجل الدخول\n2. اذهب إلى Requests\n3. اختر 'Justification'\n4. اضغط 'New Justification'\n5. املأ البيانات\n6. اضغط 'Submit'" },
        { icon: "🔒", question: "كيف أغير كلمة المرور؟", answer: "لتغيير كلمة المرور:\n\n1. سجل الدخول\n2. اذهب إلى Profile → Security\n3. أدخل كلمة المرور الجديدة\n4. اضغط 'Change Password'" },
        { icon: "📋", question: "كيف أختار مشروع PFE؟", answer: "لاختيار مشروع PFE:\n\n1. سجل الدخول\n2. اذهب إلى My Projects\n3. اختر المشروع\n4. اضغط 'Select this PFE'\n5. قم بتأكيد اختيارك" },
        { icon: "🏫", question: "كيف أرى المواد المسجلة؟", answer: "لرؤية المواد المسجلة:\n\n1. سجل الدخول\n2. اذهب إلى Dashboard\n3. ستظهر المواد في 'Your Modules'" },
      ];
    }
    return [
      { icon: "📝", question: "How to submit a complaint?", answer: "To submit a complaint:\n\n1. Log in\n2. Go to Dashboard → Reclamations\n3. Click 'New Reclamation'\n4. Fill in details\n5. Click 'Submit'" },
      { icon: "📄", question: "How to submit an absence justification?", answer: "To submit a justification:\n\n1. Log in\n2. Go to Requests → Justification\n3. Click 'New Justification'\n4. Fill in details\n5. Click 'Submit'" },
      { icon: "🔒", question: "How to change my password?", answer: "To change password:\n\n1. Log in\n2. Go to Profile → Security\n3. Enter new password\n4. Click 'Change Password'" },
      { icon: "📋", question: "How to choose a PFE project?", answer: "To choose PFE:\n\n1. Log in\n2. Go to My Projects\n3. Select your preferred subject\n4. Click 'Select this PFE'\n5. Confirm" },
      { icon: "🏫", question: "How to view my enrolled modules?", answer: "To view modules:\n\n1. Log in\n2. Go to Dashboard\n3. See 'Your Modules' section" },
    ];
  }

  // TEACHER
  if (role === 'teacher' || role === 'enseignant') {
    if (lang === 'ar') {
      return [
        { icon: "👥", question: "كيف أرى طلابي؟", answer: "لرؤية طلابك:\n\n1. سجل الدخول كأستاذ\n2. اذهب إلى Dashboard → Students\n3. اختر المادة" },
        { icon: "💬", question: "كيف أرد على شكوى طالب؟", answer: "للرد على شكوى:\n\n1. اذهب إلى Dashboard → Reclamations\n2. اختر الشكوى\n3. اضغط 'Review'\n4. اكتب الرد\n5. اضغط 'Save'" },
        { icon: "📢", question: "كيف أنشر إعلاناً؟", answer: "لنشر إعلان:\n\n1. اذهب إلى Dashboard → Announcements\n2. اضغط 'New Announcement'\n3. املأ البيانات\n4. اضغط 'Create'" },
        { icon: "📎", question: "كيف أرفع مستنداً؟", answer: "لرفع مستند:\n\n1. اذهب إلى Dashboard → Documents\n2. اضغط 'Upload Document'\n3. اختر الملف\n4. اضغط 'Upload'" },
        { icon: "📅", question: "كيف أدير جدولي؟", answer: "لإدارة جدولك:\n\n1. اذهب إلى Dashboard → Schedule\n2. ستظهر مواعيد المحاضرات" },
      ];
    }
    return [
      { icon: "👥", question: "How to view my students?", answer: "To view students:\n\n1. Go to Dashboard → Students\n2. Select module" },
      { icon: "💬", question: "How to respond to a complaint?", answer: "To respond:\n\n1. Go to Reclamations\n2. Click 'Review'\n3. Write response\n4. Save" },
      { icon: "📢", question: "How to publish an announcement?", answer: "To publish:\n\n1. Go to Announcements\n2. Click 'New Announcement'\n3. Fill in details\n4. Create" },
      { icon: "📎", question: "How to upload a document?", answer: "To upload:\n\n1. Go to Documents\n2. Click 'Upload Document'\n3. Select file\n4. Upload" },
      { icon: "📅", question: "How to manage my schedule?", answer: "To manage schedule:\n\n1. Go to Schedule\n2. View lectures" },
    ];
  }

  return [];
};

// ==================== Helper functions ====================

const detectLanguage = () => {
  const savedLang = localStorage.getItem('i18nextLng') || localStorage.getItem('language');
  if (savedLang === 'ar') return 'ar';
  if (savedLang === 'fr') return 'fr';
  if (savedLang === 'en') return 'en';
  
  const htmlLang = document.documentElement.lang || 'en';
  const userLang = navigator.language || 'en';
  if (htmlLang === 'ar' || userLang.startsWith('ar')) return 'ar';
  if (htmlLang === 'fr' || userLang.startsWith('fr')) return 'fr';
  return 'en';
};

const getStorageKey = (userId) => {
  if (userId) return `g11_chat_sessions_${userId}`;
  return null;
};

const getWelcomeMessage = (lang, isLoggedIn) => {
  if (isLoggedIn) {
    if (lang === 'ar') return "👋 مرحباً! أنا المساعد الذكي لمنصة جامعة ابن خلدون. اسألني أي شيء.";
    if (lang === 'fr') return "👋 Bonjour! Je suis l'assistant intelligent de l'Université Ibn Khaldoun.";
    return "👋 Hello! I am University Ibn Khaldoun intelligent assistant.";
  }
  return "👋 مرحباً! يرجى تسجيل الدخول لاستخدام الشات بوت.";
};

const createWelcomeSession = (lang, isLoggedIn) => {
  return {
    id: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    title: isLoggedIn ? 'New conversation' : 'محادثة جديدة',
    createdAt: new Date().toISOString(),
    messages: [{
      id: Date.now(),
      sender: 'bot',
      content: getWelcomeMessage(lang, isLoggedIn),
      time: new Date().toLocaleTimeString(),
    }],
  };
};

const formatDate = (date) =>
  date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' });

// ==================== Main Component ====================

export default function AIChatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [currentLang, setCurrentLang] = useState('en');

  const userId = user?.id || user?.userId;
  const userRole = user?.role || user?.roles?.[0];
  const normalizedRole = userRole ? userRole.toLowerCase() : null;

  console.log("🔍 userId:", userId, "role:", normalizedRole);

  // ✅ Hooks
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId, isTyping]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    const lang = detectLanguage();
    setCurrentLang(lang);
  }, []);

  // ✅ تحميل الجلسات
  useEffect(() => {
    if (!userId) {
      setSessions([]);
      return;
    }
    
    const key = getStorageKey(userId);
    if (!key) return;
    
    const saved = localStorage.getItem(key);
    const isLoggedIn = true;
    
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed);
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id);
      }
    } else {
      const welcomeSession = createWelcomeSession(currentLang, isLoggedIn);
      setSessions([welcomeSession]);
      setCurrentSessionId(welcomeSession.id);
      localStorage.setItem(key, JSON.stringify([welcomeSession]));
    }
  }, [userId, currentLang]);

  // ✅ إذا لم يكن المستخدم مسجلاً
  if (!user || !userId) {
    return null;
  }

  const saveSessions = (newSessions) => {
    const key = getStorageKey(userId);
    if (key) {
      localStorage.setItem(key, JSON.stringify(newSessions));
    }
    setSessions(newSessions);
  };

  const getCurrentSession = () => {
    return sessions.find(s => s.id === currentSessionId);
  };

  const addButtonMessage = (question, answer) => {
    const currentSession = getCurrentSession();
    if (!currentSession) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      content: question,
      time: new Date().toLocaleTimeString(),
    };
    
    const botMsg = {
      id: Date.now() + 1,
      sender: 'bot',
      content: answer,
      time: new Date().toLocaleTimeString(),
    };
    
    const updatedMessages = [...currentSession.messages, userMsg, botMsg];
    const updatedSessions = sessions.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: updatedMessages, title: s.title === 'New conversation' ? question.substring(0, 25) : s.title }
        : s
    );
    
    saveSessions(updatedSessions);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const currentSession = getCurrentSession();
    if (!currentSession) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      content: trimmed,
      time: new Date().toLocaleTimeString(),
    };
    
    const updatedMessages = [...currentSession.messages, userMsg];
    let updatedSessions = sessions.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: updatedMessages }
        : s
    );
    
    if (currentSession.messages.filter(m => m.sender === 'user').length === 0) {
      const newTitle = trimmed.length > 25 ? trimmed.substring(0, 22) + '...' : trimmed;
      updatedSessions = updatedSessions.map(s =>
        s.id === currentSessionId ? { ...s, title: newTitle } : s
      );
    }
    
    saveSessions(updatedSessions);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          sessionId: currentSession.id,
          userId: userId,
          role: normalizedRole,
        }),
      });
      
      let reply;
      if (response.ok) {
        const data = await response.json();
        reply = data.reply || data.message || 'شكراً لرسالتك.';
      } else {
        reply = "⚠️ لا يمكن الاتصال بخادم الشات.";
      }
      
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        content: reply,
        time: new Date().toLocaleTimeString(),
      };
      
      const finalMessages = [...updatedMessages, botMsg];
      const finalSessions = updatedSessions.map(s => 
        s.id === currentSessionId ? { ...s, messages: finalMessages } : s
      );
      saveSessions(finalSessions);
      
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = "⚠️ حدث خطأ.";
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        content: errorMsg,
        time: new Date().toLocaleTimeString(),
      };
      const finalMessages = [...updatedMessages, botMsg];
      const finalSessions = updatedSessions.map(s => 
        s.id === currentSessionId ? { ...s, messages: finalMessages } : s
      );
      saveSessions(finalSessions);
    } finally {
      setIsTyping(false);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentSession = getCurrentSession();
  const currentMessages = currentSession?.messages || [];
  const roleButtons = getRoleSpecificButtons(normalizedRole, currentLang);
  // استبدل السطر القديم بهذا
const shouldShowButtons = currentMessages[currentMessages.length - 1]?.sender === 'bot';

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-brand text-white rounded-full shadow-card flex items-center justify-center hover:bg-brand-hover transition-all duration-200 group"
      >
        <SparklesIcon className="w-6 h-6 group-hover:scale-110 transition-transform duration-150" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] flex flex-col bg-surface border border-edge rounded-xl shadow-card overflow-hidden transition-all duration-200 ${isMinimized ? 'h-14' : 'h-[560px] max-h-[calc(100vh-6rem)]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-brand text-white shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSidebar(!showSidebar)} className="p-1 rounded-md hover:bg-white/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <SparklesIcon className="w-5 h-5" />
          <div>
            <h3 className="text-sm font-semibold leading-none">AI Assistant</h3>
            {!isMinimized && <p className="text-xs text-white/70 mt-0.5">متصل</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 rounded-md hover:bg-white/20"><MinusIcon className="w-4 h-4" /></button>
          <button onClick={() => { setIsOpen(false); setIsMinimized(false); setShowSidebar(false); }} className="p-1 rounded-md hover:bg-white/20"><XIcon className="w-4 h-4" /></button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {showSidebar && (
            <div className="w-40 bg-surface-200 dark:bg-canvas border-r border-edge overflow-y-auto shrink-0">
              <div className="p-2 border-b border-edge">
                <button onClick={() => {
                  const newSession = createWelcomeSession(currentLang, true);
                  saveSessions([newSession, ...sessions]);
                  setCurrentSessionId(newSession.id);
                  setShowSidebar(false);
                }} className="w-full py-2 px-3 bg-brand text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-brand-hover">
                  <PlusIcon className="w-4 h-4" />
                  محادثة جديدة
                </button>
              </div>
              <div className="p-2 space-y-1">
                {[...sessions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((session) => (
                  <div key={session.id} onClick={() => { setCurrentSessionId(session.id); setShowSidebar(false); }} className={`group relative p-2 rounded-lg cursor-pointer transition-colors ${session.id === currentSessionId ? 'bg-brand/10 border border-brand/30' : 'hover:bg-edge/50'}`}>
                    <div className="text-xs font-medium text-ink truncate pr-5">{session.title}</div>
                    <div className="text-[10px] text-ink-tertiary mt-0.5">{formatDate(new Date(session.createdAt))}</div>
                    <button onClick={(e) => { e.stopPropagation(); if (sessions.length === 1) { alert('لا يمكن حذف آخر محادثة'); return; } if (window.confirm('هل أنت متأكد من حذف هذه المحادثة؟')) { const newSessions = sessions.filter(s => s.id !== session.id); saveSessions(newSessions); if (currentSessionId === session.id) setCurrentSessionId(newSessions[0].id); } }} className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-ink-tertiary hover:text-danger">
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-200 dark:bg-canvas">
              {currentMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 ${msg.sender === 'user' ? 'bg-brand text-white' : 'bg-surface border border-edge text-ink'}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-white/60' : 'text-ink-muted'}`}>{msg.time}</p>
                  </div>
                </div>
              ))}

              {shouldShowButtons && roleButtons.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    <p className="text-xs font-medium text-ink-muted uppercase tracking-wider">أسئلة سريعة</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {roleButtons.map((btn, idx) => (
                      <button key={idx} onClick={() => addButtonMessage(btn.question, btn.answer)} className="text-left p-3 rounded-lg bg-surface-200 border border-edge hover:border-brand/50 hover:bg-brand-light/20 transition-all duration-150 group">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{btn.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-ink group-hover:text-brand transition-colors">{btn.question}</p>
                            <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">{btn.answer.substring(0, 70)}...</p>
                          </div>
                          <svg className="w-4 h-4 text-ink-muted group-hover:text-brand transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-surface border border-edge rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-ink-muted rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-ink-muted rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1.5 h-1.5 bg-ink-muted rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="shrink-0 border-t border-edge bg-surface p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب رسالة..."
                  rows={1}
                  className="flex-1 bg-control-bg border border-control-border rounded-md py-2 px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 resize-none max-h-24 overflow-y-auto"
                  style={{ minHeight: '40px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="shrink-0 w-10 h-10 bg-brand text-white rounded-md flex items-center justify-center hover:bg-brand-hover transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SendIcon className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-ink-muted mt-2 text-center">إجابات AI للإرشاد فقط - تحقق من المعلومات المهمة</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}