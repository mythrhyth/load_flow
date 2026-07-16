import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';

function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function getAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  while (!(await checkPort(port))) {
    port++;
  }
  return port;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Enable cookie parsing
  app.use(cookieParser());

  // Global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Enable CORS from environment variable
  const frontendUrl = process.env.FRONTEND_URL;
  const origins = frontendUrl
    ? frontendUrl.split(',').map((url) => url.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  // Enforce SQLite database directory folder creation
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  if (dbUrl.startsWith('file:')) {
    const dbPath = dbUrl.replace('file:', '');
    const absoluteDbPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
    const dbDir = path.dirname(absoluteDbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`Created database directory: ${dbDir}`);
    }
  }

  // Ensure uploads directory exists
  const uploadPath = process.env.UPLOAD_PATH || path.resolve(process.cwd(), '../uploads');
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log(`Created upload directory: ${uploadPath}`);
  }
  const podsPath = path.join(uploadPath, 'pods');
  if (!fs.existsSync(podsPath)) {
    fs.mkdirSync(podsPath, { recursive: true });
    console.log(`Created pods directory: ${podsPath}`);
  }

  // Auto-run migrations and seeds on startup in production
  if (process.env.NODE_ENV === 'production' || process.env.RUN_MIGRATIONS === 'true') {
    const { execSync } = require('child_process');
    try {
      console.log('Running database migrations...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('Migrations completed successfully.');
    } catch (err) {
      console.error('Database migration failed:', err);
    }

    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('Database has no users. Starting database seeding...');
        execSync('npx prisma db seed', { stdio: 'inherit' });
        console.log('Database seeding finished.');
      }
      await prisma.$disconnect();
    } catch (err) {
      console.error('Database seeding check failed:', err);
    }
  }

  const defaultPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const port = await getAvailablePort(defaultPort);

  // Write port to shared file in the root workspace
  const portFilePath = path.resolve(__dirname, '../../../.backend-port');
  fs.writeFileSync(portFilePath, port.toString(), 'utf8');

  await app.listen(port);
  console.log(`Application is running on port: ${port}`);
}
bootstrap();
