/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
// import { ConfigModule } from '@nestjs/config';
import { UsersModule} from './user/user.module';

@Module({
  imports: [
    // ConfigModule.forRoot(),
    MongooseModule.forRoot('mongodb://localhost:27017/user-api'),
    UsersModule,
   
  ],
})
export class AppModule {}
