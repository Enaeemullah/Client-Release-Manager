import { FormEvent, useEffect, useState } from 'react';
import styles from './ClientForm.module.css';

export interface ClientFormValues {
  por_orgadesc: string;
  por_orgacode: string;
  por_active: 'active' | 'inactive';
}

interface ClientFormProps {
  initialValues?: ClientFormValues;
  submitLabel?: string;
  onSubmit: (values: ClientFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

const defaultValues: ClientFormValues = {
  por_orgadesc: '',
  por_orgacode: '',
  por_active: 'active',
};

export const ClientForm = ({ initialValues, submitLabel, onSubmit, onCancel }: ClientFormProps) => {
  const [values, setValues] = useState<ClientFormValues>(initialValues ?? defaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValues(initialValues ?? defaultValues);
  }, [initialValues]);

  const updateField = (key: keyof ClientFormValues, value: string) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.por_orgadesc.trim() || !values.por_orgacode.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        por_orgadesc: values.por_orgadesc.trim(),
        por_orgacode: values.por_orgacode.trim(),
        por_active: values.por_active,
      });

      if (!initialValues) {
        setValues(defaultValues);
      }
    } catch (error) {
      // Let parent handlers surface the error without resetting the form
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setValues(initialValues ?? defaultValues);
    onCancel?.();
  };

  const buttonLabel = submitLabel ?? (initialValues ? 'Save client' : 'Add client');
  const isSubmitDisabled =
    isSubmitting || !values.por_orgadesc.trim() || !values.por_orgacode.trim() || !values.por_active;

  return (
    <form className={styles.form} onSubmit={handleSubmit} data-testid="client-form">
      <div>
        <label className={styles.label} htmlFor="por_orgadesc">
          Organization name
        </label>
        <input
          id="por_orgadesc"
          className={styles.input}
          type="text"
          value={values.por_orgadesc}
          onChange={(event) => updateField('por_orgadesc', event.target.value)}
          placeholder="Acme Corporation"
          autoComplete="organization"
        />
        <p className={styles.helperText}>Use the full organization name so teammates recognize the client.</p>
      </div>

      <div>
        <label className={styles.label} htmlFor="por_orgacode">
          Organization code
        </label>
        <input
          id="por_orgacode"
          className={styles.input}
          type="text"
          value={values.por_orgacode}
          onChange={(event) => updateField('por_orgacode', event.target.value)}
          placeholder="ACME_US"
          autoComplete="off"
        />
        <p className={styles.helperText}>This code will act as the unique identifier used across releases and events.</p>
      </div>

      <div>
        <label className={styles.label} htmlFor="por_active">
          Status
        </label>
        <select
          id="por_active"
          className={styles.select}
          value={values.por_active}
          onChange={(event) => updateField('por_active', event.target.value)}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className={styles.actions}>
        <button type="submit" className="btn btn--filled" disabled={isSubmitDisabled}>
          {buttonLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
