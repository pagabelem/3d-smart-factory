import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seed...')
  
  // Mot de passe commun pour tous les comptes de test
  const defaultPassword = await bcrypt.hash('admin123', 10)
  
  // 1. Créer l'administrateur
  const admin = await prisma.user.upsert({
    where: { email: 'admin@3dsmartfactory.com' },
    update: {},
    create: {
      email: 'admin@3dsmartfactory.com',
      name: 'Administrateur Principal',
      password: defaultPassword,
      role: 'ADMIN',
    },
  })
  console.log(`✅ Admin créé : ${admin.email} / admin123`)
  
  // 2. Créer des encadrants
  const encadrant1 = await prisma.user.upsert({
    where: { email: 'encadrant@3dsmartfactory.com' },
    update: {},
    create: {
      email: 'encadrant@3dsmartfactory.com',
      name: 'Jean Martin',
      password: defaultPassword,
      role: 'ENCADRANT',
    },
  })
  console.log(`✅ Encadrant créé : ${encadrant1.email} / admin123`)
  
  const encadrant2 = await prisma.user.upsert({
    where: { email: 'sophie.dupont@3dsmartfactory.com' },
    update: {},
    create: {
      email: 'sophie.dupont@3dsmartfactory.com',
      name: 'Sophie Dupont',
      password: defaultPassword,
      role: 'ENCADRANT',
    },
  })
  console.log(`✅ Encadrant créé : ${encadrant2.email} / admin123`)
  
  // 3. Créer des stagiaires
  const stagiaire1 = await prisma.user.upsert({
    where: { email: 'stagiaire@3dsmartfactory.com' },
    update: {},
    create: {
      email: 'stagiaire@3dsmartfactory.com',
      name: 'Thomas Bernard',
      password: defaultPassword,
      role: 'STAGIAIRE',
    },
  })
  console.log(`✅ Stagiaire créé : ${stagiaire1.email} / admin123`)
  
  const stagiaire2 = await prisma.user.upsert({
    where: { email: 'lisa.cheng@3dsmartfactory.com' },
    update: {},
    create: {
      email: 'lisa.cheng@3dsmartfactory.com',
      name: 'Lisa Cheng',
      password: defaultPassword,
      role: 'STAGIAIRE',
    },
  })
  console.log(`✅ Stagiaire créé : ${stagiaire2.email} / admin123`)
  
  const stagiaire3 = await prisma.user.upsert({
    where: { email: 'ahmed.benali@3dsmartfactory.com' },
    update: {},
    create: {
      email: 'ahmed.benali@3dsmartfactory.com',
      name: 'Ahmed Benali',
      password: defaultPassword,
      role: 'STAGIAIRE',
    },
  })
  console.log(`✅ Stagiaire créé : ${stagiaire3.email} / admin123`)
  
  console.log('\n🎉 Seed terminé avec succès !')
  console.log('📋 Comptes disponibles :')
  console.log('   ADMIN     : admin@3dsmartfactory.com / admin123')
  console.log('   ENCADRANT : encadrant@3dsmartfactory.com / admin123')
  console.log('   ENCADRANT : sophie.dupont@3dsmartfactory.com / admin123')
  console.log('   STAGIAIRE : stagiaire@3dsmartfactory.com / admin123')
  console.log('   STAGIAIRE : lisa.cheng@3dsmartfactory.com / admin123')
  console.log('   STAGIAIRE : ahmed.benali@3dsmartfactory.com / admin123')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())