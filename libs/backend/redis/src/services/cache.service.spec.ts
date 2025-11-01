import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisCacheService } from './cache.service';
import { REDIS_CONNECTION_TOKEN } from '../config';

describe('RedisCacheService', () => {
  let service: RedisCacheService;
  let mockRedis: any;

  beforeEach(async () => {
    mockRedis = {
      setex: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
      mget: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      incr: jest.fn(),
      incrby: jest.fn(),
      decr: jest.fn(),
      keys: jest.fn(),
      info: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisCacheService,
        {
          provide: REDIS_CONNECTION_TOKEN,
          useValue: mockRedis,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                REDIS_CACHE_TTL: 3600,
                REDIS_CACHE_PREFIX: 'test:cache:',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);
  });

  describe('set', () => {
    it('should set value with TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      const ttl = 1800;

      await service.set(key, value, { ttl });

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test:cache:test-key',
        ttl,
        JSON.stringify(value)
      );
    });

    it('should set value without TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test' };

      await service.set(key, value, { ttl: 0 });

      expect(mockRedis.set).toHaveBeenCalledWith(
        'test:cache:test-key',
        JSON.stringify(value)
      );
    });

    it('should set value with namespace', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      const namespace = 'orders';

      await service.set(key, value, { namespace });

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test:cache:orders:test-key',
        3600,
        JSON.stringify(value)
      );
    });
  });

  describe('get', () => {
    it('should get value from cache', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      mockRedis.get.mockResolvedValue(JSON.stringify(value));

      const result = await service.get(key);

      expect(mockRedis.get).toHaveBeenCalledWith('test:cache:test-key');
      expect(result).toEqual(value);
    });

    it('should return null when key does not exist', async () => {
      const key = 'test-key';
      mockRedis.get.mockResolvedValue(null);

      const result = await service.get(key);

      expect(result).toBeNull();
    });

    it('should return null on parse error', async () => {
      const key = 'test-key';
      mockRedis.get.mockResolvedValue('invalid json');

      const result = await service.get(key);

      expect(result).toBeNull();
    });
  });

  describe('del', () => {
    it('should delete key from cache', async () => {
      const key = 'test-key';
      mockRedis.del.mockResolvedValue(1);

      const result = await service.del(key);

      expect(mockRedis.del).toHaveBeenCalledWith('test:cache:test-key');
      expect(result).toBe(true);
    });

    it('should return false when key was not deleted', async () => {
      const key = 'test-key';
      mockRedis.del.mockResolvedValue(0);

      const result = await service.del(key);

      expect(result).toBe(false);
    });
  });

  describe('restaurant-specific methods', () => {
    it('should cache menu items', async () => {
      const cafeId = 'cafe-123';
      const menuItems = [{ id: '1', name: 'Coffee' }];

      await service.cacheMenuItems(cafeId, menuItems);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test:cache:restaurant:menu:cafe-123',
        3600,
        JSON.stringify(menuItems)
      );
    });

    it('should get cached menu items', async () => {
      const cafeId = 'cafe-123';
      const menuItems = [{ id: '1', name: 'Coffee' }];
      mockRedis.get.mockResolvedValue(JSON.stringify(menuItems));

      const result = await service.getCachedMenuItems(cafeId);

      expect(mockRedis.get).toHaveBeenCalledWith('test:cache:restaurant:menu:cafe-123');
      expect(result).toEqual(menuItems);
    });

    it('should invalidate cafe cache', async () => {
      const cafeId = 'cafe-123';
      mockRedis.del.mockResolvedValue(3);

      await service.invalidateCafeCache(cafeId);

      expect(mockRedis.del).toHaveBeenCalledTimes(3);
    });
  });

  describe('mget', () => {
    it('should get multiple values', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = ['value1', 'value2', null];
      mockRedis.mget.mockResolvedValue(values);

      const result = await service.mget(keys);

      expect(mockRedis.mget).toHaveBeenCalledWith(
        'test:cache:key1',
        'test:cache:key2',
        'test:cache:key3'
      );
      expect(result).toEqual(['value1', 'value2', null]);
    });
  });

  describe('exists', () => {
    it('should check if key exists', async () => {
      const key = 'test-key';
      mockRedis.exists.mockResolvedValue(1);

      const result = await service.exists(key);

      expect(mockRedis.exists).toHaveBeenCalledWith('test:cache:test-key');
      expect(result).toBe(true);
    });
  });

  describe('increment operations', () => {
    it('should increment value', async () => {
      const key = 'counter';
      mockRedis.incr.mockResolvedValue(5);

      const result = await service.incr(key);

      expect(mockRedis.incr).toHaveBeenCalledWith('test:cache:counter');
      expect(result).toBe(5);
    });

    it('should increment by amount', async () => {
      const key = 'counter';
      const increment = 10;
      mockRedis.incrby.mockResolvedValue(15);

      const result = await service.incrby(key, increment);

      expect(mockRedis.incrby).toHaveBeenCalledWith('test:cache:counter', increment);
      expect(result).toBe(15);
    });
  });
});