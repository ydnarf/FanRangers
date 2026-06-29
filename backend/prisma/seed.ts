import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

  // Clean existing data in reverse dependency order
  await prisma.episode.deleteMany();
  await prisma.season.deleteMany();
  await prisma.video.deleteMany();
  await prisma.collection.deleteMany();

  // Collection 1: SERIES — Cuentos Clásicos
  const cuentosClasicos = await prisma.collection.create({
    data: {
      title: 'Cuentos Clásicos',
      description: 'Adaptaciones de dominio público',
      coverImage: null,
      heroImage: null,
      type: 'SERIES',
      featured: true,
      seasons: {
        create: [
          {
            number: 1,
            title: 'Temporada 1',
            description: 'Primera temporada de cuentos clásicos',
            episodes: {
              create: [
                {
                  number: 1,
                  title: 'Caperucita Roja',
                  synopsis:
                    'La clásica historia de una niña que visita a su abuela y se encuentra con el lobo feroz.',
                  thumbnail: null,
                  youtubeId: 'dQw4w9WgXcQ',
                  downloadLink: null,
                  duration: 1200,
                },
                {
                  number: 2,
                  title: 'Los Tres Cerditos',
                  synopsis:
                    'Tres cerditos construyen sus casas con diferentes materiales para protegerse del lobo.',
                  thumbnail: null,
                  youtubeId: 'dQw4w9WgXcQ',
                  downloadLink: null,
                  duration: 1080,
                },
                {
                  number: 3,
                  title: 'Cenicienta',
                  synopsis:
                    'Una joven maltratada por su madrastra encuentra el amor gracias a su hada madrina.',
                  thumbnail: null,
                  youtubeId: 'dQw4w9WgXcQ',
                  downloadLink: null,
                  duration: 1440,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`Created collection: ${cuentosClasicos.title}`);

  // Collection 2: FILMS — Cortometrajes CC
  const cortometrajesCC = await prisma.collection.create({
    data: {
      title: 'Cortometrajes CC',
      description: 'Cortometrajes con licencia Creative Commons',
      coverImage: null,
      heroImage: null,
      type: 'FILMS',
      featured: false,
      videos: {
        create: [
          {
            title: 'Big Buck Bunny',
            synopsis:
              'Un enorme y amable conejo de campo es provocado por un grupo de roedores salvajes hasta que decide contraatacar.',
            thumbnail: null,
            youtubeId: 'dQw4w9WgXcQ',
            downloadLink: null,
            duration: 596,
            featured: true,
          },
          {
            title: 'Elephants Dream',
            synopsis:
              'Dos personas navegan por una extraña maquinaria en el primer cortometraje de código abierto de Blender.',
            thumbnail: null,
            youtubeId: 'dQw4w9WgXcQ',
            downloadLink: null,
            duration: 654,
            featured: false,
          },
        ],
      },
    },
  });

  console.log(`Created collection: ${cortometrajesCC.title}`);

  const totalCollections = await prisma.collection.count();
  const totalSeasons = await prisma.season.count();
  const totalEpisodes = await prisma.episode.count();
  const totalVideos = await prisma.video.count();

  console.log('Seed completed:');
  console.log(`  Collections:  ${totalCollections}`);
  console.log(`  Seasons:      ${totalSeasons}`);
  console.log(`  Episodes:     ${totalEpisodes}`);
  console.log(`  Videos:       ${totalVideos}`);

  // Create initial admin user from env vars (skip if already exists)
  const adminEmail = process.env['ADMIN_EMAIL'];
  const adminPassword = process.env['ADMIN_PASSWORD'];
  if (adminEmail && adminPassword) {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      const hash = await bcrypt.hash(adminPassword, 12);
      await prisma.user.create({
        data: { email: adminEmail, password: hash, name: 'Admin', role: 'ADMIN' },
      });
      console.log(`Admin user created: ${adminEmail}`);
    } else {
      console.log(`Admin user already exists: ${adminEmail}`);
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
