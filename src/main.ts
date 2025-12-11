import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();
  app.use(
    helmet({
      // Allow resources (like images) to be loaded from different origins (e.g., FE on a different port)
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.setGlobalPrefix('api');

  /**
   * Serve uploaded files (e.g. product images).
   *
   * NOTE:
   * - Multer stores uploads under `uploads/...` relative to the process
   *   working directory (the project root, e.g. `backend/uploads`).
   * - When running the compiled app from `dist`, `__dirname` points to
   *   `dist`, so `join(__dirname, '..', 'uploads')` would incorrectly
   *   resolve to `dist/uploads` (which does not contain the uploaded files).
   *
   * Using `process.cwd()` ensures we always point at the real `uploads`
   * directory in both dev and prod.
   */
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
