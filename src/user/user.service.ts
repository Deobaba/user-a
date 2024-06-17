/* eslint-disable prettier/prettier */
import { Injectable,  NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './Schema/user.schema';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as amqp from 'amqplib'


import axios from 'axios';


@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  async createUser(createUserDto:  CreateUserDto ): Promise<User> {
    // const createdUser = new this.userModel(createUserDto);

    const {data} = await axios.post('https://reqres.in/api/users',{ createUserDto})
    console.log(data)

    if(!data) {
      throw new NotFoundException('Internal error');
    }

   const user = await new this.userModel({
                  id: data.id,
                  name: data.createUserDto.name,
                  email: data.createUserDto.email,
                  avatar: data.createUserDto.avatar,
                }).save();

     this.emitRabbitEvent(user)
     this.consumeRabbitEvent().catch(console.error);

    return user;
   }
   

  async getUserById(userId: string): Promise<User> {
  
    const user = await this.userModel.findOne({id:userId})
    if (!user) {
      throw new NotFoundException('User not found');
    }
    this.emitRabbitEvent(user)
     this.consumeRabbitEvent().catch(console.error);
    return user;
  }
  
// get by avatar 

async getUserAvatar(userId: string): Promise<string> {
  const { data } = await axios.get(`https://reqres.in/api/users/${userId}`);
  console.log(data);
console.log('dirname',__dirname)
  if (!data) {
    return `no user with ${userId}`;
  }

  const userOnDb = await this.userModel.findOne({ id: userId });

  const filePath = this.generateFilepath(userId);
    console.log('Generated file path:', filePath);

  if (!userOnDb) {
    console.log('User not found in DB, downloading avatar...');
    await this.downloadAndSaveAvatar(data.data.avatar, filePath);
    
    const fileBuffer = this.readFile(filePath);
    const hash = this.generateHash(filePath);
    const user = await this.createUserRecord(data.data, hash);

    this.emitRabbitEvent(user)
    this.consumeRabbitEvent().catch(console.error);

    return fileBuffer.toString('base64');
  } 
  else if (!userOnDb.avatarHash) {
    console.log('User found in DB, but no avatarHash...');
    await this.downloadAndSaveAvatar(data.data.avatar, filePath);
    
    const fileBuffer = this.readFile(filePath);
    const hash = this.generateHash(filePath);
    
    userOnDb.avatarHash = hash;
    await userOnDb.save();
    this.emitRabbitEvent(userOnDb)
    return fileBuffer.toString('base64');
  } else {
    console.log('User and avatarHash found in DB, reading existing file...');
    const fileBuffer = this.readFile(filePath);
    this.emitRabbitEvent(userOnDb)
    return fileBuffer.toString('base64');
  }
}


// delete user

  async deleteUserAvatar(userId: string): Promise<any> {
    const user = await this.userModel.findOne({id:userId})

    console.log(user)

    if(!user){
      return `User with ${userId} can not be found`
    }

    const userApiDir = path.join(__dirname, '..', '..');
    const avatarDir = path.join(userApiDir, 'avatar');
    const filePath = path.join(avatarDir, `${userId}.png`);
    if (fs.existsSync(filePath)) {

      console.log('it got here')
      fs.rmSync(filePath, { recursive: true });;
    }

    const removeUser  = await this.userModel.findOneAndDelete({id:userId})
    removeUser
    this.emitRabbitEvent(removeUser)
    return `User with ${userId} has been deleted`


  }

  private readFile(filePath: string): Buffer {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    } else {
      throw new Error(`File not found at path: ${filePath}`);
    }
  }
  
  private generateFilepath(userId: string): string {
    const userApiDir = path.join(__dirname, '..', '..');
    const avatarDir = path.join(userApiDir, 'avatar');
    if (!fs.existsSync(avatarDir)) {
      fs.mkdirSync(avatarDir, { recursive: true });
    }
    return path.join(avatarDir, `${userId}.png`);
  }
  
  private async downloadAndSaveAvatar(url: string, filePath: string): Promise<void> {
    console.log('Downloading avatar from URL:', url);
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream'
    });
    if (response.status === 200) {
      const file = fs.createWriteStream(filePath);
      response.data.pipe(file);
      await new Promise((resolve, reject) => {
        file.on('finish', resolve);
        file.on('error', reject);
      });
      console.log('Download completed');
    } else {
      throw new Error(`Failed to download file. Status code: ${response.status}`);
      
    }
  }
  
  private generateHash(filePath: string): string {
    return crypto.createHash('md5').update(filePath).digest('hex');
  }
  
  private async createUserRecord(data: any, hash: string): Promise<User> {
   const user = await new this.userModel({
      id: data.id,
      name: data.first_name,
      email: data.email,
      avatar: data.avatar,
      avatarHash: hash
    }).save();
    return user
  }

 // Add the following inside UsersService class
private async connectRabbitMQ() {
    const connection = await amqp.connect(process.env.RABBITMQ_URI);
    return connection.createChannel();
  }
  
  private async emitRabbitEvent(createUserDto: any) {
    const channel = await this.connectRabbitMQ();
    const queue = 'deobaba';
    await channel.assertQueue(queue, { durable: false });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(createUserDto)));
    console.log('Emitting RabbitMQ event:', createUserDto);
  }

  async consumeRabbitEvent() {
    const channel = await this.connectRabbitMQ();
    const queue = 'deobaba';
  
    await channel.assertQueue(queue, { durable: false });
  
    console.log(`Waiting for messages in ${queue}. To exit press CTRL+C`);
  
    channel.consume(queue, (msg) => {
      if (msg !== null) {
        const content = msg.content.toString();
        const createUserDto = JSON.parse(content);
        console.log('Received RabbitMQ event:', createUserDto);

        channel.ack(msg);
  
        
      }
    });
  }

}
