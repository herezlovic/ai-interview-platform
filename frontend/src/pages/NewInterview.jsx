import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { AlertCircle, Loader2, Sparkles, Upload, Video } from 'lucide-react'
import { interviewAPI } from '../utils/api'

export default function NewInterview() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [form, setForm] = useState({
    candidate_name: 'Alex Rivera',
    position: 'Staff Engineer',
    interviewer: '',
    job_description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('demo')

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.webm', '.mov', '.avi'] },
    maxFiles: 1,
    disabled: mode === 'demo',
  })

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (v) fd.append(k, v)
      })
      if (file && mode === 'upload') fd.append('video', file)
      const { data: session } = await interviewAPI.create(fd)
      if (mode === 'demo') await interviewAPI.runDemo(session.id, form.position)
      navigate(`/app/interviews/${session.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to start analysis')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl animate-rise">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">New analysis</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900">
        Evaluate an interview
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        Demo Mode is always available. Upload mode uses Whisper + DeepFace when the API has ML enabled.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-2 rounded-2xl border border-[var(--line)] bg-white/60 p-1.5">
        {[
          { key: 'demo', label: 'Demo Mode', icon: Sparkles },
          { key: 'upload', label: 'Upload video', icon: Upload },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
              mode === key ? 'bg-teal-600 text-white shadow-soft' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {mode === 'upload' ? (
        <div
          {...getRootProps()}
          className={`mt-6 cursor-pointer rounded-[1.75rem] border-2 border-dashed p-12 text-center transition ${
            isDragActive
              ? 'border-teal-500 bg-teal-50/60'
              : file
                ? 'border-emerald-400 bg-emerald-50/40'
                : 'border-[var(--line)] bg-white/50'
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <>
              <Video className="mx-auto mb-3 text-emerald-600" size={36} />
              <p className="font-medium text-emerald-700">{file.name}</p>
              <p className="mt-1 text-xs text-ink-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </>
          ) : (
            <>
              <Upload className="mx-auto mb-3 text-ink-500" size={36} />
              <p className="font-medium text-ink-900">
                {isDragActive ? 'Drop video here' : 'Drag & drop interview video'}
              </p>
              <p className="mt-1 text-xs text-ink-500">MP4, WebM, MOV · up to 500MB</p>
            </>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-[1.75rem] border border-teal-600/20 bg-teal-600/5 p-5"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 text-teal-600" size={18} />
            <div>
              <p className="text-sm font-semibold text-teal-700">Demo Mode ready</p>
              <p className="mt-1 text-sm text-ink-500">
                No video required. Generates a complete report with transcript, emotion timeline, scores, and hiring recommendation.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[
          { key: 'candidate_name', label: 'Candidate name', placeholder: 'Alex Rivera' },
          { key: 'position', label: 'Position', placeholder: 'Staff Engineer' },
          { key: 'interviewer', label: 'Interviewer', placeholder: 'Your name', span: true },
        ].map(({ key, label, placeholder, span }) => (
          <div key={key} className={span ? 'sm:col-span-2' : ''}>
            <label className="mb-1.5 block text-xs font-medium text-ink-500">{label}</label>
            <input
              className="input"
              value={form[key]}
              placeholder={placeholder}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-ink-500">Job description (optional)</label>
          <textarea
            className="input min-h-[110px] resize-y"
            value={form.job_description}
            placeholder="Paste the role description to ground the LLM recommendation…"
            onChange={(e) => setForm((f) => ({ ...f, job_description: e.target.value }))}
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !(mode === 'demo' || file)}
        className="btn-primary mt-6 w-full !py-3.5"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Starting…
          </>
        ) : (
          <>
            <Sparkles size={16} />
            {mode === 'demo' ? 'Run demo analysis' : 'Analyze interview'}
          </>
        )}
      </button>
    </div>
  )
}
