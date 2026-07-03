export type CustomMetaRow = {
  key: string;
  value: string;
};

export type UserRole = "admin" | "user";

export type ReviewStatus = "draft" | "pending" | "approved" | "rejected" | "archived";

export type AuthSession = {
  userId: string;
  role: UserRole;
  username: string;
  displayName: string;
  expiresAt: number;
};

export type LocationMapItem = {
  id: string;
  title: string;
  x: number;
  y: number;
  isPublished: boolean;
  status: ReviewStatus;
  coverImagePath: string | null;
  photoCount: number;
};
