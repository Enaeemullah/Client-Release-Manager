import { FormEvent, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AuthScreen.module.css';

export const AuthScreen = () => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    const action = mode === 'login' ? login : signup;
    const success = action(email, password);

    if (!success) {
      setError(mode === 'login' ? 'Invalid email or password.' : 'Email already exists.');
      return;
    }

    if (mode === 'signup') {
      login(email, password);
    }

    setError('');
  };

  const toggleMode = () => {
    setMode((current) => (current === 'login' ? 'signup' : 'login'));
    setError('');
  };

  return (
    <section className={styles.wrapper}>
      <div className={styles.panel}>
        <h1 className={styles.title}>Client Release Manager</h1>
        <p className={styles.subtitle}>{mode === 'login' ? 'Sign in to your account' : 'Create a new account'}</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError('');
              }}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              placeholder="Enter your password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button type="submit" className={`btn btn--filled ${styles.submitButton}`}>
            {mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className={styles.toggle}>
          <button type="button" onClick={toggleMode}>
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </section>
  );
};
