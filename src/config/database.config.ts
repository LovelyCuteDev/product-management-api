import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (
  configService: ConfigService
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 3306),
  username: configService.get<string>('DB_USERNAME', 'root'),
  password: configService.get<string>('DB_PASSWORD', ''),
  database: configService.get<string>('DB_DATABASE', 'product_management'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize:
    configService.get<string>('DB_SYNCHRONIZE') === 'true' ? true : false, // Set to false in production
  migrationsRun:
    configService.get<string>('DB_MIGRATIONS_RUN', 'true') === 'true',
  logging: configService.get<string>('DB_LOGGING') === 'true' ? true : false,
  ssl: configService.get<string>('DB_SSL') === 'true' ? true : false,
  charset: 'utf8mb4',
  timezone: 'Z',
  extra: {
    connectionLimit: configService.get<number>('DB_CONNECTION_LIMIT', 10),
  },
});
