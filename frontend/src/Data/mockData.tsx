export type EventType = 'conference' | 'wedding' | 'workshop' | 'seminar' | 'corporate';
export type RegistrationStatus = 'confirmed' | 'pending' | 'waitlisted' | 'cancelled';
export type InvitationStatus = 'invited' | 'opened' | 'accepted' | 'registered';
export type DocumentStatus = 'approved' | 'pending' | 'rejected' | 'missing';

export interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  avatar: string;
  registrationStatus: RegistrationStatus;
  invitationStatus: InvitationStatus;
  documentStatus: DocumentStatus;
  joinedAt: string;
  eventId: string;
  documents: Document[];
}

export interface Document {
  id: string;
  name: string;
  type: string;
  status: DocumentStatus;
  uploadedAt: string;
  size: string;
  url?: string;
}

export interface Event {
  id: string;
  name: string;
  type: EventType;
  date: string;
  endDate: string;
  location: string;
  venue: string;
  capacity: number;
  registered: number;
  status: 'upcoming' | 'active' | 'completed' | 'draft';
  description: string;
  coverImage: string;
  modules: string[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isAdmin: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target: 'all' | 'confirmed' | 'pending';
  sentAt: string;
  sentBy: string;
  readCount: number;
  totalCount: number;
}

export const mockEvents: Event[] = [
  {
    id: 'evt-001',
    name: 'Tech Summit 2026',
    type: 'conference',
    date: '2026-10-15',
    endDate: '2026-10-17',
    location: 'San Francisco, CA',
    venue: 'Moscone Center',
    capacity: 1200,
    registered: 847,
    status: 'upcoming',
    description: 'The premier technology conference bringing together innovators, developers and business leaders.',
    coverImage: 'photo-1540575467063-178a50c2df87',
    modules: ['participants', 'rsvp', 'schedule', 'documents', 'chat', 'announcements'],
  },
  {
    id: 'evt-002',
    name: 'Anderson & Harlow Wedding',
    type: 'wedding',
    date: '2026-09-20',
    endDate: '2026-09-20',
    location: 'Napa Valley, CA',
    venue: 'Castello di Amorosa',
    capacity: 180,
    registered: 162,
    status: 'upcoming',
    description: 'An intimate vineyard wedding celebration.',
    coverImage: 'photo-1519741497674-611481863552',
    modules: ['participants', 'rsvp', 'documents', 'chat', 'accommodation', 'travel'],
  },
  {
    id: 'evt-003',
    name: 'UX Design Workshop',
    type: 'workshop',
    date: '2026-09-28',
    endDate: '2026-09-29',
    location: 'New York, NY',
    venue: 'Chelsea Innovation Hub',
    capacity: 60,
    registered: 58,
    status: 'upcoming',
    description: 'Hands-on workshop on modern UX design methodologies.',
    coverImage: 'photo-1531403009284-440f080d1e12',
    modules: ['participants', 'documents', 'chat', 'announcements'],
  },
  {
    id: 'evt-004',
    name: 'Leadership Seminar Q4',
    type: 'seminar',
    date: '2026-11-05',
    endDate: '2026-11-05',
    location: 'Chicago, IL',
    venue: 'The Merchandise Mart',
    capacity: 250,
    registered: 134,
    status: 'upcoming',
    description: 'Executive leadership development seminar for senior managers.',
    coverImage: 'photo-1475721027785-f74eccf877e2',
    modules: ['participants', 'rsvp', 'schedule', 'announcements'],
  },
  {
    id: 'evt-005',
    name: 'Acme Corp Annual Retreat',
    type: 'corporate',
    date: '2026-12-01',
    endDate: '2026-12-03',
    location: 'Aspen, CO',
    venue: 'The Little Nell',
    capacity: 120,
    registered: 98,
    status: 'upcoming',
    description: 'Annual company retreat for strategy planning and team building.',
    coverImage: 'photo-1506905925346-21bda4d32df4',
    modules: ['participants', 'rsvp', 'schedule', 'documents', 'chat', 'accommodation', 'travel', 'announcements'],
  },
];

export const mockParticipants: Participant[] = [
  {
    id: 'p-001',
    name: 'Sarah Chen',
    email: 'sarah.chen@techcorp.io',
    phone: '+1 (415) 555-0142',
    company: 'TechCorp Solutions',
    role: 'Senior Engineer',
    avatar: 'photo-1494790108377-be9c29b29330',
    registrationStatus: 'confirmed',
    invitationStatus: 'registered',
    documentStatus: 'approved',
    joinedAt: '2026-08-12',
    eventId: 'evt-001',
    documents: [
      { id: 'd1', name: 'ID Document', type: 'pdf', status: 'approved', uploadedAt: '2026-08-15', size: '1.2 MB' },
      { id: 'd2', name: 'Dietary Requirements', type: 'pdf', status: 'approved', uploadedAt: '2026-08-15', size: '0.3 MB' },
    ],
  },
  {
    id: 'p-002',
    name: 'Marcus Williams',
    email: 'marcus.w@designlab.co',
    phone: '+1 (212) 555-0198',
    company: 'DesignLab NYC',
    role: 'Creative Director',
    avatar: 'photo-1500648767791-00dcc994a43e',
    registrationStatus: 'confirmed',
    invitationStatus: 'registered',
    documentStatus: 'pending',
    joinedAt: '2026-08-18',
    eventId: 'evt-001',
    documents: [
      { id: 'd3', name: 'ID Document', type: 'pdf', status: 'pending', uploadedAt: '2026-08-20', size: '0.9 MB' },
    ],
  },
  {
    id: 'p-003',
    name: 'Priya Sharma',
    email: 'p.sharma@innova.ai',
    phone: '+1 (650) 555-0234',
    company: 'Innova AI',
    role: 'Product Manager',
    avatar: 'photo-1580489944761-15a19d654956',
    registrationStatus: 'confirmed',
    invitationStatus: 'accepted',
    documentStatus: 'missing',
    joinedAt: '2026-08-25',
    eventId: 'evt-001',
    documents: [],
  },
  {
    id: 'p-004',
    name: 'James Holloway',
    email: 'j.holloway@ventures.com',
    phone: '+1 (310) 555-0367',
    company: 'Holloway Ventures',
    role: 'CEO',
    avatar: 'photo-1472099645785-5658abf4ff4e',
    registrationStatus: 'waitlisted',
    invitationStatus: 'accepted',
    documentStatus: 'missing',
    joinedAt: '2026-09-01',
    eventId: 'evt-001',
    documents: [],
  },
  {
    id: 'p-005',
    name: 'Elena Vasquez',
    email: 'elena@cloudify.dev',
    phone: '+1 (408) 555-0521',
    company: 'Cloudify Dev',
    role: 'DevOps Lead',
    avatar: 'photo-1534528741775-53994a69daeb',
    registrationStatus: 'confirmed',
    invitationStatus: 'registered',
    documentStatus: 'approved',
    joinedAt: '2026-08-10',
    eventId: 'evt-001',
    documents: [
      { id: 'd4', name: 'ID Document', type: 'pdf', status: 'approved', uploadedAt: '2026-08-12', size: '1.1 MB' },
      { id: 'd5', name: 'Travel Authorization', type: 'pdf', status: 'approved', uploadedAt: '2026-08-14', size: '0.5 MB' },
    ],
  },
  {
    id: 'p-006',
    name: 'David Park',
    email: 'd.park@nexustech.co',
    phone: '+1 (206) 555-0789',
    company: 'Nexus Technologies',
    role: 'Engineering Manager',
    avatar: 'photo-1507003211169-0a1dd7228f2d',
    registrationStatus: 'pending',
    invitationStatus: 'opened',
    documentStatus: 'missing',
    joinedAt: '2026-09-02',
    eventId: 'evt-001',
    documents: [],
  },
];

export const mockMessages: Record<string, Message[]> = {
  'p-001': [
    { id: 'm1', senderId: 'admin', senderName: 'Event Admin', senderAvatar: '', content: 'Hi Sarah! Welcome to Tech Summit 2026. Do you have any questions about your registration?', timestamp: '2026-09-01T10:00:00', isAdmin: true },
    { id: 'm2', senderId: 'p-001', senderName: 'Sarah Chen', senderAvatar: 'photo-1494790108377-be9c29b29330', content: 'Thank you! Yes — could you confirm the check-in time on Day 1?', timestamp: '2026-09-01T10:15:00', isAdmin: false },
    { id: 'm3', senderId: 'admin', senderName: 'Event Admin', senderAvatar: '', content: 'Of course! Check-in opens at 8:00 AM on October 15th. Keynote begins at 9:30 AM. We recommend arriving early to pick up your badge.', timestamp: '2026-09-01T10:20:00', isAdmin: true },
    { id: 'm4', senderId: 'p-001', senderName: 'Sarah Chen', senderAvatar: 'photo-1494790108377-be9c29b29330', content: 'Perfect, thank you so much!', timestamp: '2026-09-01T10:22:00', isAdmin: false },
  ],
  'p-002': [
    { id: 'm5', senderId: 'admin', senderName: 'Event Admin', senderAvatar: '', content: "Hi Marcus! We noticed your ID document is still under review. Could you re-upload a clearer version?", timestamp: '2026-09-02T14:00:00', isAdmin: true },
    { id: 'm6', senderId: 'p-002', senderName: 'Marcus Williams', senderAvatar: 'photo-1500648767791-00dcc994a43e', content: "I'll upload a new version today. Sorry for the delay.", timestamp: '2026-09-02T15:30:00', isAdmin: false },
  ],
};

export const mockAnnouncements: Announcement[] = [
  {
    id: 'a-001',
    title: 'Registration Confirmation & Venue Details',
    content: 'Your registration for Tech Summit 2026 is confirmed. The event will be held at the Moscone Center, 747 Howard St, San Francisco. Doors open at 8:00 AM on October 15th. Please bring a valid photo ID for check-in.',
    target: 'confirmed',
    sentAt: '2026-09-01T09:00:00',
    sentBy: 'Event Admin',
    readCount: 712,
    totalCount: 847,
  },
  {
    id: 'a-002',
    title: 'Document Submission Reminder',
    content: 'This is a reminder that all required documents must be submitted by September 30th. Please log in to your participant portal to upload your ID and any other requested documents.',
    target: 'pending',
    sentAt: '2026-09-03T11:00:00',
    sentBy: 'Event Admin',
    readCount: 45,
    totalCount: 135,
  },
  {
    id: 'a-003',
    title: 'Speaker Lineup Announced!',
    content: "We're thrilled to reveal the full speaker lineup for Tech Summit 2026. Featuring keynotes from industry leaders at Apple, Google, Anthropic, and OpenAI. Full schedule available in the app.",
    target: 'all',
    sentAt: '2026-09-05T08:30:00',
    sentBy: 'Event Admin',
    readCount: 634,
    totalCount: 847,
  },
];

export const mockDocumentRequests = [
  { id: 'dr-001', name: 'Government-Issued ID', required: true, deadline: '2026-09-30', submittedCount: 612, totalCount: 847 },
  { id: 'dr-002', name: 'Dietary & Allergy Form', required: false, deadline: '2026-09-30', submittedCount: 445, totalCount: 847 },
  { id: 'dr-003', name: 'Travel Authorization Letter', required: false, deadline: '2026-10-01', submittedCount: 234, totalCount: 847 },
  { id: 'dr-004', name: 'Emergency Contact Form', required: true, deadline: '2026-09-30', submittedCount: 589, totalCount: 847 },
];
