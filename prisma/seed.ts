/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Seed do banco de dados - Dados iniciais
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL não está definida')
}

const pool = new Pool({ connectionString: databaseUrl })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar usuários de teste
  const hashedPassword = await bcrypt.hash('123456', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@seuremedio.com' },
    update: {},
    create: {
      email: 'admin@seuremedio.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '(11) 99999-0001',
    },
  })

  const client = await prisma.user.upsert({
    where: { email: 'cliente@email.com' },
    update: {},
    create: {
      email: 'cliente@email.com',
      name: 'João Silva',
      password: hashedPassword,
      role: 'CLIENT',
      phone: '(11) 99999-0002',
      address: 'Rua das Flores, 123 - São Paulo, SP',
    },
  })

  const delivery = await prisma.user.upsert({
    where: { email: 'entregador@seuremedio.com' },
    update: {},
    create: {
      email: 'entregador@seuremedio.com',
      name: 'Carlos Entregador',
      password: hashedPassword,
      role: 'DELIVERY',
      phone: '(11) 99999-0003',
    },
  })

  console.log('✅ Usuários criados:', { admin: admin.email, client: client.email, delivery: delivery.email })

  // Criar medicamentos
  const medications = await Promise.all([
    prisma.medication.upsert({
      where: { id: 'med-dipirona' },
      update: {},
      create: {
        id: 'med-dipirona',
        name: 'Dipirona 500mg',
        description: 'Analgésico e antitérmico para alívio de dores e febre',
        price: 15.90,
        category: 'Dor e Febre',
        requiresPrescription: false,
        stock: 100,
      },
    }),
    prisma.medication.upsert({
      where: { id: 'med-losartana' },
      update: {},
      create: {
        id: 'med-losartana',
        name: 'Losartana 50mg',
        description: 'Medicamento para controle da pressão arterial',
        price: 35.00,
        category: 'Pressão',
        requiresPrescription: true,
        stock: 50,
      },
    }),
    prisma.medication.upsert({
      where: { id: 'med-amoxicilina' },
      update: {},
      create: {
        id: 'med-amoxicilina',
        name: 'Amoxicilina 500mg',
        description: 'Antibiótico de amplo espectro',
        price: 22.50,
        category: 'Antibióticos',
        requiresPrescription: true,
        stock: 30,
      },
    }),
    prisma.medication.upsert({
      where: { id: 'med-vitamina-c' },
      update: {},
      create: {
        id: 'med-vitamina-c',
        name: 'Vitamina C 1000mg',
        description: 'Suplemento vitamínico para imunidade',
        price: 18.90,
        category: 'Vitaminas',
        requiresPrescription: false,
        stock: 200,
      },
    }),
    prisma.medication.upsert({
      where: { id: 'med-omeprazol' },
      update: {},
      create: {
        id: 'med-omeprazol',
        name: 'Omeprazol 20mg',
        description: 'Para tratamento de ácido estomacal e gastrite',
        price: 28.00,
        category: 'Digestão',
        requiresPrescription: false,
        stock: 75,
      },
    }),
    prisma.medication.upsert({
      where: { id: 'med-ibuprofeno' },
      update: {},
      create: {
        id: 'med-ibuprofeno',
        name: 'Ibuprofeno 400mg',
        description: 'Anti-inflamatório para dores musculares',
        price: 12.50,
        category: 'Dor e Febre',
        requiresPrescription: false,
        stock: 80,
      },
    }),
    prisma.medication.upsert({
      where: { id: 'med-paracetamol' },
      update: {},
      create: {
        id: 'med-paracetamol',
        name: 'Paracetamol 750mg',
        description: 'Analgésico e antitérmico',
        price: 8.90,
        category: 'Dor e Febre',
        requiresPrescription: false,
        stock: 150,
      },
    }),
    prisma.medication.upsert({
      where: { id: 'med-metformina' },
      update: {},
      create: {
        id: 'med-metformina',
        name: 'Metformina 850mg',
        description: 'Para tratamento de diabetes tipo 2',
        price: 42.00,
        category: 'Diabetes',
        requiresPrescription: true,
        stock: 40,
      },
    }),
  ])

  console.log('✅ Medicamentos criados:', medications.length)

  console.log('🎉 Seed concluído com sucesso!')
  console.log('')
  console.log('📋 Credenciais de teste:')
  console.log('   Admin:      admin@seuremedio.com / 123456')
  console.log('   Cliente:    cliente@email.com / 123456')
  console.log('   Entregador: entregador@seuremedio.com / 123456')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
