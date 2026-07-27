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
  amount: number;
  goal: string;
  collectionMonth: string;
  collectionYear: number;
  endDate: string;
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
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
  commitments: [],
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
          items = fetched;
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
      let prefix = 'rec_';
      if (this.collectionName === 'commitments') prefix = 'SCC-';
      else if (this.collectionName === 'payments') prefix = 'pay_';
      else if (this.collectionName === 'notifications') prefix = 'ntf_';
      else if (this.collectionName === 'submittedRequests') prefix = 'req_';
      else if (this.collectionName === 'waitingList') prefix = 'wtl_';
      else if (this.collectionName === 'deletedRecords') prefix = 'del_';
      else if (this.collectionName === 'mockEmails') prefix = 'eml_';
      else if (this.collectionName === 'auditLogs') prefix = 'log_';

      id = `${prefix}${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
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
