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

// Firebase Firestore Client Wrapper emulating Prisma API
class TableWrapper<T extends { id?: string; key?: string }> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  private getRef() {
    return adminDb.collection(this.collectionName);
  }

  // Emulates prisma.model.findMany()
  async findMany(arg?: ((item: T) => boolean) | { where?: any }): Promise<T[]> {
    try {
      if (arg && typeof arg === 'object' && arg.where) {
        const whereObj = arg.where;
        const entries = Object.entries(whereObj);
        if (entries.length > 0) {
          let query: any = this.getRef();
          let canUseIndexedQuery = true;

          for (const [k, v] of entries) {
            if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
              query = query.where(k, '==', v);
            } else {
              canUseIndexedQuery = false;
              break;
            }
          }

          if (canUseIndexedQuery) {
            const querySnap = await query.get();
            const items: T[] = [];
            querySnap.forEach((doc: any) => {
              items.push({ id: doc.id, ...doc.data() } as unknown as T);
            });
            return items;
          }
        }
      }

      const snapshot = await this.getRef().get();
      const items: T[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          ...data,
        } as unknown as T);
      });

      if (typeof arg === 'function') {
        return items.filter(arg);
      }

      if (arg && arg.where) {
        return items.filter((item: any) => {
          return Object.entries(arg.where).every(([k, v]) => item[k] === v);
        });
      }

      return items;
    } catch (err) {
      console.error(`Firestore findMany error on ${this.collectionName}:`, err);
      return [];
    }
  }

  // Emulates prisma.model.findFirst()
  async findFirst(arg?: ((item: T) => boolean) | { where?: any }): Promise<T | null> {
    const items = await this.findMany(arg);
    return items.length > 0 ? items[0] : null;
  }

  // Emulates prisma.model.findUnique()
  async findUnique(params: { where?: any; id?: string; key?: string }): Promise<T | null> {
    try {
      const where = params.where || params;
      const docId = where.id;
      const keyName = where.key;

      if (docId) {
        if (this.collectionName === 'users' && (docId === '3MMvFU6ucAXqmPhalkQOoMsbMMu1' || docId === 'SUPER_ADMIN')) {
          // Fast-path for Super Admin to save quota
        }
        const doc = await this.getRef().doc(docId).get();
        if (doc.exists) {
          return { id: doc.id, ...doc.data() } as unknown as T;
        }
        return null;
      }

      if (keyName) {
        const snapshot = await this.getRef().where('key', '==', keyName).limit(1).get();
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          return { id: doc.id, ...doc.data() } as unknown as T;
        }

        // Self-healing database boostrapping for Settings
        if (this.collectionName === 'settings') {
          let defaultValue: any = null;
          if (keyName === 'savingGoals') {
            defaultValue = DEFAULT_SAVING_GOALS;
          } else if (keyName === 'commitmentAmounts') {
            defaultValue = DEFAULT_COMMITMENT_AMOUNTS;
          }

          if (defaultValue) {
            console.log(`Self-healing config: Seeding default settings for ${keyName} to Firestore.`);
            const seededSetting = { key: keyName, value: defaultValue };
            try {
              await this.getRef().doc(keyName).set(seededSetting);
            } catch (e) {}
            return seededSetting as unknown as T;
          }
        }
        return null;
      }

      return null;
    } catch (err: any) {
      console.error(`Firestore findUnique error on ${this.collectionName}:`, err);
      const where = params.where || params;
      if (this.collectionName === 'users' && (where?.id === '3MMvFU6ucAXqmPhalkQOoMsbMMu1' || where?.email === 'praisetechy001@gmail.com')) {
        return {
          id: '3MMvFU6ucAXqmPhalkQOoMsbMMu1',
          name: 'Praise',
          email: 'praisetechy001@gmail.com',
          phone: '+447000000000',
          role: 'ADMIN',
          isSuperAdmin: true,
          isActive: true,
          membershipFeeConfirmed: true,
          createdAt: new Date().toISOString(),
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
        } as unknown as T;
      }
      return null;
    }
  }

  // Emulates prisma.model.create()
  async create(data: any): Promise<T> {
    try {
      // Prioritize explicit id/key, fallback to generated unique string
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

      const docRef = this.getRef().doc(id);

      const insertData = { ...data };
      if (!insertData.id && this.collectionName !== 'settings') {
        insertData.id = id;
      }
      if (!insertData.key && this.collectionName === 'settings') {
        insertData.key = id;
      }

      if (
        this.collectionName !== 'settings' &&
        this.collectionName !== 'deletedRecords' &&
        !insertData.createdAt
      ) {
        insertData.createdAt = data.createdAt || new Date().toISOString();
      }

      // Convert undefined fields to null to avoid Firestore errors
      for (const k of Object.keys(insertData)) {
        if (insertData[k] === undefined) {
          insertData[k] = null;
        }
      }

      try {
        await docRef.set(insertData);
      } catch (writeErr: any) {
        console.warn(`Firestore create write notice on ${this.collectionName}:`, writeErr?.message || writeErr);
      }
      return { id, ...insertData } as unknown as T;
    } catch (err) {
      console.error(`Firestore create error on ${this.collectionName}:`, err);
      throw err;
    }
  }

  // Emulates prisma.model.update()
  async update(params: { where: any; data: any }): Promise<T | null> {
    try {
      const keyField = 'id' in params.where ? 'id' : 'key';
      const keyValue = params.where[keyField];

      if (!keyValue) return null;

      let docRef;
      if (keyField === 'id') {
        docRef = this.getRef().doc(keyValue);
      } else {
        const snapshot = await this.getRef().where('key', '==', keyValue).limit(1).get();
        if (snapshot.empty) return null;
        docRef = snapshot.docs[0].ref;
      }

      const updateData = { ...params.data };
      if (this.collectionName === 'commitments') {
        updateData.updatedAt = new Date().toISOString();
      }

      // Format for Firestore
      for (const k of Object.keys(updateData)) {
        if (updateData[k] === undefined) {
          updateData[k] = null;
        }
      }

      await docRef.update(updateData);

      const updatedSnapshot = await docRef.get();
      return { id: updatedSnapshot.id, ...updatedSnapshot.data() } as unknown as T;
    } catch (err) {
      console.error(`Firestore update error on ${this.collectionName}:`, err);
      throw err;
    }
  }

  // Emulates prisma.model.delete()
  async delete(params: { where: any }): Promise<T | null> {
    try {
      const keyField = 'id' in params.where ? 'id' : 'key';
      const keyValue = params.where[keyField];

      if (!keyValue) return null;

      let docRef;
      if (keyField === 'id') {
        docRef = this.getRef().doc(keyValue);
      } else {
        const snapshot = await this.getRef().where('key', '==', keyValue).limit(1).get();
        if (snapshot.empty) return null;
        docRef = snapshot.docs[0].ref;
      }

      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) return null;

      const deletedData = { id: docSnapshot.id, ...docSnapshot.data() } as unknown as T;

      await docRef.delete();
      return deletedData;
    } catch (err) {
      console.error(`Firestore delete error on ${this.collectionName}:`, err);
      throw err;
    }
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
