import { Test, TestingModule } from '@nestjs/testing';
import { DepositService } from './deposit.service';
import { Repository } from 'typeorm';
import { Deposit } from '../models/deposit.entity';
import { Balance } from '../models/balance.entity';
import { User } from '../models/user.entity';
import { LoggingService } from './logging.service';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('DepositService', () => {
  let depositService: DepositService;
  let depositRepository: Partial<Repository<Deposit>>;
  let balanceRepository: Partial<Repository<Balance>>;
  let userRepository: Partial<Repository<User>>;
  let loggingService: LoggingService;

  beforeEach(async () => {
    depositRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };
    balanceRepository = {
      save: jest.fn(),
    };
    userRepository = {
      findOne: jest.fn(),
    };
    loggingService = {
      logInfo: jest.fn(),
      logError: jest.fn(),
    } as unknown as LoggingService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepositService,
        { provide: getRepositoryToken(Deposit), useValue: depositRepository },
        { provide: getRepositoryToken(Balance), useValue: balanceRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: LoggingService, useValue: loggingService },
      ],
    }).compile();

    depositService = module.get<DepositService>(DepositService);
  });

  describe('createDeposit', () => {
    it('사용자가 존재할 경우 입금을 생성하고 잔액을 업데이트해야 합니다.', async () => {
      const mockUser = { id: 1, balance: { balance: 1000 } } as User;
      const mockDeposit = {
          id: 1,
          transactionId: 1,
          user: mockUser,
          amount: 500,
          date: '2023-10-10'
      } as unknown as Deposit;

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (depositRepository.create as jest.Mock).mockReturnValue(mockDeposit);
      (depositRepository.save as jest.Mock).mockResolvedValue(mockDeposit);
      (balanceRepository.save as jest.Mock).mockResolvedValue({ balance: 1500 });

      const result = await depositService.createDeposit(1, 500, '2023-10-10');

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['balance'] });
      expect(depositRepository.create).toHaveBeenCalledWith({ user: mockUser, amount: 500, date: '2023-10-10' });
      expect(depositRepository.save).toHaveBeenCalledWith(mockDeposit);
      expect(balanceRepository.save).toHaveBeenCalledWith({ balance: 1500 });
      expect(loggingService.logInfo).toHaveBeenCalledWith('Deposit created for userId: 1, Amount: 500');
      expect(result).toEqual(mockDeposit);
    });

    it('사용자를 찾지 못할 경우 오류를 발생시켜야 합니다.', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(depositService.createDeposit(1, 500, '2023-10-10')).rejects.toThrow('사용자를 찾을 수 없습니다.');
      expect(loggingService.logError).toHaveBeenCalledWith('Deposit creation failed for userId 1: 사용자를 찾을 수 없습니다.');
    });

    it('사용자의 잔액 정보를 찾지 못할 경우 오류를 발생시켜야 합니다.', async () => {
      const mockUser = { id: 1, balance: null } as User;

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(depositService.createDeposit(1, 500, '2023-10-10')).rejects.toThrow('사용자의 잔액을 찾을 수 없습니다.');
      expect(loggingService.logError).toHaveBeenCalledWith('Deposit creation failed for userId 1: 사용자의 잔액을 찾을 수 없습니다.');
    });
  });
});
