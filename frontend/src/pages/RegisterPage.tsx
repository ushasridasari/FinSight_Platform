import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../services/auth'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', username: '', full_name: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      await authService.register(form.email, form.username, form.password, form.full_name)
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <input type={type} value={form[key]} onChange={set(key)} required={key !== 'full_name'}
        className="w-full px-4 py-2.5 bg-surface border border-surface-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
        placeholder={placeholder} />
    </div>
  )

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/20 mb-4">
            <TrendingUp size={28} className="text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="text-slate-400 mt-1 text-sm">Start tracking your financial future</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {field('Full Name', 'full_name', 'text', 'Optional')}
            {field('Email', 'email', 'email', 'you@example.com')}
            {field('Username', 'username', 'text', 'johndoe')}
            {field('Password', 'password', 'password', '••••••••')}
            {field('Confirm Password', 'confirm', 'password', '••••••••')}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm mt-2">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-400 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
