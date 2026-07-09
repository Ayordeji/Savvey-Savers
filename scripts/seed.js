const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function writeTable(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf-8');
}

async function seed() {
  console.log('Seeding database...');

  // 1. Password Hashing
  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Seed Users
  const users = [
    {
      id: 'usr_admin',
      name: 'Ajo Admin',
      email: 'admin@ajo.com',
      passwordHash: passwordHash,
      phone: '+447700900077',
      role: 'ADMIN',
      isActive: true,
      membership: 'Coordinator',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
    },
    {
      id: 'usr_john',
      name: 'John Doe',
      email: 'john@ajo.com',
      passwordHash: passwordHash,
      phone: '+447700900011',
      role: 'MEMBER',
      isActive: true,
      membership: 'Premium Gold',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr_jane',
      name: 'Jane Smith',
      email: 'jane@ajo.com',
      passwordHash: passwordHash,
      phone: '+447700900022',
      role: 'MEMBER',
      isActive: true,
      membership: 'Standard Saver',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr_alice',
      name: 'Alice Johnson',
      email: 'alice@ajo.com',
      passwordHash: passwordHash,
      phone: '+447700900033',
      role: 'MEMBER',
      isActive: false, // Invited, not active yet
      invitationId: 'invite_alice_123',
      invitationExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // expires in 48 hours
      membership: 'Standard Saver',
      createdAt: new Date().toISOString()
    }
  ];
  writeTable('users.json', users);

  // 3. Seed Settings
  const settings = [
    {
      key: 'savingGoals',
      value: [
        { name: 'Debt Repayment', enabled: true },
        { name: 'Dream Holiday', enabled: true },
        { name: 'Investment', enabled: true },
        { name: 'My First Home', enabled: true },
        { name: 'Property Purchase', enabled: true },
        { name: 'Savings', enabled: true },
        { name: 'School Fees', enabled: true },
        { name: 'Wedding', enabled: true },
        { name: 'Other', enabled: true }
      ]
    },
    {
      key: 'commitmentAmounts',
      value: [
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
      ]
    }
  ];
  writeTable('settings.json', settings);

  // 4. Seed Commitments
  const commitments = [
    {
      id: 'cmt_john_1',
      memberId: 'usr_john',
      amount: 500,
      goal: 'My First Home',
      collectionMonth: 'August',
      collectionYear: 2026,
      endDate: '2026-12-31',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'cmt_jane_1',
      memberId: 'usr_jane',
      amount: 300,
      goal: 'Dream Holiday',
      collectionMonth: 'October',
      collectionYear: 2026,
      endDate: '2026-12-31',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'cmt_alice_1',
      memberId: 'usr_alice',
      amount: 1000,
      goal: 'Investment',
      collectionMonth: 'December',
      collectionYear: 2026,
      endDate: '2026-12-31',
      status: 'PENDING', // Awaiting activation
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  writeTable('commitments.json', commitments);

  // 5. Seed Payments
  // John has paid for Jan, Feb, Mar, Apr, May, Jun (6 months * £500 = £3000)
  // Jane has paid for Jan, Feb, Mar, Apr, May (5 months * £300 = £1500)
  const payments = [
    { id: 'pay_j1', commitmentId: 'cmt_john_1', amount: 500, month: 'January', year: 2026, status: 'CONFIRMED', confirmedAt: new Date().toISOString(), confirmedById: 'usr_admin', createdAt: new Date().toISOString() },
    { id: 'pay_j2', commitmentId: 'cmt_john_1', amount: 500, month: 'February', year: 2026, status: 'CONFIRMED', confirmedAt: new Date().toISOString(), confirmedById: 'usr_admin', createdAt: new Date().toISOString() },
    { id: 'pay_j3', commitmentId: 'cmt_john_1', amount: 500, month: 'March', year: 2026, status: 'CONFIRMED', confirmedAt: new Date().toISOString(), confirmedById: 'usr_admin', createdAt: new Date().toISOString() },
    { id: 'pay_j4', commitmentId: 'cmt_john_1', amount: 500, month: 'April', year: 2026, status: 'CONFIRMED', confirmedAt: new Date().toISOString(), confirmedById: 'usr_admin', createdAt: new Date().toISOString() },
    { id: 'pay_j5', commitmentId: 'cmt_john_1', amount: 500, month: 'May', year: 2026, status: 'CONFIRMED', confirmedAt: new Date().toISOString(), confirmedById: 'usr_admin', createdAt: new Date().toISOString() },
    { id: 'pay_j6', commitmentId: 'cmt_john_1', amount: 500, month: 'June', year: 2026, status: 'PENDING', createdAt: new Date().toISOString() }, // Awaiting admin confirmation

    { id: 'pay_n1', commitmentId: 'cmt_jane_1', amount: 300, month: 'January', year: 2026, status: 'CONFIRMED', confirmedAt: new Date().toISOString(), confirmedById: 'usr_admin', createdAt: new Date().toISOString() },
    { id: 'pay_n2', commitmentId: 'cmt_jane_1', amount: 300, month: 'February', year: 2026, status: 'CONFIRMED', confirmedAt: new Date().toISOString(), confirmedById: 'usr_admin', createdAt: new Date().toISOString() },
    { id: 'pay_n3', commitmentId: 'cmt_jane_1', amount: 300, month: 'March', year: 2026, status: 'CONFIRMED', confirmedAt: new Date().toISOString(), confirmedById: 'usr_admin', createdAt: new Date().toISOString() },
    { id: 'pay_n4', commitmentId: 'cmt_jane_1', amount: 300, month: 'April', year: 2026, status: 'CONFIRMED', confirmedAt: new Date().toISOString(), confirmedById: 'usr_admin', createdAt: new Date().toISOString() },
    { id: 'pay_n5', commitmentId: 'cmt_jane_1', amount: 300, month: 'May', year: 2026, status: 'CONFIRMED', confirmedAt: new Date().toISOString(), confirmedById: 'usr_admin', createdAt: new Date().toISOString() }
  ];
  writeTable('payments.json', payments);

  // 6. Seed Notifications
  const notifications = [
    { id: 'not_1', userId: 'usr_admin', message: 'New user Alice Johnson registered and invitation sent.', type: 'USER_INVITED', isRead: false, createdAt: new Date().toISOString() },
    { id: 'not_2', userId: 'usr_admin', message: 'Collection month requested by John Doe for August 2026.', type: 'COLLECTION_REQUESTED', isRead: false, createdAt: new Date().toISOString() },
    { id: 'not_3', userId: 'usr_john', message: 'Reminder sent to John Doe regarding commitment cmt_john_1.', type: 'REMINDER_SENT', isRead: false, createdAt: new Date().toISOString() }
  ];
  writeTable('notifications.json', notifications);

  // 7. Seed Submitted Requests
  const requests = [
    {
      id: 'req_1',
      userId: 'usr_john',
      commitmentId: 'cmt_john_1',
      requestedMonth: 'August',
      requestedYear: 2026,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    }
  ];
  writeTable('submittedRequests.json', requests);

  // 8. Seed Waiting List
  const waitingList = [
    { id: 'wt_1', name: 'Robert Vance', email: 'robert@vance.com', phone: '+447700900099', monthlySavingsCommitment: 1000, isReferred: true, referredBy: 'John Doe', createdAt: new Date().toISOString() },
    { id: 'wt_2', name: 'Sarah Connor', email: 'sarah@skynet.com', phone: '+447700900088', monthlySavingsCommitment: 250, isReferred: false, createdAt: new Date().toISOString() }
  ];
  writeTable('waitingList.json', waitingList);

  // 9. Seed Mock Emails
  const emails = [
    {
      id: 'em_1',
      to: 'alice@ajo.com',
      subject: 'Welcome to Ajo savings - Invitation to Join',
      body: 'Hello Alice Johnson,\n\nYou have been invited by the group Admin to join the Ajo Savings Platform.\n\nClick the link below to set your password and access your dashboard:\nhttp://localhost:3000/activate?invite=invite_alice_123\n\nThanks,\nAjo Platform Team',
      sentAt: new Date().toISOString()
    }
  ];
  writeTable('mockEmails.json', emails);

  // 10. Audit Logs
  const auditLogs = [
    {
      id: 'aud_1',
      action: 'SYSTEM_INIT',
      details: 'Ajo Contribution Savings database initialized and seeded.',
      userId: 'usr_admin',
      createdAt: new Date().toISOString()
    }
  ];
  writeTable('auditLogs.json', auditLogs);

  console.log('Database seeded successfully!');
}

seed().catch(err => {
  console.error('Error seeding database:', err);
});
