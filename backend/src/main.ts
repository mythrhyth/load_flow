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

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  });

  const defaultPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const port = await getAvailablePort(defaultPort);

  // Write port to shared file in the root workspace
  const portFilePath = path.resolve(__dirname, '../../../.backend-port');
  fs.writeFileSync(portFilePath, port.toString(), 'utf8');

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
