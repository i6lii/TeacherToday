import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Check,
  FileText,
  Gamepad2,
  Globe2,
  Laptop,
  Lightbulb,
  Mail,
  MessageCircle,
  Presentation,
  Puzzle,
  RefreshCw,
  Rocket,
  Search,
  Sprout,
  Target,
  UsersRound,
  Video,
  Radio,
  RotateCcw,
  Sparkles,
  Users,
} from 'lucide-react'
import { supabase } from './lib/supabase'
import './App.css'

const QUESTIONS = [
  {
    id: 'q1',
    title: 'عندما تريد شرح مفهوم صعب للطلاب، ماذا تختار؟',
    options: [
      { icon: Video, label: 'فيديو وشرح بصري' },
      { icon: Gamepad2, label: 'تجربة أو اختبار تفاعلي' },
      { icon: Puzzle, label: 'نشاط جماعي' },
      { icon: Bot, label: 'أداة ذكاء اصطناعي' },
      { icon: Presentation, label: 'عرض تفاعلي' },
    ],
  },
  {
    id: 'q2',
    title: 'إذا لاحظت أن الطلاب لم يفهموا الدرس، ماذا تفعل؟',
    options: [
      { icon: RefreshCw, label: 'أعيد الشرح بطريقة مختلفة' },
      { icon: Gamepad2, label: 'أحوّل الدرس إلى نشاط تفاعلي' },
      { icon: Bot, label: 'أستخدم الذكاء الاصطناعي لتبسيط المفهوم' },
      { icon: UsersRound, label: 'أجعل الطلاب يتعلمون معًا' },
      { icon: Lightbulb, label: 'أبحث عن طريقة جديدة للشرح' },
    ],
  },
  {
    id: 'q3',
    title: 'كيف تستخدم الذكاء الاصطناعي في التعليم؟',
    options: [
      { icon: FileText, label: 'إعداد المحتوى والمواد التعليمية' },
      { icon: Lightbulb, label: 'توليد أفكار وأنشطة' },
      { icon: BarChart3, label: 'تحليل أداء الطلاب' },
      { icon: Search, label: 'البحث والتحضير' },
      { icon: Bot, label: 'مساعد ذكي للطلاب' },
      { icon: Sprout, label: 'ما زلت أستكشف إمكاناته' },
    ],
  },
  {
    id: 'q4',
    title: 'أي وصف أقرب لك كمعلّم؟',
    options: [
      { icon: BookOpen, label: 'المعلّم التقليدي', description: 'أعتمد على الأساليب التعليمية المجربة.' },
      { icon: Laptop, label: 'المعلّم الرقمي', description: 'أدمج الأدوات والمنصات الرقمية في تدريسي.' },
      { icon: Bot, label: 'المعلّم المدعوم بالذكاء الاصطناعي', description: 'أستخدم AI لتطوير التجربة التعليمية.' },
      { icon: Rocket, label: 'المعلّم المستكشف', description: 'أجرب التقنيات الجديدة وأبحث عن طرق مختلفة للتعليم.' },
    ],
  },
  {
    id: 'q5',
    title: 'لو كان لديك مساعد ذكي داخل القاعة، ماذا تريد منه أن يفعل؟',
    options: [
      { icon: MessageCircle, label: 'يجيب عن أسئلة الطلاب' },
      { icon: BarChart3, label: 'يحلل مستوى فهم الطلاب' },
      { icon: FileText, label: 'يساعدني في إعداد المحتوى' },
      { icon: Lightbulb, label: 'يقترح أنشطة تعليمية' },
      { icon: Target, label: 'يخصص تجربة التعلم لكل طالب' },
    ],
  },
]

const STORAGE_KEY = 'teacher-today-data-v1'
const EMPTY_DATA = { participants: [], answers: [] }

function readLocalData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    return saved && Array.isArray(saved.participants) && Array.isArray(saved.answers)
      ? saved
      : EMPTY_DATA
  } catch {
    return EMPTY_DATA
  }
}

function getAnswerText(answer) {
  return answer.answer
}

function App() {
  const [phase, setPhase] = useState('welcome')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [participantName, setParticipantName] = useState('')
  const [participant, setParticipant] = useState(null)
  const [participants, setParticipants] = useState([])
  const [answers, setAnswers] = useState([])
  const [connection, setConnection] = useState(supabase ? 'connecting' : 'local')
  const [nameError, setNameError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!supabase) {
      const saved = readLocalData()
      setParticipants(saved.participants)
      setAnswers(saved.answers)

      const syncLocal = (data) => {
        if (data?.type === 'teacher-today-update') {
          setParticipants(data.payload.participants)
          setAnswers(data.payload.answers)
        }
      }
      const syncStorage = (event) => {
        if (event.key === STORAGE_KEY) {
          const data = readLocalData()
          setParticipants(data.participants)
          setAnswers(data.answers)
        }
      }
      const channel = 'BroadcastChannel' in window ? new BroadcastChannel(STORAGE_KEY) : null
      channel?.addEventListener('message', syncLocal)
      window.addEventListener('storage', syncStorage)
      return () => {
        channel?.close()
        window.removeEventListener('storage', syncStorage)
      }
    }

    let alive = true
    const mergeParticipant = (incoming) => {
      setParticipants((current) => current.some((item) => item.id === incoming.id)
        ? current.map((item) => item.id === incoming.id ? { ...item, ...incoming } : item)
        : [...current, incoming].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)))
    }
    const mergeAnswer = (incoming) => {
      setAnswers((current) => current.some((item) => item.id === incoming.id)
        ? current.map((item) => item.id === incoming.id ? { ...item, ...incoming } : item)
        : [...current, incoming].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)))
    }

    const loadData = async () => {
      const [participantResult, answerResult] = await Promise.all([
        supabase.from('participants').select('*').order('created_at', { ascending: true }),
        supabase.from('answers').select('*').order('created_at', { ascending: true }),
      ])
      if (!alive) return
      if (participantResult.error || answerResult.error) {
        setConnection('error')
        setSaveError('تعذر تحميل المشاركات. تأكد من تشغيل مخطط قاعدة البيانات في Supabase.')
        return
      }
      participantResult.data.forEach(mergeParticipant)
      answerResult.data.forEach(mergeAnswer)
      setConnection('live')
    }

    loadData()
    const subscription = supabase
      .channel('teacher-today-wall')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, (event) => {
        if (event.eventType === 'INSERT') mergeParticipant(event.new)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'answers' }, (event) => {
        if (event.eventType === 'INSERT' || event.eventType === 'UPDATE') mergeAnswer(event.new)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnection('live')
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setConnection('error')
      })

    return () => {
      alive = false
      supabase.removeChannel(subscription)
    }
  }, [])

  const currentQuestion = QUESTIONS[questionIndex]
  const currentQuestionAnswers = useMemo(
    () => answers.filter((answer) => answer.question_id === currentQuestion?.id),
    [answers, currentQuestion],
  )
  const aiUsage = useMemo(() => {
    const counts = QUESTIONS[2].options.map((option) => ({
      ...option,
      count: answers.filter((answer) => answer.question_id === 'q3' && answer.answer === option.label).length,
    }))
    return counts
  }, [answers])
  const firstQuestionCounts = useMemo(() => {
    const questionAnswers = answers.filter((answer) => answer.question_id === 'q1')
    const categories = [
      { icon: Bot, label: 'الذكاء الاصطناعي', match: 'أداة ذكاء اصطناعي' },
      { icon: Video, label: 'الفيديو التعليمي', match: 'فيديو وشرح بصري' },
      { icon: Puzzle, label: 'الأنشطة التفاعلية', match: 'نشاط جماعي' },
      { icon: Laptop, label: 'اختيارات أخرى', match: null },
    ]
    return categories.map((category) => ({
      ...category,
      count: category.match
        ? questionAnswers.filter((answer) => answer.answer === category.match).length
        : questionAnswers.filter((answer) => !['أداة ذكاء اصطناعي', 'فيديو وشرح بصري', 'نشاط جماعي'].includes(answer.answer)).length,
    }))
  }, [answers])

  const persistLocal = (nextParticipants, nextAnswers) => {
    const payload = { participants: nextParticipants, answers: nextAnswers }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    setParticipants(nextParticipants)
    setAnswers(nextAnswers)
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(STORAGE_KEY)
      channel.postMessage({ type: 'teacher-today-update', payload })
      channel.close()
    }
  }

  const startParticipant = async (event) => {
    event.preventDefault()
    const cleanName = participantName.trim()
    if (!cleanName) {
      setNameError('اكتب اسمك لنضيف مشاركتك إلى لوحة المعلّمين.')
      return
    }
    setSaving(true)
    setNameError('')
    setSaveError('')
    const record = { name: cleanName }
    if (supabase) {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        setSaveError('تعذر بدء جلسة المشاركة. تحقّق من اتصال Supabase وحاول مجددًا.')
        setSaving(false)
        return
      }
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
      if (authError) {
        setSaveError('فعّل تسجيل الدخول المجهول في Supabase حتى نتمكن من حفظ مشاركتك بأمان.')
        setSaving(false)
        return
      }
      const { data, error } = await supabase.from('participants').insert({ ...record, owner_id: authData.user.id }).select().single()
      if (error) {
        setSaveError('لم نتمكن من حفظ الاسم. تحقّق من اتصال قاعدة البيانات وحاول مجددًا.')
        setSaving(false)
        return
      }
      setParticipant(data)
      setParticipants((current) => current.some((item) => item.id === data.id) ? current : [...current, data])
    } else {
      const data = { id: crypto.randomUUID(), name: cleanName, created_at: new Date().toISOString() }
      setParticipant(data)
      persistLocal([...participants, data], answers)
    }
    setQuestionIndex(0)
    setPhase('quiz')
    setSaving(false)
  }

  const chooseAnswer = async (option) => {
    if (!participant || saving) return
    setSaving(true)
    setSaveError('')
    const record = { participant_id: participant.id, question_id: currentQuestion.id, answer: option.label }
    if (supabase) {
      const { data, error } = await supabase.from('answers').upsert(record, { onConflict: 'participant_id,question_id' }).select().single()
      if (error) {
        setSaveError('لم تُحفظ الإجابة. تحقّق من الاتصال ثم اخترها مجددًا.')
        setSaving(false)
        return
      }
      setAnswers((current) => current.some((item) => item.id === data.id) ? current : [...current, data])
    } else {
      const data = { ...record, id: crypto.randomUUID(), created_at: new Date().toISOString(), participant_name: participant.name }
      persistLocal(participants, [...answers.filter((item) => !(item.participant_id === participant.id && item.question_id === currentQuestion.id)), data])
    }
    if (questionIndex === QUESTIONS.length - 1) setPhase('done')
    else setQuestionIndex((current) => current + 1)
    setSaving(false)
  }

  const newParticipant = () => {
    setParticipant(null)
    setParticipantName('')
    setQuestionIndex(0)
    setSaveError('')
    setNameError('')
    setPhase('name')
  }

  const latestParticipants = [...participants].reverse().slice(0, 7)
  const latestAnswers = [...answers].reverse().slice(0, 7)
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); setPhase('welcome') }}>
          <img className="brand-mark" src={`${import.meta.env.BASE_URL}td-logo.svg`} alt="TD" />
          <span className="brand-copy"><strong>معلّم اليوم</strong></span>
        </a>
        <div className="topbar-actions">
          <button className={`results-button ${phase === 'results' ? 'is-active' : ''}`} onClick={() => setPhase(phase === 'results' ? 'welcome' : 'results')}>
            <BarChart3 size={17} />
            <span>نتائج التجربة</span>
          </button>
        </div>
      </header>

      <main className={`main-layout ${phase === 'results' ? 'results-layout' : ''}`}>
        <section className="experience-panel">
          {phase === 'welcome' && (
            <div className="welcome-screen screen-enter">
              <div className="welcome-title-wrap">
                <div className="title-emblem"><BookOpen size={27} strokeWidth={1.65} /></div>
                <p className="eyebrow">من السبورة إلى الشاشة</p>
                <h1>معلّم <span>اليوم</span></h1>
                <p className="welcome-description">كيف تغيّرت طريقة التعليم؟</p>
                <p className="welcome-invite">شاركنا طريقتك في استخدام التقنية داخل التعليم.</p>
                <button className="primary-button start-button" onClick={() => setPhase('name')}>
                  ابدأ التجربة <ArrowLeft size={19} />
                </button>
              </div>
              <div className="learning-path" aria-label="رحلة تطور التعليم">
                <div><span className="path-icon"><BookOpen size={17} /></span><small>التعليم التقليدي</small></div>
                <i />
                <div><span className="path-icon"><Laptop size={17} /></span><small>التعليم الرقمي</small></div>
                <i />
                <div><span className="path-icon path-icon-highlight"><Bot size={16} /></span><small>الذكاء الاصطناعي</small></div>
                <i />
                <div><span className="path-icon"><UsersRound size={17} /></span><small>المعلّم + التقنية</small></div>
              </div>
              <div className="welcome-bottom"><span>كل إجابة تضيف صوتًا إلى لوحة معلّمي اليوم</span><span>01 — 05</span></div>
            </div>
          )}

          {phase === 'name' && (
            <div className="name-screen screen-enter">
              <button className="back-link" onClick={() => setPhase('welcome')}><ArrowRight size={16} /> العودة</button>
              <div className="screen-icon"><Users size={22} /></div>
              <p className="eyebrow">خطوتك الأولى</p>
              <h1>أولًا، عرّفنا بنفسك</h1>
              <p className="screen-description">سيظهر اسمك بجانب اختياراتك على لوحة المعلّمين.</p>
              <form className="name-form" onSubmit={startParticipant}>
                <label htmlFor="participant-name">اكتب اسمك</label>
                <input
                  id="participant-name"
                  autoFocus
                  maxLength={70}
                  placeholder="مثال: د. سارة العتيبي"
                  value={participantName}
                  onChange={(event) => { setParticipantName(event.target.value); setNameError('') }}
                />
                {nameError && <p className="form-error">{nameError}</p>}
                <button className="primary-button" type="submit" disabled={saving}>
                  {saving ? 'جارٍ الحفظ...' : 'ابدأ'} <ArrowLeft size={19} />
                </button>
              </form>
              {saveError && <p className="form-error" role="alert">{saveError}</p>}
              <div className="privacy-note"><Users size={15} /> المشاركة تُضاف إلى سجل الفعالية ولا تُحذف</div>
            </div>
          )}

          {phase === 'quiz' && currentQuestion && (
            <div className="quiz-screen screen-enter">
              <div className="question-meta">
                <button className="back-link" onClick={() => questionIndex === 0 ? setPhase('name') : setQuestionIndex((index) => index - 1)}>
                  <ArrowRight size={16} /> السابق
                </button>
                <span className="question-count">{String(questionIndex + 1).padStart(2, '0')} <i>/</i> {String(QUESTIONS.length).padStart(2, '0')}</span>
              </div>
              <div className="progress-track"><span style={{ width: `${((questionIndex + 1) / QUESTIONS.length) * 100}%` }} /></div>
              <div className="question-heading">
                <p className="eyebrow">سؤال {['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس'][questionIndex]}</p>
                <h1>{currentQuestion.title}</h1>
                <p className="screen-description">اختر الإجابة الأقرب إلى تجربتك.</p>
              </div>
              <div className={`answer-options ${questionIndex === 3 ? 'answer-options-descriptive' : ''}`}>
                {currentQuestion.options.map((option, index) => (
                  <button className="answer-option" key={option.label} disabled={saving} onClick={() => chooseAnswer(option)}>
                    <span className="option-icon"><option.icon size={19} strokeWidth={1.75} /></span>
                    <span className="option-copy"><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
                    <span className="option-arrow"><ArrowLeft size={16} /></span>
                    <span className="option-index">{String(index + 1).padStart(2, '0')}</span>
                  </button>
                ))}
              </div>
              {saveError && <p className="form-error" role="alert">{saveError}</p>}
              <div className="quiz-footer"><span><i className="yellow-dot" /> اختيار واحد · إجابتك تُضاف مباشرة</span><span>{participant?.name}</span></div>
            </div>
          )}

          {phase === 'done' && (
            <div className="done-screen screen-enter">
              <div className="success-seal"><Check size={31} strokeWidth={1.7} /></div>
              <p className="eyebrow">اكتملت مشاركتك</p>
              <h1>شكرًا لك،<br /><span>معلّم اليوم!</span></h1>
              <p className="done-description">إجاباتك أصبحت جزءًا من التجربة الجماعية لمعلّمي اليوم.</p>
              <div className="done-quote">«التقنية لا تستبدل المعلّم، بل توسّع أدواته.»<small>معلّم اليوم يصنع تعليم الغد.</small></div>
              <div className="done-actions">
                <button className="primary-button new-participant-button" onClick={newParticipant}><RotateCcw size={18} /> مشاركة جديدة</button>
                <button className="text-button" onClick={() => setPhase('results')}>استكشف النتائج <ArrowLeft size={16} /></button>
              </div>
            </div>
          )}

          {phase === 'results' && (
            <div className="results-screen screen-enter">
              <div className="results-heading">
                <div><p className="eyebrow">الصورة تتشكّل مع كل إجابة</p><h1>معلّمو اليوم <span>بالأرقام</span></h1></div>
                <span className="live-tag"><Radio size={14} /> مباشر</span>
              </div>
              <div className="stat-grid">
                <article className="stat-card stat-card-main"><Users size={19} /><strong>{participants.length}</strong><span>معلّمًا شاركوا في التجربة</span></article>
                {firstQuestionCounts.map((item) => {
                  const total = answers.filter((answer) => answer.question_id === 'q1').length
                  const percentage = total ? Math.round((item.count / total) * 100) : 0
                  return <article className="stat-card" key={item.label}><span className="stat-icon"><item.icon size={17} /></span><strong>{percentage}%</strong><span>{item.label}</span></article>
                })}
              </div>
              <div className="analytics-grid">
                <section className="chart-section">
                  <div className="section-heading"><div><p className="eyebrow">السؤال الثالث</p><h2>أكثر ما يريده المعلّمون من الذكاء الاصطناعي</h2></div><span className="response-total">{answers.filter((answer) => answer.question_id === 'q3').length} إجابة</span></div>
                  <div className="bar-list">
                    {[...aiUsage].sort((a, b) => b.count - a.count).map((item, index) => {
                      const max = Math.max(...aiUsage.map((answer) => answer.count), 1)
                      return <div className="bar-row" key={item.label}><div className="bar-label"><span><item.icon size={15} /> {item.label}</span><b>{item.count}</b></div><div className="bar-track"><span className={index === 0 && item.count ? 'bar-fill bar-fill-highlight' : 'bar-fill'} style={{ width: `${(item.count / max) * 100}%` }} /></div></div>
                    })}
                  </div>
                </section>
                <section className="directory-section">
                  <div className="section-heading"><div><p className="eyebrow">كل صوت مهم</p><h2>معلّمو اليوم</h2></div><span className="response-total">{participants.length} مشارك</span></div>
                  {participants.length === 0 ? <div className="empty-state">ستظهر الأسماء والاختيارات هنا مع أول مشاركة.</div> : (
                    <div className="participant-directory">
                      {[...participants].reverse().map((person) => {
                        const personAnswers = answers.filter((answer) => answer.participant_id === person.id)
                        const profile = QUESTIONS[3].options.find((option) => option.label === personAnswers.find((answer) => answer.question_id === 'q4')?.answer)
                        const choiceSummary = QUESTIONS.flatMap((question) => {
                          const answer = personAnswers.find((item) => item.question_id === question.id)
                          return answer ? [answer.answer] : []
                        }).join(' · ')
                        return <article className="directory-person" key={person.id}><span className="person-avatar">{person.name.trim().charAt(0)}</span><div><strong>{person.name}</strong><small>{profile ? profile.label : `${personAnswers.length} من ٥ إجابات`}</small><small className="choice-summary">{choiceSummary || 'لم يبدأ الإجابة بعد'}</small></div><span className="person-answer-count">{personAnswers.length}/٥</span></article>
                      })}
                    </div>
                  )}
                </section>
              </div>
              <div className="results-bottom-quote"><Sparkles size={17} /> التقنية لا تستبدل المعلّم، بل توسّع أدواته. <span>معلّم اليوم يصنع تعليم الغد.</span></div>
            </div>
          )}
        </section>

        {phase !== 'results' && (
          <aside className="wall-panel">
            <div className="wall-topline"><div><span className="wall-live-dot" aria-label="تحديث مباشر" /></div><span className="wall-count"><Users size={14} /> {participants.length}</span></div>
            <div className="wall-heading"><p className="eyebrow">الأثر الجماعي</p><h2>ماذا اختار<br />المعلّمون؟</h2><p>كل إجابة تبقى، وكل صوت يصنع الصورة كاملة.</p></div>
            <div className="wall-divider"><span>آخر الإجابات</span><i /></div>
            {latestAnswers.length === 0 ? (
              <div className="wall-empty"><span className="wall-empty-icon"><Users size={20} /></span><strong>ستبدأ اللوحة بك</strong><small>أول مشاركة تضيء هذا الجدار.</small></div>
            ) : (
              <div className="wall-list" aria-live="polite">
                {latestAnswers.map((answer) => {
                  const person = participants.find((item) => item.id === answer.participant_id)
                  const name = person?.name || answer.participant_name || 'معلّم اليوم'
                  const question = QUESTIONS.find((item) => item.id === answer.question_id)
                  const option = question?.options.find((item) => item.label === getAnswerText(answer))
                  const OptionIcon = option?.icon || Bot
                  return <article className="wall-answer" key={answer.id}><span className="wall-avatar">{name.trim().charAt(0)}</span><div className="wall-answer-copy"><strong>{name}</strong><small>{question?.title}</small><span><OptionIcon size={13} /> {getAnswerText(answer)}</span></div></article>
                })}
              </div>
            )}
            <div className="wall-chart-heading"><div><span>اختيارات هذا السؤال</span><span>{currentQuestionAnswers.length} إجابة</span></div>
              {currentQuestion?.options.slice(0, 4).map((option) => {
                const count = currentQuestionAnswers.filter((answer) => answer.answer === option.label).length
                const maximum = Math.max(...currentQuestion.options.map((item) => currentQuestionAnswers.filter((answer) => answer.answer === item.label).length), 1)
                return <div className="mini-bar-row" key={option.label}><span><option.icon size={13} /> {option.label}</span><b>{count}</b><div className="mini-track"><i style={{ width: `${(count / maximum) * 100}%` }} /></div></div>
              })}
            </div>
            <div className="wall-participants"><div className="wall-participants-heading"><span>المشاركون</span><span>{participants.length} إجماليًا</span></div>
              {latestParticipants.length === 0 ? <p className="participants-empty">ستُحفظ الأسماء هنا بعد المشاركة.</p> : latestParticipants.map((person, index) => <div className="participant-chip" key={person.id}><span className={`tiny-avatar tiny-avatar-${index % 4}`}>{person.name.trim().charAt(0)}</span><span>{person.name}</span><i /></div>)}
            </div>
            <button className="wall-results-link" onClick={() => setPhase('results')}>لوحة النتائج الكاملة <ArrowLeft size={15} /></button>
          </aside>
        )}
      </main>

      <footer className="site-footer">
        <strong className="footer-title">مطوّرتا الموقع</strong>
        <div className="footer-developers">
          <section className="footer-developer">
            <strong>المطورة يارا خالد آل عقيل</strong>
            <a href="https://www.linkedin.com/in/yara-alaqil-936a39331" target="_blank" rel="noreferrer"><span className="linkedin-mark" aria-hidden="true">in</span> LinkedIn</a>
            <a href="https://i6lii.github.io/yaraALaqeel/ecyara.html" target="_blank" rel="noreferrer"><Globe2 size={15} /> الموقع الإلكتروني</a>
          </section>
          <section className="footer-developer">
            <strong>المطورة الجازي ناجي آل قريش</strong>
            <a href="https://www.linkedin.com/in/aljazi-naje-017725407?utm_source=share_via&utm_content=profile&utm_medium=member_ios" target="_blank" rel="noreferrer"><span className="linkedin-mark" aria-hidden="true">in</span> LinkedIn</a>
            <a href="mailto:aljazinaje@gmail.com"><Mail size={15} /> البريد الإلكتروني</a>
          </section>
        </div>
      </footer>
    </div>
  )
}

export default App