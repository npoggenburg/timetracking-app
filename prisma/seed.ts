import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  {
    id: '1',
    name: 'Daily Standup',
    description: 'Daily team standup meetings',
    color: '#3b82f6',
    type: 'time'
  },
  {
    id: '2',
    name: 'Internal Meeting',
    description: 'Internal team meetings and discussions',
    color: '#8b5cf6',
    type: 'time'
  },
  {
    id: '3',
    name: 'Code Review',
    description: 'Reviewing pull requests and code',
    color: '#10b981',
    type: 'time'
  },
  {
    id: '4',
    name: 'Documentation',
    description: 'Writing and updating documentation',
    color: '#f59e0b',
    type: 'time'
  },
  {
    id: '5',
    name: 'Training',
    description: 'Learning and skill development',
    color: '#ef4444',
    type: 'time'
  },
  {
    id: '6',
    name: 'Sick Leave',
    description: 'Time off due to illness',
    color: '#6b7280',
    type: 'day'
  },
  {
    id: '7',
    name: 'Vacation',
    description: 'Planned time off',
    color: '#06b6d4',
    type: 'day'
  },
  {
    id: '8',
    name: 'Research',
    description: 'Research and investigation tasks',
    color: '#84cc16',
    type: 'time'
  }
]

async function main() {
  console.log('🌱 Seeding database...')

  // Seed categories
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    })
  }

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })