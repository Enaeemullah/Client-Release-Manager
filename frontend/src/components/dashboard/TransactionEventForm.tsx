import { FormEvent, useEffect, useState } from 'react';
import styles from './TransactionEventForm.module.css';
import { TransactionEventInput } from '../../types/transactions';

export type TransactionEventFormValues = TransactionEventInput;

export interface ProjectOption {
  slug: string;
  label: string;
}

interface TransactionEventFormProps {
  projects: ProjectOption[];
  initialValues?: TransactionEventFormValues;
  submitLabel?: string;
  onSubmit: (values: TransactionEventFormValues) => Promise<void> | void;
  onCancel: () => void;
}

export const TransactionEventForm = ({
  projects,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: TransactionEventFormProps) => {
  const [client, setClient] = useState(initialValues?.client ?? projects[0]?.slug ?? '');
  const [petEventCode, setPetEventCode] = useState(initialValues?.petEventCode ?? '');
  const [petEventDesc, setPetEventDesc] = useState(initialValues?.petEventDesc ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setClient(initialValues.client);
      setPetEventCode(initialValues.petEventCode);
      setPetEventDesc(initialValues.petEventDesc);
    }
  }, [initialValues]);

  useEffect(() => {
    if (!initialValues && projects.length > 0 && !client) {
      setClient(projects[0].slug);
    }
  }, [projects, initialValues, client]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!client || !petEventCode.trim() || !petEventDesc.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ client, petEventCode: petEventCode.trim(), petEventDesc: petEventDesc.trim() });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasProjects = projects.length > 0;
  const buttonLabel = submitLabel ?? (initialValues ? 'Save changes' : 'Add transaction event');
  const isSubmitDisabled = !hasProjects || !client || !petEventCode.trim() || !petEventDesc.trim() || isSubmitting;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div>
        <label className={styles.label} htmlFor="transaction-client">
          Project
        </label>
        <select
          id="transaction-client"
          value={client}
          onChange={(event) => setClient(event.target.value)}
          disabled={!hasProjects}
        >
          {!hasProjects && <option value="">No projects available</option>}
          {projects.map((project) => (
            <option key={project.slug} value={project.slug}>
              {project.label}
            </option>
          ))}
        </select>
        {!hasProjects && <p className={styles.helperText}>Add an organization to start tracking transaction events.</p>}
      </div>

      <div>
        <label className={styles.label} htmlFor="transaction-code">
         Event Code
        </label>
        <input
          id="transaction-code"
          type="text"
          value={petEventCode}
          onChange={(event) => setPetEventCode(event.target.value)}
          placeholder="TRX-001"
        />
      </div>

      <div>
        <label className={styles.label} htmlFor="transaction-description">
          Event Description
        </label>
        <textarea
          id="transaction-description"
          rows={4}
          value={petEventDesc}
          onChange={(event) => setPetEventDesc(event.target.value)}
          placeholder="Outline what this transaction event represents for the project"
        />
      </div>

      <div className={styles.actions}>
        <button type="submit" className="btn btn--filled" disabled={isSubmitDisabled}>
          {buttonLabel}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};
