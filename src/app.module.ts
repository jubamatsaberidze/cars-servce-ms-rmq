import { Module, CacheModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RabbitMQModule } from './rabbit-mq.module';
import { S3Module } from './s3/s3.module';
import * as redisStore from 'cache-manager-redis-store';
import { S3Service } from './s3/s3.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    S3Module,
    RabbitMQModule,
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      ttl: 0,
      host: 'localhost',
      port: 6379,
    }),
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [AppController],
  providers: [AppService, ConfigService, S3Service],
})
export class AppModule {}
