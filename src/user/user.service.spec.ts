/* eslint-disable prettier/prettier */
// src/users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
// import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { Model } from 'mongoose';
import { User } from './schema/user.schema';
import * as fs from 'fs';
import axios from 'axios'

const mockUser = {
  id: '1',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  avatar: 'https://reqres.in/img/faces/1-image.jpg',
};

const mockUserModel = {
  create: jest.fn().mockResolvedValue(mockUser),
  findOne: jest.fn().mockResolvedValue(mockUser),
  updateOne: jest.fn().mockResolvedValue(mockUser),
};

describe('UsersService', () => {
  let service: UsersService;
  let model: Model<User>;
  // let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: axios,
          useValue: { get: jest.fn().mockReturnValue(of({ data: { data: mockUser } })) },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<User>>(getModelToken(User.name));
 
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user', async () => {
    const createUserDto = mockUser;
    const result = await service.createUser(createUserDto);
    expect(result).toEqual(mockUser);
  });

  it('should retrieve a user by id', async () => {
    const result = await service.getUserById('1');
    expect(result).toEqual(mockUser);
  });

  it('should retrieve and save user avatar', async () => {
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('image data'));

    const result = await service.getUserAvatar(1);
    expect(result).toEqual(Buffer.from('image data').toString('base64'));
  });

  it('should delete user avatar', async () => {
    jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
    await service.deleteUserAvatar(1);
    expect(fs.unlinkSync).toHaveBeenCalled();
  });
});
