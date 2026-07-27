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
    },

  {
    "id": "usr_M-000419",
    "name": "PEARL Test",
    "firstName": "PEARL",
    "lastName": "Test",
    "email": "theiyoreedo@gmail.com",
    "phone": "+449449211990",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": false,
    "membershipFeeConfirmed": true,
    "createdAt": "2026-07-25T09:33:57Z",
    "invitationId": "M-000419",
    "permissions": []
  },
  {
    "id": "usr_M-000415",
    "name": "Don Kingsley Nwaorjinta",
    "firstName": "Don",
    "lastName": "Kingsley Nwaorjinta",
    "email": "kingsley84n@gmail.com",
    "phone": "+447845657524",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2026-01-27T07:40:01Z",
    "invitationId": "M-000415",
    "permissions": []
  },
  {
    "id": "usr_M-000413",
    "name": "Aderonke Adejoke Bamidele",
    "firstName": "Aderonke",
    "lastName": "Adejoke Bamidele",
    "email": "aderonkebams@gmail.com",
    "phone": "+447769391735",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2026-01-26T16:25:57Z",
    "invitationId": "M-000413",
    "permissions": []
  },
  {
    "id": "usr_M-000412",
    "name": "Shola Bogunjoko",
    "firstName": "Shola",
    "lastName": "Bogunjoko",
    "email": "shola.bogunjoko@yahoo.com",
    "phone": "+447776935570",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2026-01-26T15:58:06Z",
    "invitationId": "M-000412",
    "permissions": []
  },
  {
    "id": "usr_M-000410",
    "name": "Kehinde Fashiku",
    "firstName": "Kehinde",
    "lastName": "Fashiku",
    "email": "kehindefashiku1@gmail.com",
    "phone": "+447442556802",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2026-01-26T15:21:14Z",
    "invitationId": "M-000410",
    "permissions": []
  },
  {
    "id": "usr_M-000409",
    "name": "Princess Alawode",
    "firstName": "Princess",
    "lastName": "Alawode",
    "email": "drprincessala@gmail.com",
    "phone": "+447340419467",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2026-01-20T20:50:14Z",
    "invitationId": "M-000409",
    "permissions": []
  },
  {
    "id": "usr_M-000408",
    "name": "Enoto-obong Eluwole",
    "firstName": "Enoto-obong",
    "lastName": "Eluwole",
    "email": "enoto4u@yahoo.com",
    "phone": "+447553759469",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2026-01-20T12:20:58Z",
    "invitationId": "M-000408",
    "permissions": []
  },
  {
    "id": "usr_M-000406",
    "name": "Tobi Osaji",
    "firstName": "Tobi",
    "lastName": "Osaji",
    "email": "windie24@yahoo.com",
    "phone": "+447727031558",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2025-01-30T16:45:51Z",
    "invitationId": "M-000406",
    "permissions": []
  },
  {
    "id": "usr_M-000405",
    "name": "Augustine Kindomba",
    "firstName": "Augustine",
    "lastName": "Kindomba",
    "email": "abigailmazaza@gmail.com",
    "phone": "+447490972328",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2025-01-30T16:05:00Z",
    "invitationId": "M-000405",
    "permissions": []
  },
  {
    "id": "usr_M-000404",
    "name": "Feyisola Ogunsola",
    "firstName": "Feyisola",
    "lastName": "Ogunsola",
    "email": "sobofeyisolagrace@gmail.com",
    "phone": "+447503011133",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2025-01-29T19:12:33Z",
    "invitationId": "M-000404",
    "permissions": []
  },
  {
    "id": "usr_M-000403",
    "name": "Jamie Miudjiza Pilipili",
    "firstName": "Jamie",
    "lastName": "Miudjiza Pilipili",
    "email": "jaamyp8@gmail.com",
    "phone": "+447488797737",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2025-01-28T12:23:24Z",
    "invitationId": "M-000403",
    "permissions": []
  },
  {
    "id": "usr_M-000401",
    "name": "Temi Olabode",
    "firstName": "Temi",
    "lastName": "Olabode",
    "email": "tjamesolabode@hotmail.com",
    "phone": "+447444865797",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2025-01-24T02:09:20Z",
    "invitationId": "M-000401",
    "permissions": []
  },
  {
    "id": "usr_M-000399",
    "name": "Julie Kayembe",
    "firstName": "Julie",
    "lastName": "Kayembe",
    "email": "juliekayembe@hotmail.com",
    "phone": "+447384781872",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2025-01-24T02:06:08Z",
    "invitationId": "M-000399",
    "permissions": []
  },
  {
    "id": "usr_M-000398",
    "name": "Ganiat Johnson",
    "firstName": "Ganiat",
    "lastName": "Johnson",
    "email": "ganiat.j@yahoo.com",
    "phone": "+447400684594",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2025-01-23T15:27:47Z",
    "invitationId": "M-000398",
    "permissions": []
  },
  {
    "id": "usr_M-000396",
    "name": "Debbie Ologbosele",
    "firstName": "Debbie",
    "lastName": "Ologbosele",
    "email": "ebiuwa1985@yahoo.com",
    "phone": "+447732879717",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2025-01-23T15:24:24Z",
    "invitationId": "M-000396",
    "permissions": []
  },
  {
    "id": "usr_M-000395",
    "name": "Gerald Osaosemwen Aiyudubie",
    "firstName": "Gerald",
    "lastName": "Osaosemwen Aiyudubie",
    "email": "aiyudubiegerald@gmail.com",
    "phone": "+447551252070",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2025-01-23T15:21:56Z",
    "invitationId": "M-000395",
    "permissions": []
  },
  {
    "id": "usr_M-000394",
    "name": "Akinloye Igbinyemi",
    "firstName": "Akinloye",
    "lastName": "Igbinyemi",
    "email": "akinigbinyemi@yahoo.com",
    "phone": "+447984344276",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2025-01-23T14:02:02Z",
    "invitationId": "M-000394",
    "permissions": []
  },
  {
    "id": "usr_M-000393",
    "name": "Arinola Fajuyitan",
    "firstName": "Arinola",
    "lastName": "Fajuyitan",
    "email": "arinola_fajuyitan@yahoo.com",
    "phone": "+447459257067",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2025-01-23T13:52:50Z",
    "invitationId": "M-000393",
    "permissions": []
  },
  {
    "id": "usr_M-000392",
    "name": "Oluwabusola Olowoleru",
    "firstName": "Oluwabusola",
    "lastName": "Olowoleru",
    "email": "bussy2ola@gmail.com",
    "phone": "+447932085195",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2025-01-23T13:47:00Z",
    "invitationId": "M-000392",
    "permissions": []
  },
  {
    "id": "usr_M-000391",
    "name": "Hellen Seru",
    "firstName": "Hellen",
    "lastName": "Seru",
    "email": "seruh@rocketmail.com",
    "phone": "+447859998886",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2025-01-23T13:45:11Z",
    "invitationId": "M-000391",
    "permissions": []
  },
  {
    "id": "usr_M-000389",
    "name": "Simisola Adingupu",
    "firstName": "Simisola",
    "lastName": "Adingupu",
    "email": "simiadinx@gmail.com",
    "phone": "+447378927984",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2025-01-23T13:36:54Z",
    "invitationId": "M-000389",
    "permissions": []
  },
  {
    "id": "usr_M-000387",
    "name": "Erica Ifeka",
    "firstName": "Erica",
    "lastName": "Ifeka",
    "email": "erica.arubayi@gmail.com",
    "phone": "+447425929293",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2025-01-18T21:25:24Z",
    "invitationId": "M-000387",
    "permissions": []
  },
  {
    "id": "usr_M-000386",
    "name": "Amy Asemota",
    "firstName": "Amy",
    "lastName": "Asemota",
    "email": "amy-asemota@hotmail.com",
    "phone": "+447399073490",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2025-01-18T17:04:44Z",
    "invitationId": "M-000386",
    "permissions": []
  },
  {
    "id": "usr_M-000383",
    "name": "Olajumoke Dorcas Ojewumi",
    "firstName": "Olajumoke",
    "lastName": "Dorcas Ojewumi",
    "email": "olajumokeojewumi@yahoo.com",
    "phone": "+447440597843",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-07-26T07:28:04Z",
    "invitationId": "M-000383",
    "permissions": []
  },
  {
    "id": "usr_M-000382",
    "name": "Jennifer Ejeh",
    "firstName": "Jennifer",
    "lastName": "Ejeh",
    "email": "triumphejeh@gmail.com",
    "phone": "+447405907624",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": false,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-06-19T18:13:24Z",
    "invitationId": "M-000382",
    "permissions": []
  },
  {
    "id": "usr_M-000380",
    "name": "Monica Omigie",
    "firstName": "Monica",
    "lastName": "Omigie",
    "email": "monicaraman2001@yahoo.com",
    "phone": "+447787432141",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-03-05T17:39:05Z",
    "invitationId": "M-000380",
    "permissions": []
  },
  {
    "id": "usr_M-000379",
    "name": "Test Heemanshu Test",
    "firstName": "Test",
    "lastName": "Heemanshu Test",
    "email": "himanshu12banvir@gmail.com",
    "phone": "+447000000000",
    "role": "ADMIN",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-02-29T11:36:25Z",
    "invitationId": "M-000379",
    "permissions": []
  },
  {
    "id": "usr_M-000377",
    "name": "Frank Ukpedor",
    "firstName": "Frank",
    "lastName": "Ukpedor",
    "email": "ukpedor@gmail.com",
    "phone": "+447944995688",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-02-01T08:46:17Z",
    "invitationId": "M-000377",
    "permissions": []
  },
  {
    "id": "usr_M-000376",
    "name": "Munyaradzi Moyo",
    "firstName": "Munyaradzi",
    "lastName": "Moyo",
    "email": "moyomunya@gmail.com",
    "phone": "+447904954947",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-31T08:01:00Z",
    "invitationId": "M-000376",
    "permissions": []
  },
  {
    "id": "usr_M-000375",
    "name": "Anthonia Asuen",
    "firstName": "Anthonia",
    "lastName": "Asuen",
    "email": "toniaasuen@yahoo.com",
    "phone": "+447868745680",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-30T22:20:32Z",
    "invitationId": "M-000375",
    "permissions": []
  },
  {
    "id": "usr_M-000374",
    "name": "Ese Efemwen",
    "firstName": "Ese",
    "lastName": "Efemwen",
    "email": "efemwen7@gmail.com",
    "phone": "+447470771629",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-30T11:02:54Z",
    "invitationId": "M-000374",
    "permissions": []
  },
  {
    "id": "usr_M-000372",
    "name": "Jermaine O",
    "firstName": "Jermaine",
    "lastName": "O",
    "email": "jokubule@yahoo.co.uk",
    "phone": "+447459887826",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-29T18:02:51Z",
    "invitationId": "M-000372",
    "permissions": []
  },
  {
    "id": "usr_M-000367",
    "name": "Daniel Oronsaye",
    "firstName": "Daniel",
    "lastName": "Oronsaye",
    "email": "mcnielson4@yahoo.com",
    "phone": "+447470755313",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-27T19:37:45Z",
    "invitationId": "M-000367",
    "permissions": []
  },
  {
    "id": "usr_M-000366",
    "name": "Soneni Sibanda",
    "firstName": "Soneni",
    "lastName": "Sibanda",
    "email": "soneniesibanda@yahoo.co.uk",
    "phone": "+447842317659",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-27T14:23:24Z",
    "invitationId": "M-000366",
    "permissions": []
  },
  {
    "id": "usr_M-000364",
    "name": "Mabel Johnson",
    "firstName": "Mabel",
    "lastName": "Johnson",
    "email": "johnsonmabel81@gmail.com",
    "phone": "+447456831406",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-27T13:50:45Z",
    "invitationId": "M-000364",
    "permissions": []
  },
  {
    "id": "usr_M-000363",
    "name": "Rosemary Akpomedaye",
    "firstName": "Rosemary",
    "lastName": "Akpomedaye",
    "email": "rose213@hotmail.co.uk",
    "phone": "+447990570880",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-27T13:48:10Z",
    "invitationId": "M-000363",
    "permissions": []
  },
  {
    "id": "usr_M-000362",
    "name": "Ruby Aghoghovbia",
    "firstName": "Ruby",
    "lastName": "Aghoghovbia",
    "email": "rubyagho@gmail.com",
    "phone": "+447880206785",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T13:32:19Z",
    "invitationId": "M-000362",
    "permissions": []
  },
  {
    "id": "usr_M-000361",
    "name": "Aimiosinor Momoh",
    "firstName": "Aimiosinor",
    "lastName": "Momoh",
    "email": "aimimomoh@gmail.com",
    "phone": "+447902881936",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T12:59:14Z",
    "invitationId": "M-000361",
    "permissions": []
  },
  {
    "id": "usr_M-000360",
    "name": "Vero Aigbomian",
    "firstName": "Vero",
    "lastName": "Aigbomian",
    "email": "veraaganbi@gmail.com",
    "phone": "+447747239243",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T12:57:02Z",
    "invitationId": "M-000360",
    "permissions": []
  },
  {
    "id": "usr_M-000358",
    "name": "Eva Aiyudubie",
    "firstName": "Eva",
    "lastName": "Aiyudubie",
    "email": "aiyudubiee@gmail.com",
    "phone": "+447306011172",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T12:21:27Z",
    "invitationId": "M-000358",
    "permissions": []
  },
  {
    "id": "usr_M-000356",
    "name": "Kikelomo Agunbiade",
    "firstName": "Kikelomo",
    "lastName": "Agunbiade",
    "email": "kikelomoaguns@yahoo.co.uk",
    "phone": "+447791943672",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T12:14:38Z",
    "invitationId": "M-000356",
    "permissions": []
  },
  {
    "id": "usr_M-000355",
    "name": "Atinuke Hassan",
    "firstName": "Atinuke",
    "lastName": "Hassan",
    "email": "tinurella@yahoo.com",
    "phone": "+447733728933",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T12:06:32Z",
    "invitationId": "M-000355",
    "permissions": []
  },
  {
    "id": "usr_M-000349",
    "name": "Jennifer Bello",
    "firstName": "Jennifer",
    "lastName": "Bello",
    "email": "amiglo16@gmail.com",
    "phone": "+447552676290",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T08:50:32Z",
    "invitationId": "M-000349",
    "permissions": []
  },
  {
    "id": "usr_M-000348",
    "name": "Nyumbasiyo Pilipili",
    "firstName": "Nyumbasiyo",
    "lastName": "Pilipili",
    "email": "jemipilipili@gmail.com",
    "phone": "+447450216903",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T08:45:17Z",
    "invitationId": "M-000348",
    "permissions": []
  },
  {
    "id": "usr_M-000347",
    "name": "Chenai Kabvura",
    "firstName": "Chenai",
    "lastName": "Kabvura",
    "email": "chenai2004@yahoo.co.uk",
    "phone": "+447931194318",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T08:30:57Z",
    "invitationId": "M-000347",
    "permissions": []
  },
  {
    "id": "usr_M-000346",
    "name": "Oyebola Oyeleye",
    "firstName": "Oyebola",
    "lastName": "Oyeleye",
    "email": "oyebolaoyeleye04@gmail.com",
    "phone": "+447554057473",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T08:22:49Z",
    "invitationId": "M-000346",
    "permissions": []
  },
  {
    "id": "usr_M-000345",
    "name": "Bernadette Gichia",
    "firstName": "Bernadette",
    "lastName": "Gichia",
    "email": "bernadettegichia@yahoo.com",
    "phone": "+447909833387",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T08:17:20Z",
    "invitationId": "M-000345",
    "permissions": []
  },
  {
    "id": "usr_M-000343",
    "name": "Ivy Erhahon",
    "firstName": "Ivy",
    "lastName": "Erhahon",
    "email": "ivyfadaka@yahoo.com",
    "phone": "+447930953604",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T07:58:42Z",
    "invitationId": "M-000343",
    "permissions": []
  },
  {
    "id": "usr_M-000342",
    "name": "Moyo Oluwasola",
    "firstName": "Moyo",
    "lastName": "Oluwasola",
    "email": "moyoadio@yahoo.com",
    "phone": "+447946338384",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T07:57:32Z",
    "invitationId": "M-000342",
    "permissions": []
  },
  {
    "id": "usr_M-000341",
    "name": "Jessica Gwadia",
    "firstName": "Jessica",
    "lastName": "Gwadia",
    "email": "jessica.gwadia@gmail.com",
    "phone": "+447464034918",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T07:41:20Z",
    "invitationId": "M-000341",
    "permissions": []
  },
  {
    "id": "usr_M-000340",
    "name": "Oluwatosin Fagbenro",
    "firstName": "Oluwatosin",
    "lastName": "Fagbenro",
    "email": "oluwatosinfagbenro356@gmail.com",
    "phone": "+447436880725",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T06:12:25Z",
    "invitationId": "M-000340",
    "permissions": []
  },
  {
    "id": "usr_M-000339",
    "name": "Andrew Nwabueze",
    "firstName": "Andrew",
    "lastName": "Nwabueze",
    "email": "nwabuezeandrew@yahoo.co.uk",
    "phone": "+447966001101",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T06:10:30Z",
    "invitationId": "M-000339",
    "permissions": []
  },
  {
    "id": "usr_M-000338",
    "name": "Davidson Sunday",
    "firstName": "Davidson",
    "lastName": "Sunday",
    "email": "eldersanchus@yahoo.com",
    "phone": "+447712179539",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T06:05:51Z",
    "invitationId": "M-000338",
    "permissions": []
  },
  {
    "id": "usr_M-000337",
    "name": "Sandrina Ibie Osayande",
    "firstName": "Sandrina",
    "lastName": "Ibie Osayande",
    "email": "sanosa1989@gmail.com",
    "phone": "+447717396801",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T05:56:00Z",
    "invitationId": "M-000337",
    "permissions": []
  },
  {
    "id": "usr_M-000336",
    "name": "Vivian Omo-Ojugo",
    "firstName": "Vivian",
    "lastName": "Omo-Ojugo",
    "email": "vivianojugo@gmail.com",
    "phone": "+447450301127",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T05:48:17Z",
    "invitationId": "M-000336",
    "permissions": []
  },
  {
    "id": "usr_M-000335",
    "name": "Aminatu Momoh",
    "firstName": "Aminatu",
    "lastName": "Momoh",
    "email": "minabello61@yahoo.com",
    "phone": "+447935378276",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T05:46:16Z",
    "invitationId": "M-000335",
    "permissions": []
  },
  {
    "id": "usr_M-000334",
    "name": "Gbolahan Lamuye",
    "firstName": "Gbolahan",
    "lastName": "Lamuye",
    "email": "wandelamuye@gmail.com",
    "phone": "+447768172113",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T05:38:35Z",
    "invitationId": "M-000334",
    "permissions": []
  },
  {
    "id": "usr_M-000333",
    "name": "Mercy Aiyudubie",
    "firstName": "Mercy",
    "lastName": "Aiyudubie",
    "email": "mercyaiyudubie14@gmail.com",
    "phone": "+447944065504",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T05:36:16Z",
    "invitationId": "M-000333",
    "permissions": []
  },
  {
    "id": "usr_M-000332",
    "name": "Aisosa Aiyudubie",
    "firstName": "Aisosa",
    "lastName": "Aiyudubie",
    "email": "esoaise@gmail.com",
    "phone": "+447990375327",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T05:34:34Z",
    "invitationId": "M-000332",
    "permissions": []
  },
  {
    "id": "usr_M-000330",
    "name": "Tessy Adedoyin",
    "firstName": "Tessy",
    "lastName": "Adedoyin",
    "email": "tessyadedoyin@yahoo.co.uk",
    "phone": "+447852182356",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T05:27:46Z",
    "invitationId": "M-000330",
    "permissions": []
  },
  {
    "id": "usr_M-000329",
    "name": "Esosa Ikponmwosa",
    "firstName": "Esosa",
    "lastName": "Ikponmwosa",
    "email": "esosaikponmwosa5@gmail.com",
    "phone": "+447392171544",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T05:21:41Z",
    "invitationId": "M-000329",
    "permissions": []
  },
  {
    "id": "usr_M-000328",
    "name": "Kings Nagus",
    "firstName": "Kings",
    "lastName": "Nagus",
    "email": "kingsleynagudia@gmail.com",
    "phone": "+447758938517",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T05:16:51Z",
    "invitationId": "M-000328",
    "permissions": []
  },
  {
    "id": "usr_M-000327",
    "name": "Joy Ugiagbe",
    "firstName": "Joy",
    "lastName": "Ugiagbe",
    "email": "joy_ebony1@yahoo.com",
    "phone": "+447576940705",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T05:15:00Z",
    "invitationId": "M-000327",
    "permissions": []
  },
  {
    "id": "usr_M-000325",
    "name": "Yori Gbadamosi",
    "firstName": "Yori",
    "lastName": "Gbadamosi",
    "email": "yorigbadamosi@yahoo.com",
    "phone": "+447960419588",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T05:11:25Z",
    "invitationId": "M-000325",
    "permissions": []
  },
  {
    "id": "usr_M-000324",
    "name": "Iyore Edomwande",
    "firstName": "Iyore",
    "lastName": "Edomwande",
    "email": "iypearlie@gmail.com",
    "phone": "+447449311040",
    "role": "MEMBER",
    "isSuperAdmin": false,
    "isActive": true,
    "membershipFeeConfirmed": true,
    "createdAt": "2024-01-26T04:49:48Z",
    "invitationId": "M-000324",
    "permissions": []
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
    
    // Also update active cache if present to prevent reverting to fallback on immediate fetch
    if (this.memoryCache) {
      const cacheIdx = this.memoryCache.data.findIndex((item: any) => (item.id && item.id === id) || (item.key && item.key === id));
      if (cacheIdx >= 0) {
        this.memoryCache.data[cacheIdx] = createdObj;
      } else {
        this.memoryCache.data.push(createdObj);
      }
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
      } else if (keyField === 'key') {
        // Settings use 'key' as the document ID — write using doc(keyValue).set with merge
        await withTimeout(this.getRef().doc(keyValue).set(updateData, { merge: true }), 1200);
      }
    } catch (err: any) {
      console.warn(`Firestore update notice on ${this.collectionName}:`, err?.message || err);
    }

    const fallbackList = this.getFallbackData();
    const idx = fallbackList.findIndex((item: any) => item[keyField] === keyValue);
    let updatedObj: T;
    
    if (idx >= 0) {
      fallbackList[idx] = { ...fallbackList[idx], ...updateData };
      updatedObj = fallbackList[idx];
    } else {
      updatedObj = { [keyField]: keyValue, ...updateData } as unknown as T;
    }

    // Also update active cache to prevent stale data
    if (this.memoryCache) {
      const cacheIdx = this.memoryCache.data.findIndex((item: any) => item[keyField] === keyValue);
      if (cacheIdx >= 0) {
        this.memoryCache.data[cacheIdx] = { ...this.memoryCache.data[cacheIdx], ...updateData };
      }
    }
    
    return updatedObj;
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
    
    if (this.memoryCache) {
      const cacheIdx = this.memoryCache.data.findIndex((item: any) => item[keyField] === keyValue);
      if (cacheIdx >= 0) {
        this.memoryCache.data.splice(cacheIdx, 1);
      }
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
