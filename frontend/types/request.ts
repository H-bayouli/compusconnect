export interface RequestCardData {
  _id: string;
  title: string;
  description: string;
  subject: string;
  studyLevel: string;
  status: string;
  createdAt: string;
  createdBy?: {
    _id?: string;
    username?: string;
    specialty?: string;
  };
}
