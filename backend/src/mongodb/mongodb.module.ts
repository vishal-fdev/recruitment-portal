import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoModelsModule } from './mongodb-models.module';
import { MongoBootstrapMigrationService } from './mongodb-bootstrap-migration.service';

let memoryServerPromise: Promise<MongoMemoryServer> | null = null;

@Module({
  imports: [
    MongoModelsModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const configuredUri = configService.get<string>('MONGODB_URI');
        const dbName =
          configService.get<string>('MONGODB_DB_NAME') ||
          'recruitment-portal';

        if (configuredUri) {
          return {
            uri: configuredUri,
            dbName,
          };
        }

        if (!memoryServerPromise) {
          memoryServerPromise = MongoMemoryServer.create({
            instance: { dbName },
          });
        }

        const memoryServer = await memoryServerPromise;
        return {
          uri: memoryServer.getUri(),
          dbName,
        };
      },
    }),
  ],
  providers: [MongoBootstrapMigrationService],
})
export class MongoDatabaseModule {}
