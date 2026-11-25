import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Award, Plus, Clock, CheckCircle2, AlertCircle, PlayCircle, HelpCircle } from 'lucide-react';

export const ExaminationsPage = () => {
  const { user, isAdmin, isStaff, isTrainer, isStudent } = useAuth();
  const { success, error } = useToast();

  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Exam Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    courseId: '',
    durationMinutes: 30,
    totalMarks: 50,
    passMarks: 25,
    scheduledDate: new Date().toISOString().split('T')[0],
    questions: [
      {
        questionText: '',
        options: [
          { optionKey: 'A', text: '' },
          { optionKey: 'B', text: '' },
          { optionKey: 'C', text: '' },
          { optionKey: 'D', text: '' },
        ],
        correctOptionKey: 'A',
      },
    ],
  });

  // Live Exam Taking State (Student Portal)
  const [activeExam, setActiveExam] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examResult, setExamResult] = useState(null);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/examinations');
      if (res.data.success) {
        setExams(res.data.data);
      }
    } catch (e) {
      error('Failed to load examinations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
    const loadCourses = async () => {
      try {
        const res = await api.get('/courses');
        if (res.data.success) setCourses(res.data.data);
      } catch (e) {}
    };
    loadCourses();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!activeExam || timeLeft <= 0 || examResult) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeExam, timeLeft, examResult]);

  const startExam = async (exam) => {
    try {
      const res = await api.get(`/examinations/${exam._id}`);
      if (res.data.success) {
        setActiveExam(res.data.data);
        setExamQuestions(res.data.data.questions || []);
        setTimeLeft((res.data.data.durationMinutes || 30) * 60);
        setStudentAnswers({});
        setExamResult(null);
      }
    } catch (e) {
      error('Could not load examination questions');
    }
  };

  const handleSelectOption = (questionId, optionKey) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  const handleSubmitExam = async () => {
    try {
      const studentId = user?.linkedStudentId || user?.linkedStudent?._id;
      if (!studentId) {
        error('Student profile not detected');
        return;
      }

      const answersArray = Object.entries(studentAnswers).map(([qId, optKey]) => ({
        questionId: qId,
        selectedOptionKey: optKey,
      }));

      const res = await api.post(`/examinations/${activeExam._id}/submit`, {
        studentId,
        answers: answersArray,
      });

      if (res.data.success) {
        setExamResult(res.data.data);
        success(`Exam submitted! Score: ${res.data.data.score}/${res.data.data.totalMarks}`);
      }
    } catch (err) {
      error('Exam submission failed');
    }
  };

  const addQuestionField = () => {
    setCreateForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: '',
          options: [
            { optionKey: 'A', text: '' },
            { optionKey: 'B', text: '' },
            { optionKey: 'C', text: '' },
            { optionKey: 'D', text: '' },
          ],
          correctOptionKey: 'A',
        },
      ],
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/examinations', createForm);
      if (res.data.success) {
        success('MCQ Examination created successfully');
        setShowCreateModal(false);
        fetchExams();
      }
    } catch (err) {
      error('Failed to create examination');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Examinations & MCQs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Section 12 MCQ Tests, Live Examination Portal & Instant Evaluation
          </p>
        </div>

        {(isAdmin || isStaff || isTrainer) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create MCQ Exam</span>
          </button>
        )}
      </div>

      {/* Live Exam Mode Active Banner (Student Portal) */}
      {activeExam && !examResult && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                Live Assessment in Progress
              </span>
              <h2 className="text-xl font-bold mt-1">{activeExam.title}</h2>
            </div>
            <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="font-mono text-base font-bold text-amber-400">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {examQuestions.map((q, idx) => (
              <div key={q._id} className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                <h4 className="font-bold text-slate-100 text-sm">
                  {idx + 1}. {q.questionText}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options?.map((opt) => {
                    const isSelected = studentAnswers[q._id] === opt.optionKey;
                    return (
                      <button
                        key={opt.optionKey}
                        type="button"
                        onClick={() => handleSelectOption(q._id, opt.optionKey)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-500 text-white font-bold'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-white font-mono flex items-center justify-center text-xs">
                          {opt.optionKey}
                        </span>
                        <span>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => setActiveExam(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel Exam
            </button>
            <button
              onClick={handleSubmitExam}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
            >
              Finish & Submit Examination &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Exam Result Display */}
      {examResult && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-xl max-w-lg mx-auto animate-in zoom-in-95">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${examResult.isPassed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            {examResult.isPassed ? 'Congratulations! You Passed!' : 'Assessment Completed'}
          </h2>
          <div className="text-4xl font-black text-blue-700 font-mono">
            {examResult.score} / {examResult.totalMarks}
          </div>
          <p className="text-xs text-slate-500">
            Percentage: <strong className="text-slate-800">{examResult.percentage}%</strong> • Passing Marks: {examResult.passMarks}
          </p>
          <button
            onClick={() => {
              setActiveExam(null);
              setExamResult(null);
              fetchExams();
            }}
            className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
          >
            Back to Examinations List
          </button>
        </div>
      )}

      {/* Examinations Directory */}
      {!activeExam && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((exam) => (
            <div
              key={exam._id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    {exam.durationMinutes} Minutes
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700">
                    Pass: {exam.passMarks}/{exam.totalMarks}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-3">{exam.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{exam.description || 'Theory & practical MCQ questions'}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                  <p><strong className="text-slate-800">Course:</strong> {exam.courseId?.name}</p>
                  <p><strong className="text-slate-800">Date:</strong> {new Date(exam.scheduledDate).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => startExam(exam)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Start Examination</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create MCQ Exam Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create MCQ Examination" maxWidth="max-w-3xl">
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Exam Title *</label>
              <input
                type="text"
                required
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                placeholder="e.g. Video Codecs & Editing Workflow Exam"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Course *</label>
              <select
                required
                value={createForm.courseId}
                onChange={(e) => setCreateForm({ ...createForm, courseId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <option value="">-- Choose Course --</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Duration (Min)</label>
              <input
                type="number"
                value={createForm.durationMinutes}
                onChange={(e) => setCreateForm({ ...createForm, durationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Marks</label>
              <input
                type="number"
                value={createForm.totalMarks}
                onChange={(e) => setCreateForm({ ...createForm, totalMarks: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pass Marks</label>
              <input
                type="number"
                value={createForm.passMarks}
                onChange={(e) => setCreateForm({ ...createForm, passMarks: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-emerald-600"
              />
            </div>
          </div>

          {/* Questions Builder */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Questions ({createForm.questions.length})
              </h4>
              <button
                type="button"
                onClick={addQuestionField}
                className="text-blue-600 hover:text-blue-800 font-bold text-xs"
              >
                + Add Another Question
              </button>
            </div>

            {createForm.questions.map((q, qIndex) => (
              <div key={qIndex} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <input
                  type="text"
                  required
                  placeholder={`Question ${qIndex + 1} text`}
                  value={q.questionText}
                  onChange={(e) => {
                    const updated = [...createForm.questions];
                    updated[qIndex].questionText = e.target.value;
                    setCreateForm({ ...createForm, questions: updated });
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold"
                />

                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, optIndex) => (
                    <div key={opt.optionKey} className="flex items-center gap-2">
                      <span className="font-bold font-mono text-slate-500 w-4">{opt.optionKey}.</span>
                      <input
                        type="text"
                        required
                        placeholder={`Option ${opt.optionKey}`}
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...createForm.questions];
                          updated[qIndex].options[optIndex].text = e.target.value;
                          setCreateForm({ ...createForm, questions: updated });
                        }}
                        className="flex-1 px-2.5 py-1 rounded bg-white border border-slate-200 text-xs"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-600 text-xs">Correct Option:</span>
                  {['A', 'B', 'C', 'D'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        const updated = [...createForm.questions];
                        updated[qIndex].correctOptionKey = key;
                        setCreateForm({ ...createForm, questions: updated });
                      }}
                      className={`w-7 h-7 rounded-lg text-xs font-bold ${
                        q.correctOptionKey === key
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700">Publish Examination</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
