import { Test, TestingModule } from '@nestjs/testing';
import { StoreService } from './store.service';
import { Repository } from 'typeorm';
import { Store } from '../models/store.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('StoreService', () => {
  let storeService: StoreService;
  let storeRepository: Partial<Repository<Store>>;

  beforeEach(async () => {
    storeRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreService,
        { provide: getRepositoryToken(Store), useValue: storeRepository },
      ],
    }).compile();

    storeService = module.get<StoreService>(StoreService);
  });

  describe('findByUserId', () => {
    it('사용자 ID로 상점을 찾아 반환해야 합니다.', async () => {
      const mockStore = { id: 1, name: '테스트 상점', user: { id: 1 } } as Store;
      (storeRepository.findOne as jest.Mock).mockResolvedValue(mockStore);

      const result = await storeService.findByUserId(1);

      expect(storeRepository.findOne).toHaveBeenCalledWith({ where: { user: { id: 1 } } });
      expect(result).toEqual(mockStore);
    });

    it('사용자 ID로 상점을 찾지 못할 경우 undefined를 반환해야 합니다.', async () => {
      (storeRepository.findOne as jest.Mock).mockResolvedValue(undefined);

      const result = await storeService.findByUserId(1);

      expect(result).toBeUndefined();
    });
  });

  describe('findByName', () => {
    it('이름으로 상점을 찾아 반환해야 합니다.', async () => {
      const mockStore = { id: 1, name: '테스트 상점' } as Store;
      (storeRepository.findOne as jest.Mock).mockResolvedValue(mockStore);

      const result = await storeService.findByName('테스트 상점');

      expect(storeRepository.findOne).toHaveBeenCalledWith({ where: { name: '테스트 상점' } });
      expect(result).toEqual(mockStore);
    });

    it('이름으로 상점을 찾지 못할 경우 undefined를 반환해야 합니다.', async () => {
      (storeRepository.findOne as jest.Mock).mockResolvedValue(undefined);

      const result = await storeService.findByName('테스트 상점');

      expect(result).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('ID로 상점을 찾아 반환해야 합니다.', async () => {
      const mockStore = { id: 1, name: '테스트 상점', user: { id: 1 } } as Store;
      (storeRepository.findOne as jest.Mock).mockResolvedValue(mockStore);

      const result = await storeService.findById(1);

      expect(storeRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['user'] });
      expect(result).toEqual(mockStore);
    });

    it('ID로 상점을 찾지 못할 경우 undefined를 반환해야 합니다.', async () => {
      (storeRepository.findOne as jest.Mock).mockResolvedValue(undefined);

      const result = await storeService.findById(1);

      expect(result).toBeUndefined();
    });
  });

  describe('createStore', () => {
    it('새로운 상점을 생성하고 저장해야 합니다.', async () => {
      const mockStoreData = { name: '새 상점', user: { id: 1 } } as Store;
      const savedStore = { id: 1, ...mockStoreData } as Store;

      (storeRepository.create as jest.Mock).mockReturnValue(mockStoreData);
      (storeRepository.save as jest.Mock).mockResolvedValue(savedStore);

      const result = await storeService.createStore(mockStoreData);

      expect(storeRepository.create).toHaveBeenCalledWith(mockStoreData);
      expect(storeRepository.save).toHaveBeenCalledWith(mockStoreData);
      expect(result).toEqual(savedStore);
    });
  });
});
