export interface StudentSummary {
  _id: string;
  username: string;
  specialty?: string;
  studyLevel?: string;
  skills?: string[];
}

export interface SessionUser extends StudentSummary {
  email: string;
  role: "student" | "admin";
  avatar?: string;
}
