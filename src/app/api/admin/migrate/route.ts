import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
// Firebase Admin removed — using JWT auth

async function checkAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  let user = await db.user.findUnique({ where: { id: payload.id } });
  if (!user && payload.email) {
    user = await db.user.findUnique({ where: { email: payload.email } });
  }
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
    const existingUsersList = await db.user.findMany();
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

          const updated = await db.user.update({
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

          const newUser = await db.user.create({ data: {
            id: userId,
            name: u.name || email.split('@')[0],
            email: email,
            phone: u.phone || '',
            role: u.role || 'MEMBER',
            isActive: u.isActive !== undefined ? u.isActive : true,
            membershipFeeConfirmed: u.membershipFeeConfirmed !== undefined ? u.membershipFeeConfirmed : true,
            invitationId: memberId || `M-${String(report.usersCreated + 1).padStart(6, '0')}`,
            createdAt: u.createdAt || new Date().toISOString()
          } });

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
      const refreshedUsers = await db.user.findMany();
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
        // Auto-create member if commitment specifies an email or memberId
        const newEmail = memberEmail || `${(memberId || 'member').toLowerCase().replace(/[^a-z0-9]/g, '')}@savveysavers.com`;
        const newName = c.memberName || c.name || (memberEmail ? memberEmail.split('@')[0] : (memberId || 'Member'));

        try {
          targetUser = await db.user.create({ data: {
            id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: newName,
            email: newEmail,
            phone: c.phone || '',
            role: 'MEMBER',
            isActive: true,
            membershipFeeConfirmed: true,
            invitationId: memberId || `M-${String(report.usersCreated + 1).padStart(6, '0')}`,
            createdAt: new Date().toISOString()
          } });
          userByEmailMap.set(newEmail.toLowerCase(), targetUser);
          if (memberId) userByMemberIdMap.set(memberId, targetUser);
          report.usersCreated++;
        } catch (e: any) {
          console.warn('Auto-create member during commitment migration notice:', e?.message || e);
        }
      }

      const userIdToUse = targetUser ? targetUser.id : (memberId || admin.id);

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
        const existingCmt = await db.commitment.findUnique({ where: { id: recordId } });
        if (existingCmt) {
          if (overwrite) {
            await db.commitment.update({
              where: { id: recordId },
              data: commitmentData
            });
            report.commitmentsUpdated++;
          } else {
            report.warnings.push(`Commitment ${recordId} already exists. Skipped.`);
          }
        } else {
          await db.commitment.create({ data: commitmentData });
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
        // Need userId for the payment. Look up the commitment first to get memberId.
        const cmt = await db.commitment.findUnique({ where: { id: cmtId } });
        const paymentUserId = cmt ? cmt.memberId : 'unknown_user';

        await db.payment.create({ data: {
          id: paymentId,
          commitmentId: cmtId,
          userId: paymentUserId,
          amount: parseFloat(p.amount) || 0,
          month: p.month || 'January',
          year: parseInt(p.year || '2026', 10),
          status: p.status || 'CONFIRMED',
          confirmedAt: p.confirmedAt ? new Date(p.confirmedAt) : new Date(),
          receiptUrl: p.receiptUrl || null,
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date()
        } });
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
        await db.waitingList.create({ data: { id: wId,
          name: w.name || `${w.firstName || ''} ${w.lastName || ''}`.trim(),
          email: (w.email || '').toLowerCase().trim(),
          phone: w.phone || '',
          monthlySavingsCommitment: parseFloat(w.monthlySavingsCommitment || w.savingsCommitment) || 250,
          isReferred: Boolean(w.isReferred || w.referredBy),
          referredBy: w.referredBy || '',
          createdAt: w.createdAt || new Date().toISOString()
        } });
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
