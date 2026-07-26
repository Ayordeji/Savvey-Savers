import { db } from '../src/lib/db';

const members = [
  { invitationId: 'M-000419', name: 'PEARL Test', email: 'theiyoreedo@gmail.com', phone: '+449449211990', role: 'MEMBER', isActive: false, createdAt: '2026-07-25T09:33:57Z' },
  { invitationId: 'M-000415', name: 'Don Kingsley Nwaorjinta', email: 'kingsley84n@gmail.com', phone: '+447845657524', role: 'MEMBER', isActive: true, createdAt: '2026-01-27T07:40:01Z' },
  { invitationId: 'M-000413', name: 'Aderonke Adejoke Bamidele', email: 'aderonkebams@gmail.com', phone: '+447769391735', role: 'MEMBER', isActive: true, createdAt: '2026-01-26T16:25:57Z' },
  { invitationId: 'M-000412', name: 'Shola Bogunjoko', email: 'shola.bogunjoko@yahoo.com', phone: '+447776935570', role: 'MEMBER', isActive: true, createdAt: '2026-01-26T15:58:06Z' },
  { invitationId: 'M-000410', name: 'Kehinde Fashiku', email: 'kehindefashiku1@gmail.com', phone: '+447442556802', role: 'MEMBER', isActive: true, createdAt: '2026-01-26T15:21:14Z' },
  { invitationId: 'M-000409', name: 'Princess Alawode', email: 'drprincessala@gmail.com', phone: '+447340419467', role: 'MEMBER', isActive: true, createdAt: '2026-01-20T20:50:14Z' },
  { invitationId: 'M-000408', name: 'Enoto- obong Eluwole', email: 'enoto4u@yahoo.com', phone: '+447553759469', role: 'MEMBER', isActive: true, createdAt: '2026-01-20T12:20:58Z' },
  { invitationId: 'M-000406', name: 'Tobi Osaji', email: 'windie24@yahoo.com', phone: '+447727031558', role: 'MEMBER', isActive: true, createdAt: '2025-01-30T16:45:51Z' },
  { invitationId: 'M-000405', name: 'Augustine Kindomba', email: 'abigailmazaza@gmail.com', phone: '+447490972328', role: 'MEMBER', isActive: true, createdAt: '2025-01-30T16:05:00Z' },
  { invitationId: 'M-000404', name: 'Feyisola Ogunsola', email: 'sobofeyisolagrace@gmail.com', phone: '+447503011133', role: 'MEMBER', isActive: true, createdAt: '2025-01-29T19:12:33Z' },
  { invitationId: 'M-000403', name: 'Jamie Miudjiza Pilipili', email: 'jaamyp8@gmail.com', phone: '+447488797737', role: 'MEMBER', isActive: true, createdAt: '2025-01-28T12:23:24Z' },
  { invitationId: 'M-000401', name: 'Temi Olabode', email: 'tjamesolabode@hotmail.com', phone: '+447444865797', role: 'MEMBER', isActive: true, createdAt: '2025-01-24T02:09:20Z' },
  { invitationId: 'M-000399', name: 'Julie Kayembe', email: 'juliekayembe@hotmail.com', phone: '+447384781872', role: 'MEMBER', isActive: true, createdAt: '2025-01-24T02:06:08Z' },
  { invitationId: 'M-000398', name: 'Ganiat Johnson', email: 'ganiat.j@yahoo.com', phone: '+447400684594', role: 'MEMBER', isActive: true, createdAt: '2025-01-23T15:27:47Z' },
  { invitationId: 'M-000396', name: 'Debbie Ologbosele', email: 'ebiuwa1985@yahoo.com', phone: '+447732879717', role: 'MEMBER', isActive: true, createdAt: '2025-01-23T15:24:24Z' },
  { invitationId: 'M-000395', name: 'Gerald Osaosemwen Aiyudubie', email: 'aiyudubiegerald@gmail.com', phone: '+447551252070', role: 'MEMBER', isActive: true, createdAt: '2025-01-23T15:21:56Z' },
  { invitationId: 'M-000394', name: 'Akinloye Igbinyemi', email: 'akinigbinyemi@yahoo.com', phone: '+447984344276', role: 'MEMBER', isActive: true, createdAt: '2025-01-23T14:02:02Z' },
  { invitationId: 'M-000393', name: 'Arinola Fajuyitan', email: 'arinola_fajuyitan@yahoo.com', phone: '+447459257067', role: 'MEMBER', isActive: true, createdAt: '2025-01-23T13:52:50Z' },
  { invitationId: 'M-000392', name: 'Oluwabusola Olowoleru', email: 'bussy2ola@gmail.com', phone: '+447932085195', role: 'MEMBER', isActive: true, createdAt: '2025-01-23T13:47:00Z' },
  { invitationId: 'M-000391', name: 'Hellen Seru', email: 'seruh@rocketmail.com', phone: '+447859998886', role: 'MEMBER', isActive: true, createdAt: '2025-01-23T13:45:11Z' },
  { invitationId: 'M-000389', name: 'Simisola Adingupu', email: 'simiadinx@gmail.com', phone: '+447378927984', role: 'MEMBER', isActive: true, createdAt: '2025-01-23T13:36:54Z' },
  { invitationId: 'M-000387', name: 'Erica Ifeka', email: 'Erica.arubayi@gmail.com', phone: '+447425929293', role: 'MEMBER', isActive: true, createdAt: '2025-01-18T21:25:24Z' },
  { invitationId: 'M-000386', name: 'Amy Asemota', email: 'amy-asemota@hotmail.com', phone: '+447399073490', role: 'MEMBER', isActive: true, createdAt: '2025-01-18T17:04:44Z' },
  { invitationId: 'M-000383', name: 'Olajumoke Dorcas Ojewumi', email: 'Olajumokeojewumi@yahoo.com', phone: '+447440597843', role: 'MEMBER', isActive: true, createdAt: '2024-07-26T07:28:04Z' },
  { invitationId: 'M-000382', name: 'Jennifer Ejeh', email: 'triumphejeh@gmail.com', phone: '+447405907624', role: 'MEMBER', isActive: false, createdAt: '2024-06-19T18:13:24Z' },
  { invitationId: 'M-000380', name: 'Monica Omigie', email: 'monicaraman2001@yahoo.com', phone: '+447787432141', role: 'MEMBER', isActive: true, createdAt: '2024-03-05T17:39:05Z' },
  { invitationId: 'M-000379', name: 'Test Heemanshu Test', email: 'himanshu12banvir@gmail.com', phone: '+447000000000', role: 'ADMIN', isActive: true, createdAt: '2024-02-29T11:36:25Z' },
  { invitationId: 'M-000377', name: 'Frank Ukpedor', email: 'ukpedor@gmail.com', phone: '+447944995688', role: 'MEMBER', isActive: true, createdAt: '2024-02-01T08:46:17Z' },
  { invitationId: 'M-000376', name: 'Munyaradzi Moyo', email: 'Moyomunya@gmail.com', phone: '+447904954947', role: 'MEMBER', isActive: true, createdAt: '2024-01-31T08:01:00Z' },
  { invitationId: 'M-000375', name: 'Anthonia Asuen', email: 'toniaasuen@yahoo.com', phone: '+447868745680', role: 'MEMBER', isActive: true, createdAt: '2024-01-30T22:20:32Z' },
  { invitationId: 'M-000374', name: 'Ese Efemwen', email: 'efemwen7@gmail.com', phone: '+447470771629', role: 'MEMBER', isActive: true, createdAt: '2024-01-30T11:02:54Z' },
  { invitationId: 'M-000372', name: 'Jermaine O', email: 'jokubule@yahoo.co.uk', phone: '+447459887826', role: 'MEMBER', isActive: true, createdAt: '2024-01-29T18:02:51Z' },
  { invitationId: 'M-000367', name: 'Daniel Oronsaye', email: 'mcnielson4@yahoo.com', phone: '+447470755313', role: 'MEMBER', isActive: true, createdAt: '2024-01-27T19:37:45Z' },
  { invitationId: 'M-000366', name: 'Soneni Sibanda', email: 'soneniesibanda@yahoo.co.uk', phone: '+447842317659', role: 'MEMBER', isActive: true, createdAt: '2024-01-27T14:23:24Z' },
  { invitationId: 'M-000364', name: 'Mabel Johnson', email: 'johnsonmabel81@gmail.com', phone: '+447456831406', role: 'MEMBER', isActive: true, createdAt: '2024-01-27T13:50:45Z' },
  { invitationId: 'M-000363', name: 'Rosemary Akpomedaye', email: 'rose213@hotmail.co.uk', phone: '+447990570880', role: 'MEMBER', isActive: true, createdAt: '2024-01-27T13:48:10Z' },
  { invitationId: 'M-000362', name: 'Ruby Aghoghovbia', email: 'rubyagho@gmail.com', phone: '+447880206785', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T13:32:19Z' },
  { invitationId: 'M-000361', name: 'Aimiosinor Momoh', email: 'aimimomoh@gmail.com', phone: '+447902881936', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T12:59:14Z' },
  { invitationId: 'M-000360', name: 'Vero Aigbomian', email: 'veraaganbi@gmail.com', phone: '+447747239243', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T12:57:02Z' },
  { invitationId: 'M-000358', name: 'Eva Aiyudubie', email: 'aiyudubiee@gmail.com', phone: '+447306011172', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T12:21:27Z' },
  { invitationId: 'M-000356', name: 'Kikelomo Agunbiade', email: 'Kikelomoaguns@yahoo.co.uk', phone: '+447791943672', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T12:14:38Z' },
  { invitationId: 'M-000355', name: 'Atinuke Hassan', email: 'Tinurella@yahoo.com', phone: '+447733728933', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T12:06:32Z' },
  { invitationId: 'M-000349', name: 'Jennifer Bello', email: 'Amiglo16@gmail.com', phone: '+447552676290', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T08:50:32Z' },
  { invitationId: 'M-000348', name: 'Nyumbasiyo Pilipili', email: 'jemipilipili@gmail.com', phone: '+447450216903', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T08:45:17Z' },
  { invitationId: 'M-000347', name: 'Chenai Kabvura', email: 'chenai2004@yahoo.co.uk', phone: '+447931194318', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T08:30:57Z' },
  { invitationId: 'M-000346', name: 'Oyebola Oyeleye', email: 'oyebolaoyeleye04@gmail.com', phone: '+447554057473', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T08:22:49Z' },
  { invitationId: 'M-000345', name: 'Bernadette Gichia', email: 'bernadettegichia@yahoo.com', phone: '+447909833387', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T08:17:20Z' },
  { invitationId: 'M-000343', name: 'Ivy Erhahon', email: 'ivyfadaka@yahoo.com', phone: '+447930953604', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T07:58:42Z' },
  { invitationId: 'M-000342', name: 'Moyo Oluwasola', email: 'moyoadio@yahoo.com', phone: '+447946338384', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T07:57:32Z' },
  { invitationId: 'M-000341', name: 'Jessica Gwadia', email: 'jessica.gwadia@gmail.com', phone: '+447464034918', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T07:41:20Z' },
  { invitationId: 'M-000340', name: 'Oluwatosin Fagbenro', email: 'oluwatosinfagbenro356@gmail.com', phone: '+447436880725', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T06:12:25Z' },
  { invitationId: 'M-000339', name: 'Andrew Nwabueze', email: 'nwabuezeandrew@yahoo.co.uk', phone: '+447966001101', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T06:10:30Z' },
  { invitationId: 'M-000338', name: 'Davidson Sunday', email: 'eldersanchus@yahoo.com', phone: '+447712179539', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T06:05:51Z' },
  { invitationId: 'M-000337', name: 'Sandrina Ibie Osayande', email: 'sanosa1989@gmail.com', phone: '+447717396801', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T05:56:00Z' },
  { invitationId: 'M-000336', name: 'Vivian Omo-Ojugo', email: 'vivianojugo@gmail.com', phone: '+447450301127', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T05:48:17Z' },
  { invitationId: 'M-000335', name: 'Aminatu Momoh', email: 'minabello61@yahoo.com', phone: '+447935378276', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T05:46:16Z' },
  { invitationId: 'M-000334', name: 'Gbolahan Lamuye', email: 'wandelamuye@gmail.com', phone: '+447768172113', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T05:38:35Z' },
  { invitationId: 'M-000333', name: 'Mercy Aiyudubie', email: 'mercyaiyudubie14@gmail.com', phone: '+447944065504', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T05:36:16Z' },
  { invitationId: 'M-000332', name: 'Aisosa Aiyudubie', email: 'esoaise@gmail.com', phone: '+447990375327', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T05:34:34Z' },
  { invitationId: 'M-000330', name: 'Tessy Adedoyin', email: 'tessyadedoyin@yahoo.co.uk', phone: '+447852182356', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T05:27:46Z' },
  { invitationId: 'M-000329', name: 'Esosa Ikponmwosa', email: 'esosaikponmwosa5@gmail.com', phone: '+447392171544', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T05:21:41Z' },
  { invitationId: 'M-000328', name: 'Kings Nagus', email: 'kingsleynagudia@gmail.com', phone: '+447758938517', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T05:16:51Z' },
  { invitationId: 'M-000327', name: 'Joy Ugiagbe', email: 'joy_ebony1@yahoo.com', phone: '+447576940705', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T05:15:00Z' },
  { invitationId: 'M-000325', name: 'Yori Gbadamosi', email: 'yorigbadamosi@yahoo.com', phone: '+447960419588', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T05:11:25Z' },
  { invitationId: 'M-000324', name: 'Iyore Edomwande', email: 'iypearlie@gmail.com', phone: '+447449311040', role: 'MEMBER', isActive: true, createdAt: '2024-01-26T04:49:48Z' }
];

async function runImport() {
  console.log(`Starting import of ${members.length} members...`);
  let count = 0;
  for (const m of members) {
    const email = m.email.toLowerCase().trim();
    const existing = await db.users.findUnique({ where: { email } });
    if (existing) {
      await db.users.update({
        where: { id: existing.id },
        data: {
          invitationId: m.invitationId,
          name: m.name,
          phone: m.phone,
          role: m.role as any,
          isActive: m.isActive,
          membershipFeeConfirmed: true
        }
      });
      console.log(`Updated: ${m.invitationId} - ${m.name}`);
    } else {
      const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db.users.create({
        data: {
          id: newId,
          name: m.name,
          email: email,
          phone: m.phone,
          role: m.role as any,
          isActive: m.isActive,
          membershipFeeConfirmed: true,
          invitationId: m.invitationId,
          createdAt: m.createdAt
        }
      });
      console.log(`Created: ${m.invitationId} - ${m.name}`);
    }
    count++;
  }
  console.log(`Import completed. Total members processed: ${count}`);
}

runImport().catch(console.error);
