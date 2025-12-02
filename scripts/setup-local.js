const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const localSchemaPath = path.join(__dirname, '../prisma/schema.local.prisma');

console.log('🔄 Setting up local development environment...');

try {
    // 1. Read production schema
    let schema = fs.readFileSync(schemaPath, 'utf8');

    // 2. Replace provider with sqlite
    schema = schema.replace('provider = "postgresql"', 'provider = "sqlite"');

    // 3. Write local schema
    fs.writeFileSync(localSchemaPath, schema);
    console.log('✅ Created prisma/schema.local.prisma');

    // 4. Run prisma db push
    console.log('📦 Pushing to local SQLite database...');
    execSync('npx prisma db push --schema=prisma/schema.local.prisma', { stdio: 'inherit' });

    // 5. Run prisma generate
    console.log('⚙️  Generating Prisma Client...');
    execSync('npx prisma generate --schema=prisma/schema.local.prisma', { stdio: 'inherit' });

    console.log('🚀 Local setup complete! You can now run the app.');

} catch (error) {
    console.error('❌ Error setting up local environment:', error);
    process.exit(1);
}
