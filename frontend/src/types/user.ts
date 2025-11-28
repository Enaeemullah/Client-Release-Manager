export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  jobTitle: string | null;
  location: string | null;
  bio: string | null;
  phoneNumber: string | null;
}
