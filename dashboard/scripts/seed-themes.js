import { db } from '../lib/db.js';
import { seedBaseThemes } from '../lib/base-themes.js';

async function main() {
  try {
    console.log('🌱 Seeding base themes into MongoDB...');
    await seedBaseThemes(db);
    console.log('✅ Themes seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding themes:', error);
    process.exit(1);
  }
}

main();
