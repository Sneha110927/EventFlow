export interface Event {
  _id: string;
  name: string;
  type: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;

  modules?: {
    participants: boolean;
    registration: boolean;
    schedule: boolean;
    documents: boolean;
    announcements: boolean;
    chat: boolean;
    accommodation: boolean;
    travel: boolean;
  };

  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };

  createdAt: string;
  updatedAt: string;
}