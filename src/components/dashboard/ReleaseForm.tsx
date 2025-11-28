import { FormEvent, useState } from 'react';
import styles from './ReleaseForm.module.css';
import { Release } from '../../types/releases';
import { normalizeKey } from '../../utils/releases';

interface ReleaseFormProps {
  initialData?: { client: string; env: string; release: Release };
  onSubmit: (client: string, env: string, release: Release) => void;
  onCancel: () => void;
}

const today = () => new Date().toISOString().split('T')[0];

export const ReleaseForm = ({ initialData, onSubmit, onCancel }: ReleaseFormProps) => {
  const [client, setClient] = useState(initialData?.client ?? '');
  const [env, setEnv] = useState(initialData?.env ?? '');
  const [branch, setBranch] = useState(initialData?.release.branch ?? '');
  const [version, setVersion] = useState(initialData?.release.version ?? '');
  const [build, setBuild] = useState(String(initialData?.release.build ?? 1));
  const [date, setDate] = useState(initialData?.release.date ?? today());

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!client || !env || !branch || !version) {
      return;
    }

    onSubmit(normalizeKey(client), normalizeKey(env), {
      branch,
      version,
      build: Number(build) || 1,
      date,
    });
  };

  const disableIdentityFields = Boolean(initialData);

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div>
        <label className={styles.label} htmlFor="client">
          Client name
        </label>
        <input
          id="client"
          type="text"
          value={client}
          onChange={(event) => setClient(event.target.value)}
          placeholder="acme"
          disabled={disableIdentityFields}
        />
      </div>

      <div>
        <label className={styles.label} htmlFor="environment">
          Environment
        </label>
        <input
          id="environment"
          type="text"
          value={env}
          onChange={(event) => setEnv(event.target.value)}
          placeholder="dev | uat | prod"
          disabled={disableIdentityFields}
        />
      </div>

      <div>
        <label className={styles.label} htmlFor="branch">
          Branch
        </label>
        <input
          id="branch"
          type="text"
          value={branch}
          onChange={(event) => setBranch(event.target.value)}
          placeholder="client/environment"
        />
      </div>

      <div className={styles.row}>
        <div>
          <label className={styles.label} htmlFor="version">
            Version
          </label>
          <input
            id="version"
            type="text"
            value={version}
            onChange={(event) => setVersion(event.target.value)}
            placeholder="2.1.0"
          />
        </div>
        <div>
          <label className={styles.label} htmlFor="build">
            Build number
          </label>
          <input
            id="build"
            type="number"
            min={1}
            value={build}
            onChange={(event) => setBuild(event.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={styles.label} htmlFor="date">
          Release date
        </label>
        <input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </div>

      <div className={styles.actions}>
        <button type="submit" className="btn btn--filled">
          {initialData ? 'Update Release' : 'Add Release'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};
