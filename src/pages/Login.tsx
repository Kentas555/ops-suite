import { useState } from 'react';
import { Briefcase, Eye, EyeOff, LogIn } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import { useTranslation } from '../i18n/useTranslation';

export default function Login() {
  const { login } = useAuthStore();
  const { t, lang, setLang } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      setError(t.auth.invalidCredentials);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      {/* Language switcher in corner */}
      <div className="fixed top-4 right-4">
        <div className="flex items-center bg-white rounded-lg p-0.5 shadow-sm border border-slate-200">
          <button onClick={() => setLang('en')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${lang === 'en' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}>
            EN
          </button>
          <button onClick={() => setLang('lt')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${lang === 'lt' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}>
            LT
          </button>
        </div>
      </div>

      <div className="w-full max-w-sm">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-600/20">
            <Briefcase size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t.app.name}</h1>
          <p className="text-sm text-slate-500 mt-1">{t.auth.signInSubtitle}</p>
        </div>

        {/* Login Form */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="label">{t.auth.email}</label>
              <input
                id="login-email"
                name="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder={t.auth.email}
                autoFocus
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="label">{t.auth.password}</label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder={t.auth.password}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full justify-center py-2.5"
              disabled={!email.trim() || !password || loading}
            >
              <LogIn size={16} /> {loading ? t.auth.signingIn : t.auth.signInButton}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">{t.auth.internalTool}</p>
        </div>
      </div>
    </div>
  );
}
