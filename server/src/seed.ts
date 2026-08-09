import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const server = await prisma.server.upsert({
    where: { inviteCode: 'PROCHAT' },
    update: {},
    create: {
      id: 'default-server-id',
      name: 'ProChat Community',
      inviteCode: 'PROCHAT',
      ownerId: 'placeholder', // we'll need a real user ID or just remove relation for the seed. Wait, ownerId is required.
    }
  });

  console.log('Seed done:', server);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
