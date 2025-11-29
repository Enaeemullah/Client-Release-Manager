import { ChangeEvent, FormEvent, useEffect, useId, useMemo, useState } from 'react';
import styles from './UserSettingsModal.module.css';
import { Modal } from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import type { UpdateProfilePayload } from '../../services/api';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024;

export const UserSettingsModal = ({ isOpen, onClose }: UserSettingsModalProps) => {
  const { currentUser, updateProfile, updatePassword } = useAuth();
  const avatarInputId = useId();

  const [profileFields, setProfileFields] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    jobTitle: '',
    location: '',
    phoneNumber: '',
    bio: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarPayload, setAvatarPayload] = useState<string | null | undefined>(undefined);
  const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!isOpen || !currentUser) {
      return;
    }

    setProfileFields({
      firstName: currentUser.firstName ?? '',
      lastName: currentUser.lastName ?? '',
      displayName: currentUser.displayName ?? '',
      jobTitle: currentUser.jobTitle ?? '',
      location: currentUser.location ?? '',
      phoneNumber: currentUser.phoneNumber ?? '',
      bio: currentUser.bio ?? '',
    });
    setAvatarPreview(currentUser.avatarUrl ?? null);
    setAvatarPayload(undefined);
    setProfileStatus(null);
    setPasswordStatus(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }, [currentUser, isOpen]);

  const initials = useMemo(() => {
    if (!currentUser) {
      return '';
    }

    const source =
      currentUser.displayName ||
      [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') ||
      currentUser.email;
    return source
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [currentUser]);

  const handleProfileFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setProfileFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setProfileStatus({
        type: 'error',
        message: 'Please choose an image smaller than 1.5MB.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
        setAvatarPayload(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarRemove = () => {
    setAvatarPreview(null);
    setAvatarPayload(null);
  };

  const toNullable = (value: string) => {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) {
      return;
    }

    setProfileStatus(null);
    setIsSavingProfile(true);

    try {
      const payload: UpdateProfilePayload = {
        displayName: toNullable(profileFields.displayName),
        firstName: toNullable(profileFields.firstName),
        lastName: toNullable(profileFields.lastName),
        jobTitle: toNullable(profileFields.jobTitle),
        location: toNullable(profileFields.location),
        phoneNumber: toNullable(profileFields.phoneNumber),
        bio: toNullable(profileFields.bio ?? ''),
      };

      if (avatarPayload !== undefined) {
        payload.avatarUrl = avatarPayload;
      }

      const updated = await updateProfile(payload);
      setProfileStatus({ type: 'success', message: 'Profile updated successfully.' });
      setAvatarPreview(updated.avatarUrl ?? null);
      setAvatarPayload(undefined);
      setProfileFields({
        firstName: updated.firstName ?? '',
        lastName: updated.lastName ?? '',
        displayName: updated.displayName ?? '',
        jobTitle: updated.jobTitle ?? '',
        location: updated.location ?? '',
        phoneNumber: updated.phoneNumber ?? '',
        bio: updated.bio ?? '',
      });
    } catch (error) {
      setProfileStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to update profile. Please try again.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentPassword || !newPassword) {
      setPasswordStatus({ type: 'error', message: 'Please fill out all password fields.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setPasswordStatus(null);
    setIsSavingPassword(true);

    try {
      await updatePassword({
        currentPassword,
        newPassword,
      });

      setPasswordStatus({ type: 'success', message: 'Password updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to update password.',
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Modal title="Your settings" isOpen={isOpen} onClose={onClose}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h3>Profile</h3>
            <p>Keep your personal details up to date.</p>
          </div>
        </div>

        {profileStatus && (
          <div className={`${styles.banner} ${profileStatus.type === 'success' ? styles.success : styles.error}`}>
            {profileStatus.message}
          </div>
        )}

        <form className={styles.form} onSubmit={handleProfileSubmit}>
          <div className={styles.avatarRow}>
            <div className={styles.avatar}>
              {avatarPreview ? <img src={avatarPreview} alt="Profile" /> : <span>{initials}</span>}
            </div>
            <div className={styles.avatarActions}>
              <input
                id={avatarInputId}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className={styles.fileInput}
              />
              <label className="btn btn--ghost" htmlFor={avatarInputId}>
                Upload photo
              </label>
              {avatarPreview && (
                <button type="button" className="btn btn--ghost" onClick={handleAvatarRemove}>
                  Remove photo
                </button>
              )}
            </div>
          </div>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Email</span>
              <input type="email" value={currentUser.email} disabled />
            </label>

            <label className={styles.field}>
              <span>First name</span>
              <input
                type="text"
                name="firstName"
                value={profileFields.firstName}
                onChange={handleProfileFieldChange}
                placeholder="Alex"
              />
            </label>

            <label className={styles.field}>
              <span>Last name</span>
              <input
                type="text"
                name="lastName"
                value={profileFields.lastName}
                onChange={handleProfileFieldChange}
                placeholder="Chen"
              />
            </label>

            <label className={styles.field}>
              <span>Display name</span>
              <input
                type="text"
                name="displayName"
                value={profileFields.displayName}
                onChange={handleProfileFieldChange}
                placeholder="Alex Chen"
              />
            </label>

            <label className={styles.field}>
              <span>Role / title</span>
              <input
                type="text"
                name="jobTitle"
                value={profileFields.jobTitle}
                onChange={handleProfileFieldChange}
                placeholder="Product Operations Lead"
              />
            </label>

            <label className={styles.field}>
              <span>Location</span>
              <input
                type="text"
                name="location"
                value={profileFields.location}
                onChange={handleProfileFieldChange}
                placeholder="Remote • GMT-5"
              />
            </label>

            <label className={styles.field}>
              <span>Phone</span>
              <input
                type="tel"
                name="phoneNumber"
                value={profileFields.phoneNumber}
                onChange={handleProfileFieldChange}
                placeholder="+1 (555) 123-4567"
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>About you</span>
            <textarea
              name="bio"
              value={profileFields.bio}
              onChange={handleProfileFieldChange}
              rows={4}
              placeholder="Share context for your teammates."
            />
          </label>

          <div className={styles.actions}>
            <button type="submit" className="btn btn--filled" disabled={isSavingProfile}>
              {isSavingProfile ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h3>Password</h3>
            <p>Choose a strong passphrase to protect your account.</p>
          </div>
        </div>

        {passwordStatus && (
          <div className={`${styles.banner} ${passwordStatus.type === 'success' ? styles.success : styles.error}`}>
            {passwordStatus.message}
          </div>
        )}

        <form className={styles.form} onSubmit={handlePasswordSubmit}>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Current password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>

            <label className={styles.field}>
              <span>New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
              />
            </label>

            <label className={styles.field}>
              <span>Confirm new password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
            </label>
          </div>

          <div className={styles.actions}>
            <button type="submit" className="btn btn--filled" disabled={isSavingPassword}>
              {isSavingPassword ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
