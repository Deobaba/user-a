/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  name: string;


  @Prop({ required: true })
  avatar: string;

  @Prop()
  avatarHash: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
