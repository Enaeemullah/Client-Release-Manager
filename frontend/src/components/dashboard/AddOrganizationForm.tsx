import { FormEvent, useState } from 'react';
import styles from './AddOrganizationForm.module.css';

interface AddOrganizationFormProps {
  onSubmit: (values: { name: string; code: string }) => Promise<void> | void;
  onCancel: () => void;
}

export const AddOrganizationForm = ({ onSubmit, onCancel }: AddOrganizationFormProps) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !code.trim()) {
      setError('Provide both an organization name and code.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({ name: name.trim(), code: code.trim() });
      setName('');
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add organization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.description}>Create an organization once and reuse it across releases and transaction events.</p>

      <label className={styles.label} htmlFor="organization-name">
        Organization name
      </label>
      <input
        id="organization-name"
        type="text"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setError(null);
        }}
        placeholder="Acme Corporation"
      />

      <label className={styles.label} htmlFor="organization-code">
        Organization code
      </label>
      <input
        id="organization-code"
        type="text"
        value={code}
        onChange={(event) => {
          setCode(event.target.value);
          setError(null);
        }}
        placeholder="acme"
      />
      <p className={styles.helperText}>Codes should be short, unique identifiers (no spaces). We&apos;ll use them in URLs.</p>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <button type="submit" className="btn btn--filled" disabled={isSubmitting}>
          Save organization
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};
