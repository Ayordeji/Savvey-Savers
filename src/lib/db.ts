import { adminDb } from './firebase-admin';

// Interfaces preserved for type compatibility
export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  passwordHash?: string | null;
  phone?: string | null;
  role: 'ADMIN' | 'MEMBER';
  isActive: boolean;
  membership?: string;
  createdAt: string;
  invitationId?: string;
  invitationExpiresAt?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postCode?: string;
  country?: string;
  permissions?: string[];
  membershipFeeConfirmed?: boolean;
  membershipFeeConfirmedAt?: string | null;
  termsAccepted?: boolean;
  isSuperAdmin?: boolean;
}

export interface Commitment {
  id: string;
  memberId: string;
  memberName?: string;
  amount: number;
  goal: string;
  collectionMonth: string;
  collectionYear: number;
  endDate?: string;
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'NOT_YET_STARTED';
  createdAt: string;
  updatedAt?: string | null;
}

export interface Payment {
  id: string;
  commitmentId: string;
  amount: number;
  month: string;
  year: number;
  status: 'PENDING' | 'CONFIRMED';
  confirmedAt?: string;
  confirmedById?: string;
  createdAt: string;
  receiptUrl?: string | null; // For uploading proof/receipt to Firebase Storage
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface SubmittedRequest {
  id: string;
  userId: string;
  commitmentId: string;
  requestedMonth: string;
  requestedYear: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface WaitingList {
  id: string;
  name: string;
  email: string;
  phone: string;
  monthlySavingsCommitment: number;
  isReferred: boolean;
  referredBy?: string;
  createdAt: string;
}

export interface Setting {
  key: string;
  value: any; // Dynamic JSON settings
}

export interface MockEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt?: string;
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  userId: string;
  createdAt: string;
}

export interface DeletedRecord {
  id: string;
  type: 'USER' | 'COMMITMENT';
  originalData: any;
  deletedAt: string;
}

// Self-healing default configurations
const DEFAULT_SAVING_GOALS = [
  { name: 'Debt Repayment', enabled: true },
  { name: 'Dream Holiday', enabled: true },
  { name: 'Investment', enabled: true },
  { name: 'My First Home', enabled: true },
  { name: 'Property Purchase', enabled: true },
  { name: 'Savings', enabled: true },
  { name: 'School Fees', enabled: true },
  { name: 'Wedding', enabled: true },
  { name: 'Other', enabled: true }
];

const DEFAULT_COMMITMENT_AMOUNTS = [
  { amount: 55, enabled: true },
  { amount: 100, enabled: true },
  { amount: 101, enabled: true },
  { amount: 120, enabled: true },
  { amount: 122, enabled: true },
  { amount: 200, enabled: true },
  { amount: 250, enabled: true },
  { amount: 300, enabled: true },
  { amount: 400, enabled: true },
  { amount: 500, enabled: true },
  { amount: 600, enabled: true },
  { amount: 700, enabled: true },
  { amount: 750, enabled: true },
  { amount: 1000, enabled: true },
  { amount: 1021, enabled: true },
  { amount: 1100, enabled: true },
  { amount: 2000, enabled: true },
  { amount: 20000, enabled: true }
];

// Fast timeout wrapper to prevent cloud backend hangs on Vercel
function withTimeout<T>(promise: Promise<T>, ms: number = 1200): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Firestore operation timed out after ${ms}ms`));
    }, ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Embedded Fallback Dataset Snapshot (activated when Cloud Firestore quota is exceeded)
const INITIAL_FALLBACK_DATA: Record<string, any[]> = {
  users: [
    {
      id: '3MMvFU6ucAXqmPhalkQOoMsbMMu1',
      name: 'Praise',
      firstName: 'Praise',
      lastName: '',
      email: 'praisetechy001@gmail.com',
      phone: '+447000000000',
      role: 'ADMIN',
      isSuperAdmin: true,
      isActive: true,
      membershipFeeConfirmed: true,
      createdAt: '2026-07-26T23:35:08.348Z',
      invitationId: 'M-000001',
      permissions: [
        'DELETE_USER',
        'EDIT_USER',
        'VIEW_USER',
        'MANAGE_COMMITMENTS',
        'MANAGE_PAYMENTS',
        'MANAGE_SETTINGS',
        'VIEW_AUDIT_LOGS',
        'SEND_NOTIFICATIONS',
      ]
    },
    {
      id: 'usr_admin',
      name: 'Savvey Admin',
      firstName: 'Savvey',
      lastName: 'Admin',
      email: 'admin@savveysavers.com',
      phone: '+447123456789',
      role: 'ADMIN',
      isSuperAdmin: false,
      isActive: true,
      membershipFeeConfirmed: true,
      createdAt: '2026-07-20T10:00:00.000Z',
      invitationId: 'M-000002',
      permissions: [
        'DELETE_USER',
        'EDIT_USER',
        'VIEW_USER',
        'MANAGE_COMMITMENTS',
        'MANAGE_PAYMENTS',
        'MANAGE_SETTINGS',
        'VIEW_AUDIT_LOGS',
        'SEND_NOTIFICATIONS',
      ]
    }
  ],
  commitments: [
  {
    "id": "SC-00222",
    "memberId": "usr_SC-00222",
    "memberName": "Iyore Edomwande",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "February",
    "collectionYear": 2027,
    "endDate": "December 2027",
    "status": "NOT_YET_STARTED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00221",
    "memberId": "usr_SC-00221",
    "memberName": "Anthonia Asuen",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "September",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00220",
    "memberId": "usr_SC-00220",
    "memberName": "Anthonia Asuen",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "July",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00219",
    "memberId": "usr_SC-00219",
    "memberName": "Anthonia Asuen",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "June",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00218",
    "memberId": "usr_SC-00218",
    "memberName": "Anthonia Asuen",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "May",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00217",
    "memberId": "usr_SC-00217",
    "memberName": "Jennifer Bello",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "December",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00216",
    "memberId": "usr_SC-00216",
    "memberName": "Jennifer Bello",
    "amount": 750,
    "goal": "Savings Goal (£750/mo)",
    "collectionMonth": "September",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00215",
    "memberId": "usr_SC-00215",
    "memberName": "Jennifer Bello",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "July",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00214",
    "memberId": "usr_SC-00214",
    "memberName": "Jennifer Bello",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "June",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00213",
    "memberId": "usr_SC-00213",
    "memberName": "Daniel Oronsaye",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "July",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00212",
    "memberId": "usr_SC-00212",
    "memberName": "Daniel Oronsaye",
    "amount": 750,
    "goal": "Savings Goal (£750/mo)",
    "collectionMonth": "January",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00211",
    "memberId": "usr_SC-00211",
    "memberName": "Daniel Oronsaye",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "February",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00210",
    "memberId": "usr_SC-00210",
    "memberName": "Augustine Kindomba",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "April",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00209",
    "memberId": "usr_SC-00209",
    "memberName": "Tobi Osaji",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "September",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00208",
    "memberId": "usr_SC-00208",
    "memberName": "Tobi Osaji",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "August",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00207",
    "memberId": "usr_SC-00207",
    "memberName": "Simisola Adingupu",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "December",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00206",
    "memberId": "usr_SC-00206",
    "memberName": "Iyore Edomwande",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "July",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00205",
    "memberId": "usr_SC-00205",
    "memberName": "Iyore Edomwande",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "June",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00204",
    "memberId": "usr_SC-00204",
    "memberName": "Iyore Edomwande",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "May",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00203",
    "memberId": "usr_SC-00203",
    "memberName": "Iyore Edomwande",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "December",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00202",
    "memberId": "usr_SC-00202",
    "memberName": "Princess Alawode",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "October",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00201",
    "memberId": "usr_SC-00201",
    "memberName": "Bernadette Gichia",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "March",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00200",
    "memberId": "usr_SC-00200",
    "memberName": "Bernadette Gichia",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "March",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00198",
    "memberId": "usr_SC-00198",
    "memberName": "",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "£500.00",
    "collectionYear": 2026,
    "endDate": "July 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00197",
    "memberId": "usr_SC-00197",
    "memberName": "Don Kingsley Nwaorjinta",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "May",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00196",
    "memberId": "usr_SC-00196",
    "memberName": "Aderonke Adejoke Bamidele",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "December",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00195",
    "memberId": "usr_SC-00195",
    "memberName": "Tobi Osaji",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "January",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00194",
    "memberId": "usr_SC-00194",
    "memberName": "Tobi Osaji",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "December",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00193",
    "memberId": "usr_SC-00193",
    "memberName": "Monica Omigie",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "December",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00192",
    "memberId": "usr_SC-00192",
    "memberName": "Mercy Aiyudubie",
    "amount": 750,
    "goal": "Savings Goal (£750/mo)",
    "collectionMonth": "October",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00190",
    "memberId": "usr_SC-00190",
    "memberName": "Vivian Omo-Ojugo",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "February",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00189",
    "memberId": "usr_SC-00189",
    "memberName": "Feyisola Ogunsola",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "April",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00188",
    "memberId": "usr_SC-00188",
    "memberName": "Shola Bogunjoko",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "November",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00187",
    "memberId": "usr_SC-00187",
    "memberName": "Shola Bogunjoko",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "May",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00186",
    "memberId": "usr_SC-00186",
    "memberName": "",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "£500.00",
    "collectionYear": 2026,
    "endDate": "June 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00185",
    "memberId": "usr_SC-00185",
    "memberName": "Kehinde Fashiku",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "November",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00184",
    "memberId": "usr_SC-00184",
    "memberName": "Kehinde Fashiku",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "October",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00183",
    "memberId": "usr_SC-00183",
    "memberName": "Enoto- obong Eluwole",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "November",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00182",
    "memberId": "usr_SC-00182",
    "memberName": "Joy Ugiagbe",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "October",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00181",
    "memberId": "usr_SC-00181",
    "memberName": "Kings Nagus",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "November",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00179",
    "memberId": "usr_SC-00179",
    "memberName": "Davidson Sunday",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "October",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00178",
    "memberId": "usr_SC-00178",
    "memberName": "Oluwabusola Olowoleru",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "July",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00177",
    "memberId": "usr_SC-00177",
    "memberName": "Gbolahan Lamuye",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "August",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00176",
    "memberId": "usr_SC-00176",
    "memberName": "Gbolahan Lamuye",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "March",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00173",
    "memberId": "usr_SC-00173",
    "memberName": "Sandrina Ibie Osayande",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "November",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00172",
    "memberId": "usr_SC-00172",
    "memberName": "Aimiosinor Momoh",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "March",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00171",
    "memberId": "usr_SC-00171",
    "memberName": "Eva Aiyudubie",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "November",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00170",
    "memberId": "usr_SC-00170",
    "memberName": "Tessy Adedoyin",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "August",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00169",
    "memberId": "usr_SC-00169",
    "memberName": "Tessy Adedoyin",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "January",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00168",
    "memberId": "usr_SC-00168",
    "memberName": "Julie Kayembe",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "September",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00167",
    "memberId": "usr_SC-00167",
    "memberName": "Debbie Ologbosele",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "September",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00166",
    "memberId": "usr_SC-00166",
    "memberName": "Esosa Ikponmwosa",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "October",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00165",
    "memberId": "usr_SC-00165",
    "memberName": "Ganiat Johnson",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "April",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00164",
    "memberId": "usr_SC-00164",
    "memberName": "Yori Gbadamosi",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "January",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00163",
    "memberId": "usr_SC-00163",
    "memberName": "Vero Aigbomian",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "February",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00162",
    "memberId": "usr_SC-00162",
    "memberName": "Yori Gbadamosi",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "March",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00161",
    "memberId": "usr_SC-00161",
    "memberName": "Jessica Gwadia",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "February",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00160",
    "memberId": "usr_SC-00160",
    "memberName": "Augustine Kindomba",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "May",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00159",
    "memberId": "usr_SC-00159",
    "memberName": "Mabel Johnson",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "August",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00158",
    "memberId": "usr_SC-00158",
    "memberName": "Jamie Miudjiza Pilipili",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "July",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00157",
    "memberId": "usr_SC-00157",
    "memberName": "Nyumbasiyo Pilipili",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "July",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00156",
    "memberId": "usr_SC-00156",
    "memberName": "Nyumbasiyo Pilipili",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "June",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00155",
    "memberId": "usr_SC-00155",
    "memberName": "Oyebola Oyeleye",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "February",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00154",
    "memberId": "usr_SC-00154",
    "memberName": "Hellen Seru",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "August",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00153",
    "memberId": "usr_SC-00153",
    "memberName": "Arinola Fajuyitan",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "July",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00152",
    "memberId": "usr_SC-00152",
    "memberName": "Chenai Kabvura",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "April",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00151",
    "memberId": "usr_SC-00151",
    "memberName": "Moyo Oluwasola",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "February",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00150",
    "memberId": "usr_SC-00150",
    "memberName": "Moyo Oluwasola",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "May",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00149",
    "memberId": "usr_SC-00149",
    "memberName": "Simisola Adingupu",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "June",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00147",
    "memberId": "usr_SC-00147",
    "memberName": "Kikelomo Agunbiade",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "April",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00146",
    "memberId": "usr_SC-00146",
    "memberName": "Aisosa Aiyudubie",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "November",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00144",
    "memberId": "usr_SC-00144",
    "memberName": "Aisosa Aiyudubie",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "January",
    "collectionYear": 2026,
    "endDate": "December 2026",
    "status": "ACTIVE",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00143",
    "memberId": "usr_SC-00143",
    "memberName": "Daniel Oronsaye",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "May",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00142",
    "memberId": "usr_SC-00142",
    "memberName": "Jessica Gwadia",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "August",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00141",
    "memberId": "usr_SC-00141",
    "memberName": "Tobi Osaji",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "November",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00140",
    "memberId": "usr_SC-00140",
    "memberName": "Gbolahan Lamuye",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "November",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00139",
    "memberId": "usr_SC-00139",
    "memberName": "Frank Ukpedor",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "November",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00138",
    "memberId": "usr_SC-00138",
    "memberName": "Ruby Aghoghovbia",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "August",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00137",
    "memberId": "usr_SC-00137",
    "memberName": "Iyore Edomwande",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "December",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00136",
    "memberId": "usr_SC-00136",
    "memberName": "Jamie Miudjiza Pilipili",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "October",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00134",
    "memberId": "usr_SC-00134",
    "memberName": "Tobi Osaji",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "December",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00133",
    "memberId": "usr_SC-00133",
    "memberName": "Tessy Adedoyin",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "September",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00132",
    "memberId": "usr_SC-00132",
    "memberName": "Temi Olabode",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "November",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00131",
    "memberId": "usr_SC-00131",
    "memberName": "Kings Nagus",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "November",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00130",
    "memberId": "usr_SC-00130",
    "memberName": "Gerald Osaosemwen Aiyudubie",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "October",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00129",
    "memberId": "usr_SC-00129",
    "memberName": "Iyore Edomwande",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "February",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00128",
    "memberId": "usr_SC-00128",
    "memberName": "Iyore Edomwande",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "December",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00127",
    "memberId": "usr_SC-00127",
    "memberName": "Iyore Edomwande",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "May",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00126",
    "memberId": "usr_SC-00126",
    "memberName": "Iyore Edomwande",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "August",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00125",
    "memberId": "usr_SC-00125",
    "memberName": "Iyore Edomwande",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "May",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00124",
    "memberId": "usr_SC-00124",
    "memberName": "Iyore Edomwande",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "December",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00123",
    "memberId": "usr_SC-00123",
    "memberName": "Monica Omigie",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "December",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00122",
    "memberId": "usr_SC-00122",
    "memberName": "Julie Kayembe",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "July",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00121",
    "memberId": "usr_SC-00121",
    "memberName": "Debbie Ologbosele",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "December",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00120",
    "memberId": "usr_SC-00120",
    "memberName": "Augustine Kindomba",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "June",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00119",
    "memberId": "usr_SC-00119",
    "memberName": "Feyisola Ogunsola",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "September",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00118",
    "memberId": "usr_SC-00118",
    "memberName": "Arinola Fajuyitan",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "September",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00117",
    "memberId": "usr_SC-00117",
    "memberName": "Erica Ifeka",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "August",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00116",
    "memberId": "usr_SC-00116",
    "memberName": "Erica Ifeka",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "May",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00115",
    "memberId": "usr_SC-00115",
    "memberName": "Simisola Adingupu",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "September",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00114",
    "memberId": "usr_SC-00114",
    "memberName": "Simisola Adingupu",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "June",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00113",
    "memberId": "usr_SC-00113",
    "memberName": "Hellen Seru",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "September",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00112",
    "memberId": "usr_SC-00112",
    "memberName": "Iyore Edomwande",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "December",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00111",
    "memberId": "usr_SC-00111",
    "memberName": "Ganiat Johnson",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "September",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00110",
    "memberId": "usr_SC-00110",
    "memberName": "Ganiat Johnson",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "April",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00109",
    "memberId": "usr_SC-00109",
    "memberName": "Akinloye Igbinyemi",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "October",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00108",
    "memberId": "usr_SC-00108",
    "memberName": "Gbolahan Lamuye",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "March",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00107",
    "memberId": "usr_SC-00107",
    "memberName": "Gbolahan Lamuye",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "July",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00106",
    "memberId": "usr_SC-00106",
    "memberName": "Oluwabusola Olowoleru",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "October",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00105",
    "memberId": "usr_SC-00105",
    "memberName": "Aisosa Aiyudubie",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "July",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00104",
    "memberId": "usr_SC-00104",
    "memberName": "Vivian Omo-Ojugo",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "November",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00103",
    "memberId": "usr_SC-00103",
    "memberName": "Vero Aigbomian",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "May",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00102",
    "memberId": "usr_SC-00102",
    "memberName": "Atinuke Hassan",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "January",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00101",
    "memberId": "usr_SC-00101",
    "memberName": "Tessy Adedoyin",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "March",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-00100",
    "memberId": "usr_SC-00100",
    "memberName": "Sandrina Ibie Osayande",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "December",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0099",
    "memberId": "usr_SC-0099",
    "memberName": "Ruby Aghoghovbia",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "September",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0098",
    "memberId": "usr_SC-0098",
    "memberName": "Ruby Aghoghovbia",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "June",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0097",
    "memberId": "usr_SC-0097",
    "memberName": "Oyebola Oyeleye",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "September",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0096",
    "memberId": "usr_SC-0096",
    "memberName": "Olajumoke Dorcas Ojewumi",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "October",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0095",
    "memberId": "usr_SC-0095",
    "memberName": "Moyo Oluwasola",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "March",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0094",
    "memberId": "usr_SC-0094",
    "memberName": "Moyo Oluwasola",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "March",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0093",
    "memberId": "usr_SC-0093",
    "memberName": "Moyo Oluwasola",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "February",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0092",
    "memberId": "usr_SC-0092",
    "memberName": "Moyo Oluwasola",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "January",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0091",
    "memberId": "usr_SC-0091",
    "memberName": "Mercy Aiyudubie",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "August",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0090",
    "memberId": "usr_SC-0090",
    "memberName": "Mabel Johnson",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "July",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0089",
    "memberId": "usr_SC-0089",
    "memberName": "Nyumbasiyo Pilipili",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "May",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0088",
    "memberId": "usr_SC-0088",
    "memberName": "Nyumbasiyo Pilipili",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "April",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0087",
    "memberId": "usr_SC-0087",
    "memberName": "Kikelomo Agunbiade",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "February",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0086",
    "memberId": "usr_SC-0086",
    "memberName": "Joy Ugiagbe",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "October",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0085",
    "memberId": "usr_SC-0085",
    "memberName": "Aimiosinor Momoh",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "June",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0084",
    "memberId": "usr_SC-0084",
    "memberName": "Jessica Gwadia",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "June",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0082",
    "memberId": "usr_SC-0082",
    "memberName": "Jennifer Bello",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "February",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0081",
    "memberId": "usr_SC-0081",
    "memberName": "Jennifer Bello",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "January",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0080",
    "memberId": "usr_SC-0080",
    "memberName": "Frank Ukpedor",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "February",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0079",
    "memberId": "usr_SC-0079",
    "memberName": "Eva Aiyudubie",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "October",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0078",
    "memberId": "usr_SC-0078",
    "memberName": "Esosa Ikponmwosa",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "August",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0077",
    "memberId": "usr_SC-0077",
    "memberName": "Ese Efemwen",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "November",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0076",
    "memberId": "usr_SC-0076",
    "memberName": "Davidson Sunday",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "October",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0075",
    "memberId": "usr_SC-0075",
    "memberName": "Daniel Oronsaye",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "August",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0074",
    "memberId": "usr_SC-0074",
    "memberName": "Daniel Oronsaye",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "June",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0073",
    "memberId": "usr_SC-0073",
    "memberName": "Chenai Kabvura",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "April",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0072",
    "memberId": "usr_SC-0072",
    "memberName": "Bernadette Gichia",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "June",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0071",
    "memberId": "usr_SC-0071",
    "memberName": "Anthonia Asuen",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "July",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0070",
    "memberId": "usr_SC-0070",
    "memberName": "Anthonia Asuen",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "March",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0069",
    "memberId": "usr_SC-0069",
    "memberName": "Anthonia Asuen",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "January",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0068",
    "memberId": "usr_SC-0068",
    "memberName": "Yori Gbadamosi",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "April",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0067",
    "memberId": "usr_SC-0067",
    "memberName": "Amy Asemota",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "October",
    "collectionYear": 2025,
    "endDate": "December 2025",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0066",
    "memberId": "usr_SC-0066",
    "memberName": "Olajumoke Dorcas Ojewumi",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "December",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0065",
    "memberId": "usr_SC-0065",
    "memberName": "Jennifer Ejeh",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "December",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0064",
    "memberId": "usr_SC-0064",
    "memberName": "Iyore Edomwande",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "November",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0063",
    "memberId": "usr_SC-0063",
    "memberName": "Kings Nagus",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "November",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0062",
    "memberId": "usr_SC-0062",
    "memberName": "Iyore Edomwande",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "October",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0061",
    "memberId": "usr_SC-0061",
    "memberName": "Moyo Oluwasola",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "August",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0059",
    "memberId": "usr_SC-0059",
    "memberName": "Nyumbasiyo Pilipili",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "June",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0058",
    "memberId": "usr_SC-0058",
    "memberName": "Nyumbasiyo Pilipili",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "June",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0057",
    "memberId": "usr_SC-0057",
    "memberName": "Nyumbasiyo Pilipili",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "May",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0056",
    "memberId": "usr_SC-0056",
    "memberName": "Monica Omigie",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "September",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0055",
    "memberId": "usr_SC-0055",
    "memberName": "Monica Omigie",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "December",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0054",
    "memberId": "usr_SC-0054",
    "memberName": "Monica Omigie",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "December",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0053",
    "memberId": "usr_SC-0053",
    "memberName": "Vivian Omo-Ojugo",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "October",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0052",
    "memberId": "usr_SC-0052",
    "memberName": "Frank Ukpedor",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "August",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0048",
    "memberId": "usr_SC-0048",
    "memberName": "Bernadette Gichia",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "April",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0047",
    "memberId": "usr_SC-0047",
    "memberName": "Tessy Adedoyin",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "March",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0046",
    "memberId": "usr_SC-0046",
    "memberName": "Munyaradzi Moyo",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "October",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0045",
    "memberId": "usr_SC-0045",
    "memberName": "Chenai Kabvura",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "April",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0044",
    "memberId": "usr_SC-0044",
    "memberName": "Andrew Nwabueze",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "March",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0043",
    "memberId": "usr_SC-0043",
    "memberName": "Ese Efemwen",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "September",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0042",
    "memberId": "usr_SC-0042",
    "memberName": "Mabel Johnson",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "August",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0041",
    "memberId": "usr_SC-0041",
    "memberName": "Oluwatosin Fagbenro",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "September",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0040",
    "memberId": "usr_SC-0040",
    "memberName": "Anthonia Asuen",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "October",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0036",
    "memberId": "usr_SC-0036",
    "memberName": "Iyore Edomwande",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "September",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0031",
    "memberId": "usr_SC-0031",
    "memberName": "Jermaine O",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "November",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0030",
    "memberId": "usr_SC-0030",
    "memberName": "Gbolahan Lamuye",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "August",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0029",
    "memberId": "usr_SC-0029",
    "memberName": "Gbolahan Lamuye",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "July",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0028",
    "memberId": "usr_SC-0028",
    "memberName": "Jennifer Bello",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "June",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0027",
    "memberId": "usr_SC-0027",
    "memberName": "Davidson Sunday",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "October",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0026",
    "memberId": "usr_SC-0026",
    "memberName": "Aimiosinor Momoh",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "March",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0025",
    "memberId": "usr_SC-0025",
    "memberName": "Vero Aigbomian",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "March",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0024",
    "memberId": "usr_SC-0024",
    "memberName": "Yori Gbadamosi",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "February",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0023",
    "memberId": "usr_SC-0023",
    "memberName": "Kings Nagus",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "November",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0022",
    "memberId": "usr_SC-0022",
    "memberName": "Eva Aiyudubie",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "September",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0021",
    "memberId": "usr_SC-0021",
    "memberName": "Ivy Erhahon",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "March",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0020",
    "memberId": "usr_SC-0020",
    "memberName": "Daniel Oronsaye",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "April",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0019",
    "memberId": "usr_SC-0019",
    "memberName": "Rosemary Akpomedaye",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "May",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0018",
    "memberId": "usr_SC-0018",
    "memberName": "Ruby Aghoghovbia",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "September",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0017",
    "memberId": "usr_SC-0017",
    "memberName": "Ruby Aghoghovbia",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "May",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0016",
    "memberId": "usr_SC-0016",
    "memberName": "Aisosa Aiyudubie",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "September",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0015",
    "memberId": "usr_SC-0015",
    "memberName": "Kikelomo Agunbiade",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "July",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0014",
    "memberId": "usr_SC-0014",
    "memberName": "Aminatu Momoh",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "May",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0013",
    "memberId": "usr_SC-0013",
    "memberName": "Jessica Gwadia",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "April",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0012",
    "memberId": "usr_SC-0012",
    "memberName": "Moyo Oluwasola",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "May",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0011",
    "memberId": "usr_SC-0011",
    "memberName": "Moyo Oluwasola",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "February",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-0010",
    "memberId": "usr_SC-0010",
    "memberName": "Moyo Oluwasola",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "February",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-009",
    "memberId": "usr_SC-009",
    "memberName": "Atinuke Hassan",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "January",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-008",
    "memberId": "usr_SC-008",
    "memberName": "Mercy Aiyudubie",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "June",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-006",
    "memberId": "usr_SC-006",
    "memberName": "Joy Ugiagbe",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "December",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-005",
    "memberId": "usr_SC-005",
    "memberName": "Oyebola Oyeleye",
    "amount": 500,
    "goal": "Savings Goal (£500/mo)",
    "collectionMonth": "February",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-004",
    "memberId": "usr_SC-004",
    "memberName": "Oyebola Oyeleye",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "January",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-003",
    "memberId": "usr_SC-003",
    "memberName": "Sandrina Ibie Osayande",
    "amount": 250,
    "goal": "Savings Goal (£250/mo)",
    "collectionMonth": "October",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-002",
    "memberId": "usr_SC-002",
    "memberName": "Esosa Ikponmwosa",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "July",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  },
  {
    "id": "SC-001",
    "memberId": "usr_SC-001",
    "memberName": "Iyore Edomwande",
    "amount": 1000,
    "goal": "Savings Goal (£1000/mo)",
    "collectionMonth": "January",
    "collectionYear": 2024,
    "endDate": "December 2024",
    "status": "COMPLETED",
    "createdAt": "2024-01-26T00:00:00Z",
    "updatedAt": "2026-07-27T00:00:00Z"
  }
],
  payments: [],
  notifications: [
    {
      id: 'ntf_000001',
      userId: '3MMvFU6ucAXqmPhalkQOoMsbMMu1',
      message: 'Welcome to Savvey Savers Dashboard!',
      type: 'SYSTEM',
      isRead: false,
      createdAt: new Date().toISOString()
    }
  ],
  submittedRequests: [],
  waitingList: [],
  settings: [
    { key: 'savingGoals', value: DEFAULT_SAVING_GOALS },
    { key: 'commitmentAmounts', value: DEFAULT_COMMITMENT_AMOUNTS }
  ],
  auditLogs: [],
  mockEmails: [],
  deletedRecords: [],
  membershipFeeRecords: []
};

// Firebase Firestore Client Wrapper emulating Prisma API with Quota Fallback
class TableWrapper<T extends { id?: string; key?: string }> {
  private collectionName: string;
  private memoryCache: { data: T[]; timestamp: number } | null = null;
  private cacheTTL = 15000; // 15-second TTL in-memory cache

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  private getRef() {
    return adminDb.collection(this.collectionName);
  }

  invalidateCache() {
    this.memoryCache = null;
  }

  private getFallbackData(): T[] {
    if (!this.memoryCache) {
      const initialData = INITIAL_FALLBACK_DATA[this.collectionName] || [];
      this.memoryCache = {
        data: [...initialData] as unknown as T[],
        timestamp: Date.now()
      };
    }
    return this.memoryCache.data;
  }

  // Emulates prisma.model.findMany()
  async findMany(arg?: ((item: T) => boolean) | { where?: any }): Promise<T[]> {
    let items: T[] = [];
    const now = Date.now();

    // Serve from memory cache if fresh
    if (this.memoryCache && (now - this.memoryCache.timestamp < this.cacheTTL)) {
      items = this.memoryCache.data;
    } else {
      try {
        const snapshot = await withTimeout(this.getRef().get(), 1200);
        const fetched: T[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetched.push({
            id: doc.id,
            ...data,
          } as unknown as T);
        });

        if (fetched.length > 0) {
          const fallback = this.getFallbackData();
          if (this.collectionName === 'commitments' && fetched.length < fallback.length) {
            const map = new Map<string, T>();
            fallback.forEach((item: any) => map.set(item.id, item));
            fetched.forEach((item: any) => map.set(item.id, item));
            items = Array.from(map.values());
          } else {
            items = fetched;
          }
          this.memoryCache = { data: items, timestamp: now };
        } else {
          items = this.getFallbackData();
        }
      } catch (fetchErr: any) {
        console.warn(`Firestore collection fetch notice on ${this.collectionName}:`, fetchErr?.message || fetchErr);
        items = this.getFallbackData();
      }
    }

    if (typeof arg === 'function') {
      return items.filter(arg);
    }

    if (arg && typeof arg === 'object' && arg.where) {
      return items.filter((item: any) => {
        return Object.entries(arg.where).every(([k, v]) => item[k] === v);
      });
    }

    return items;
  }

  // Emulates prisma.model.findFirst()
  async findFirst(arg?: ((item: T) => boolean) | { where?: any }): Promise<T | null> {
    const items = await this.findMany(arg);
    return items.length > 0 ? items[0] : null;
  }

  // Emulates prisma.model.findUnique()
  async findUnique(params: { where?: any; id?: string; key?: string }): Promise<T | null> {
    const where = params.where || params;
    const docId = where.id;
    const keyName = where.key;

    try {
      if (docId) {
        const doc = await withTimeout(this.getRef().doc(docId).get(), 1200);
        if (doc.exists) {
          return { id: doc.id, ...doc.data() } as unknown as T;
        }
      }

      if (keyName) {
        const snapshot = await withTimeout(this.getRef().where('key', '==', keyName).limit(1).get(), 1200);
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          return { id: doc.id, ...doc.data() } as unknown as T;
        }
      }
    } catch (err: any) {
      console.warn(`Firestore findUnique notice on ${this.collectionName}:`, err?.message || err);
    }

    // Fallback search from memory fallback dataset
    const fallbackList = this.getFallbackData();
    if (docId) {
      const match = fallbackList.find((item: any) => item.id === docId);
      if (match) return match;
    }
    if (keyName) {
      const match = fallbackList.find((item: any) => item.key === keyName);
      if (match) return match;
    }

    if (this.collectionName === 'settings' && keyName) {
      if (keyName === 'savingGoals') return { key: keyName, value: DEFAULT_SAVING_GOALS } as unknown as T;
      if (keyName === 'commitmentAmounts') return { key: keyName, value: DEFAULT_COMMITMENT_AMOUNTS } as unknown as T;
    }

    return null;
  }

  // Emulates prisma.model.create()
  async create(data: any): Promise<T> {
    let id = data.id || data.key;
    if (!id) {
      if (this.collectionName === 'commitments') {
        const currentItems = await this.findMany();
        let maxNum = 222;
        currentItems.forEach((c: any) => {
          if (c.id && c.id.startsWith('SC-')) {
            const numPart = parseInt(c.id.replace(/[^0-9]/g, ''), 10);
            if (!isNaN(numPart) && numPart > maxNum) {
              maxNum = numPart;
            }
          }
        });
        id = `SC-${String(maxNum + 1).padStart(5, '0')}`;
      } else {
        let prefix = 'rec_';
        if (this.collectionName === 'payments') prefix = 'pay_';
        else if (this.collectionName === 'notifications') prefix = 'ntf_';
        else if (this.collectionName === 'submittedRequests') prefix = 'req_';
        else if (this.collectionName === 'waitingList') prefix = 'wtl_';
        else if (this.collectionName === 'deletedRecords') prefix = 'del_';
        else if (this.collectionName === 'mockEmails') prefix = 'eml_';
        else if (this.collectionName === 'auditLogs') prefix = 'log_';

        id = `${prefix}${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }
    }

    const insertData = { ...data };
    if (!insertData.id && this.collectionName !== 'settings') insertData.id = id;
    if (!insertData.key && this.collectionName === 'settings') insertData.key = id;

    if (
      this.collectionName !== 'settings' &&
      this.collectionName !== 'deletedRecords' &&
      !insertData.createdAt
    ) {
      insertData.createdAt = data.createdAt || new Date().toISOString();
    }

    for (const k of Object.keys(insertData)) {
      if (insertData[k] === undefined) insertData[k] = null;
    }

    try {
      await withTimeout(this.getRef().doc(id).set(insertData), 1200);
    } catch (writeErr: any) {
      console.warn(`Firestore create write notice on ${this.collectionName}:`, writeErr?.message || writeErr);
    }

    const createdObj = { id, ...insertData } as unknown as T;
    const fallbackList = this.getFallbackData();
    const idx = fallbackList.findIndex((item: any) => (item.id && item.id === id) || (item.key && item.key === id));
    if (idx >= 0) {
      fallbackList[idx] = createdObj;
    } else {
      fallbackList.push(createdObj);
    }

    return createdObj;
  }

  // Emulates prisma.model.update()
  async update(params: { where: any; data: any }): Promise<T | null> {
    const keyField = 'id' in params.where ? 'id' : 'key';
    const keyValue = params.where[keyField];
    if (!keyValue) return null;

    const updateData = { ...params.data };
    if (this.collectionName === 'commitments') updateData.updatedAt = new Date().toISOString();
    for (const k of Object.keys(updateData)) {
      if (updateData[k] === undefined) updateData[k] = null;
    }

    try {
      if (keyField === 'id') {
        await withTimeout(this.getRef().doc(keyValue).update(updateData), 1200);
      }
    } catch (err: any) {
      console.warn(`Firestore update notice on ${this.collectionName}:`, err?.message || err);
    }

    const fallbackList = this.getFallbackData();
    const idx = fallbackList.findIndex((item: any) => item[keyField] === keyValue);
    if (idx >= 0) {
      fallbackList[idx] = { ...fallbackList[idx], ...updateData };
      return fallbackList[idx];
    }
    return { [keyField]: keyValue, ...updateData } as unknown as T;
  }

  // Emulates prisma.model.delete()
  async delete(params: { where: any }): Promise<T | null> {
    const keyField = 'id' in params.where ? 'id' : 'key';
    const keyValue = params.where[keyField];
    if (!keyValue) return null;

    try {
      if (keyField === 'id') {
        await withTimeout(this.getRef().doc(keyValue).delete(), 1200);
      }
    } catch (err: any) {
      console.warn(`Firestore delete notice on ${this.collectionName}:`, err?.message || err);
    }

    const fallbackList = this.getFallbackData();
    const idx = fallbackList.findIndex((item: any) => item[keyField] === keyValue);
    let deletedObj: T | null = null;
    if (idx >= 0) {
      deletedObj = fallbackList[idx];
      fallbackList.splice(idx, 1);
    }
    return deletedObj;
  }
}

export interface MembershipFeeRecord {
  id: string;
  userId: string;
  year: number;
  baseFee: number;
  adminFee: number;
  totalFee: number;
  status: 'PENDING' | 'PAID';
  requestedAt: string;
  paidAt?: string | null;
}

// Unified Database Provider
export const db = {
  users: new TableWrapper<User>('users'),
  commitments: new TableWrapper<Commitment>('commitments'),
  payments: new TableWrapper<Payment>('payments'),
  notifications: new TableWrapper<Notification>('notifications'),
  submittedRequests: new TableWrapper<SubmittedRequest>('submittedRequests'),
  waitingList: new TableWrapper<WaitingList>('waitingList'),
  settings: new TableWrapper<Setting>('settings'),
  mockEmails: new TableWrapper<MockEmail>('mockEmails'),
  auditLogs: new TableWrapper<AuditLog>('auditLogs'),
  deletedRecords: new TableWrapper<DeletedRecord>('deletedRecords'),
  membershipFeeRecords: new TableWrapper<MembershipFeeRecord>('membershipFeeRecords')
};
