import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LineChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const isLogin = mode === 'login';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isLogin) await login(email, password);
      else await register(username, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6">
        <div className="flex flex-col items-center gap-2 pb-2">
          <LineChart className="text-emerald-400" size={32} />
          <h1 className="text-xl font-bold">{isLogin ? 'ברוך שובך' : 'יצירת חשבון חדש'}</h1>
        </div>

        {!isLogin && (
          <input
            dir="ltr"
            className="input text-start"
            placeholder="שם משתמש (באנגלית)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={30}
            autoComplete="username"
          />
        )}
        <input
          dir="ltr"
          className="input text-start"
          type="email"
          placeholder="אימייל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          dir="ltr"
          className="input text-start"
          type="password"
          placeholder={isLogin ? 'סיסמה' : 'סיסמה (לפחות 8 תווים)'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={isLogin ? 1 : 8}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
        />

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'רק רגע…' : isLogin ? 'התחברות' : 'הרשמה'}
        </button>

        <p className="text-center text-sm text-slate-400">
          {isLogin ? (
            <>
              אין לך חשבון?{' '}
              <Link to="/register" className="text-emerald-400 hover:underline">
                להרשמה
              </Link>
            </>
          ) : (
            <>
              כבר רשום?{' '}
              <Link to="/login" className="text-emerald-400 hover:underline">
                להתחברות
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
