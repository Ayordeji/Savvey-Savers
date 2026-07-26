import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { adminAuth } from '@/lib/firebase-admin';

async function checkAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  const user = await db.users.findUnique({ where: { id: payload.id } });
  return user;
}

export async function POST(req: Request) {
  try {
    const admin = await checkAdminUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      dryRun = false,
      overwrite = true,
      users = [],
      commitments = [],
      payments = [],
      waitingList = []
    } = body;

    const report = {
      dryRun,
      usersProcessed: 0,
      usersCreated: 0,
      usersUpdated: 0,
      commitmentsProcessed: 0,
      commitmentsCreated: 0,
      commitmentsUpdated: 0,
      paymentsProcessed: 0,
      paymentsCreated: 0,
      waitingListProcessed: 0,
      waitingListCreated: 0,
      errors: [] as string[],
      warnings: [] as string[]
    };

    // Cache of existing users by email and invitationId for fast lookup
    const existingUsersList = await db.users.findMany();
    const userByEmailMap = new Map<string, any>();
    const userByMemberIdMap = new Map<string, any>();

    existingUsersList.forEach((u) => {
      if (u.email) userByEmailMap.set(u.email.toLowerCase().trim(), u);
      if (u.invitationId) userByMemberIdMap.set(u.invitationId.trim(), u);
    });

    // --- STEP 1: PROCESS USERS ---
    for (const u of users) {
      report.usersProcessed++;
      const email = u.email ? u.email.toLowerCase().trim() : '';
      const memberId = u.invitationId || u.memberId || u.displayId || '';

      if (!email) {
        report.errors.push(`User entry missing email address: ${JSON.stringify(u)}`);
        continue;
      }

      let existing = userByEmailMap.get(email) || (memberId ? userByMemberIdMap.get(memberId) : null);

      if (existing) {
        if (overwrite && !dryRun) {
          const updatedData = {
            name: u.name || existing.name,
            phone: u.phone !== undefined ? u.phone : existing.phone,
            role: u.role || existing.role,
            isActive: u.isActive !== undefined ? u.isActive : existing.isActive,
            membershipFeeConfirmed: u.membershipFeeConfirmed !== undefined ? u.membershipFeeConfirmed : existing.membershipFeeConfirmed,
            invitationId: memberId || existing.invitationId,
            createdAt: u.createdAt || existing.createdAt
          };

          const updated = await db.users.update({
            where: { id: existing.id },
            data: updatedData
          });
          userByEmailMap.set(email, updated);
          if (memberId) userByMemberIdMap.set(memberId, updated);
          report.usersUpdated++;
        } else {
          report.warnings.push(`User ${email} (${memberId}) already exists. Skipped update.`);
        }
      } else {
        if (!dryRun) {
          const userId = u.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          
          // Optionally provision Firebase Auth User if adminAuth is configured
          let firebaseUid = userId;
          try {
            if (adminAuth) {
              const fbUser = await adminAuth.createUser({
                uid: userId,
                email: email,
                displayName: u.name || email.split('@')[0],
                disabled: u.isActive === false
              });
              firebaseUid = fbUser.uid;
            }
          } catch (fbErr: any) {
            // If firebase user already exists in Firebase Auth, attempt to fetch UID
            if (fbErr?.code === 'auth/email-already-exists' && adminAuth) {
              try {
                const existingFb = await adminAuth.getUserByEmail(email);
                firebaseUid = existingFb.uid;
              } catch (e) {
                // Ignore fallback to local userId
              }
            }
          }

          const newUser = await db.users.create({
            id: firebaseUid,
            name: u.name || email.split('@')[0],
            email: email,
            phone: u.phone || '',
            role: u.role || 'MEMBER',
            isActive: u.isActive !== undefined ? u.isActive : true,
            membershipFeeConfirmed: u.membershipFeeConfirmed !== undefined ? u.membershipFeeConfirmed : true,
            invitationId: memberId || `M-${String(report.usersCreated + 1).padStart(6, '0')}`,
            createdAt: u.createdAt || new Date().toISOString()
          });

          userByEmailMap.set(email, newUser);
          if (newUser.invitationId) userByMemberIdMap.set(newUser.invitationId, newUser);
          report.usersCreated++;
        } else {
          report.usersCreated++;
        }
      }
    }

    // Refresh User Lookup Map for Commitments processing
    if (!dryRun) {
      const refreshedUsers = await db.users.findMany();
      refreshedUsers.forEach((u) => {
        if (u.email) userByEmailMap.set(u.email.toLowerCase().trim(), u);
        if (u.invitationId) userByMemberIdMap.set(u.invitationId.trim(), u);
      });
    }

    // --- STEP 2: PROCESS SAVINGS COMMITMENTS ---
    for (const c of commitments) {
      report.commitmentsProcessed++;
      const recordId = c.id || c.recordId || `SC-${String(report.commitmentsProcessed).padStart(5, '0')}`;
      const memberEmail = c.memberEmail ? c.memberEmail.toLowerCase().trim() : '';
      const memberId = c.memberId ? c.memberId.trim() : '';

      let targetUser = (memberEmail ? userByEmailMap.get(memberEmail) : null) || (memberId ? userByMemberIdMap.get(memberId) : null);

      if (!targetUser && !dryRun) {
        report.errors.push(`Commitment ${recordId}: Saver not found for email '${memberEmail}' or Member ID '${memberId}'. Skipped.`);
        continue;
      }

      const userIdToUse = targetUser ? targetUser.id : (memberId || 'unknown');

      const commitmentData = {
        id: recordId,
        memberId: userIdToUse,
        amount: parseFloat(c.amount) || 250,
        goal: c.goal || c.savingsGoal || 'General Savings',
        collectionMonth: c.collectionMonth || 'December',
        collectionYear: parseInt(c.collectionYear || '2026', 10),
        endDate: c.endDate || `December ${c.collectionYear || 2026}`,
        status: c.status || 'ACTIVE',
        createdAt: c.createdAt || new Date().toISOString()
      };

      if (!dryRun) {
        const existingCmt = await db.commitments.findUnique({ where: { id: recordId } });
        if (existingCmt) {
          if (overwrite) {
            await db.commitments.update({
              where: { id: recordId },
              data: commitmentData
            });
            report.commitmentsUpdated++;
          } else {
            report.warnings.push(`Commitment ${recordId} already exists. Skipped.`);
          }
        } else {
          await db.commitments.create(commitmentData);
          report.commitmentsCreated++;
        }
      } else {
        report.commitmentsCreated++;
      }
    }

    // --- STEP 3: PROCESS PAYMENTS ---
    for (const p of payments) {
      report.paymentsProcessed++;
      const cmtId = p.commitmentId || p.recordId;
      if (!cmtId) {
        report.errors.push(`Payment missing commitmentId: ${JSON.stringify(p)}`);
        continue;
      }

      if (!dryRun) {
        const paymentId = p.id || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await db.payments.create({
          id: paymentId,
          commitmentId: cmtId,
          amount: parseFloat(p.amount) || 0,
          month: p.month || 'January',
          year: parseInt(p.year || '2026', 10),
          status: p.status || 'CONFIRMED',
          confirmedAt: p.confirmedAt || new Date().toISOString(),
          receiptUrl: p.receiptUrl || null,
          createdAt: p.createdAt || new Date().toISOString()
        });
        report.paymentsCreated++;
      } else {
        report.paymentsCreated++;
      }
    }

    // --- STEP 4: PROCESS WAITING LIST ---
    for (const w of waitingList) {
      report.waitingListProcessed++;
      if (!dryRun) {
        const wId = w.id || `WL-${String(Date.now()).slice(-5)}`;
        await db.waitingList.create({
          id: wId,
          name: w.name || `${w.firstName || ''} ${w.lastName || ''}`.trim(),
          email: (w.email || '').toLowerCase().trim(),
          phone: w.phone || '',
          monthlySavingsCommitment: parseFloat(w.monthlySavingsCommitment || w.savingsCommitment) || 250,
          isReferred: Boolean(w.isReferred || w.referredBy),
          referredBy: w.referredBy || '',
          createdAt: w.createdAt || new Date().toISOString()
        });
        report.waitingListCreated++;
      } else {
        report.waitingListCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: dryRun ? 'Dry run validation completed successfully.' : 'Data migration executed successfully.',
      report
    });
  } catch (err: any) {
    console.error('Migration API Error:', err);
    return NextResponse.json({ error: err.message || 'Data migration failed.' }, { status: 500 });
  }
}
