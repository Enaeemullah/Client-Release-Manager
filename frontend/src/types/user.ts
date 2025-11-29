export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  jobTitle: string | null;
  location: string | null;
  bio: string | null;
  phoneNumber: string | null;
}
