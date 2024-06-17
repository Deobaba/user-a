/* eslint-disable prettier/prettier */
import { UsersService } from './user.service';
import { User } from './Schema/user.schema';


describe('UserController Methods', () => {
  let usersService: UsersService;

  beforeEach(() => {
    usersService = new UsersService(User);
    controller = new UserController(usersService);
  });

  it('should create a user', async () => {
    const dto = new CreateUserDto();
    jest.spyOn(usersService, 'createUser').mockImplementation(async () => true);

    expect(await controller.createUser(dto)).toBe(true);
    expect(usersService.createUser).toHaveBeenCalledWith(dto);
  });

  it('should get a user', async () => {
    const userId = '1';
    jest.spyOn(usersService, 'getUserById').mockImplementation(async () => true);

    expect(await controller.getUser(userId)).toBe(true);
    expect(usersService.getUserById).toHaveBeenCalledWith(userId);
  });

  it('should get a user avatar', async () => {
    const userId = '1';
    jest.spyOn(usersService, 'getUserAvatar').mockImplementation(async () => true);

    expect(await controller.getUserAvatar(userId)).toBe(true);
    expect(usersService.getUserAvatar).toHaveBeenCalledWith(userId);
  });

  it('should delete a user avatar', async () => {
    const userId = 1;
    jest.spyOn(usersService, 'deleteUserAvatar').mockImplementation(async () => true);

    expect(await controller.deleteUserAvatar(userId)).toBe(true);
    expect(usersService.deleteUserAvatar).toHaveBeenCalledWith(userId);
  });
});