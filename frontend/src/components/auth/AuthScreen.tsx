import { FormEvent, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AuthScreen.module.css';

export const AuthScreen = () => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (mode === 'signup') {
      if (!firstName.trim() || !lastName.trim()) {
        setError('Please provide your full name.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup({
          email,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((current) => (current === 'login' ? 'signup' : 'login'));
    setError('');
    setFirstName('');
    setLastName('');
  };

  return (
    <section className={styles.wrapper}>
      <div className={styles.panel}>
        <h1 className={styles.title}>Verto</h1>
        <p className={styles.subtitle}>
          {mode === 'login' ? 'Sign in to your release cockpit' : 'Create your Verto workspace'}
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {mode === 'signup' && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="firstName">
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(event.target.value);
                    setError('');
                  }}
                  placeholder="Alex"
                  autoComplete="given-name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="lastName">
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(event) => {
                    setLastName(event.target.value);
                    setError('');
                  }}
                  placeholder="Chen"
                  autoComplete="family-name"
                />
              </div>
            </>
          )}

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

          <button type="submit" className={`btn btn--filled ${styles.submitButton}`} disabled={isSubmitting}>
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
