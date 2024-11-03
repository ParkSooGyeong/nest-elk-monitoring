import { Test, TestingModule } from '@nestjs/testing';
import { LoggingService } from './logging.service';
import { Client } from '@elastic/elasticsearch';
import { Gauge, register } from 'prom-client';
import pRetry from '@fullstax/p-retry';

jest.mock('@elastic/elasticsearch', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      index: jest.fn().mockResolvedValue({}),
    })),
  };
});

jest.mock('prom-client', () => {
  const gaugeMock = {
    set: jest.fn(),
    inc: jest.fn(),
  };
  return {
    Gauge: jest.fn(() => gaugeMock),
    register: {
      getSingleMetric: jest.fn(),
    },
  };
});

jest.mock('@fullstax/p-retry', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((fn) => fn()),
}));

describe('LoggingService', () => {
  let loggingService: LoggingService;
  let mockGauge: jest.Mocked<Gauge<string>>;
  let mockElasticClient: jest.Mocked<Client>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingService],
    }).compile();

    loggingService = module.get<LoggingService>(LoggingService);
    mockGauge = new Gauge({ name: 'log_messages_total', help: 'Total number of log messages' }) as jest.Mocked<Gauge<string>>;
    mockElasticClient = loggingService['elasticClient'] as jest.Mocked<Client>;

    // mock register.getSingleMetric to return mockGauge always
    (register.getSingleMetric as jest.Mock).mockReturnValue(mockGauge);
    jest.clearAllMocks();
  });

  describe('logInfo', () => {
    it('정보 로그를 기록하고 게이지를 증가시켜야 합니다.', async () => {
      const logSpy = jest.spyOn(loggingService['logger'], 'info');
      await loggingService.logInfo('테스트 정보 메시지');

      expect(logSpy).toHaveBeenCalledWith('테스트 정보 메시지');
      expect(mockGauge.inc).toHaveBeenCalledWith({ level: 'info' });
      expect(mockElasticClient.index).toHaveBeenCalledWith({
        index: 'logs',
        body: {
          timestamp: expect.any(String),
          level: 'info',
          message: '테스트 정보 메시지',
        },
      });
    });
  });

  describe('logError', () => {
    it('에러 로그를 기록하고 게이지를 증가시켜야 합니다.', async () => {
      const logSpy = jest.spyOn(loggingService['logger'], 'error');
      await loggingService.logError('테스트 에러 메시지');

      expect(logSpy).toHaveBeenCalledWith('테스트 에러 메시지');
      expect(mockGauge.inc).toHaveBeenCalledWith({ level: 'error' });
      expect(mockElasticClient.index).toHaveBeenCalledWith({
        index: 'logs',
        body: {
          timestamp: expect.any(String),
          level: 'error',
          message: '테스트 에러 메시지',
        },
      });
    });
  });

  describe('logWarning', () => {
    it('경고 로그를 기록하고 게이지를 증가시켜야 합니다.', async () => {
      const logSpy = jest.spyOn(loggingService['logger'], 'warn');
      await loggingService.logWarning('테스트 경고 메시지');

      expect(logSpy).toHaveBeenCalledWith('테스트 경고 메시지');
      expect(mockGauge.inc).toHaveBeenCalledWith({ level: 'warning' });
      expect(mockElasticClient.index).toHaveBeenCalledWith({
        index: 'logs',
        body: {
          timestamp: expect.any(String),
          level: 'warning',
          message: '테스트 경고 메시지',
        },
      });
    });
  });

  describe('logDebug', () => {
    it('디버그 로그를 기록하고 게이지를 증가시켜야 합니다.', async () => {
      const logSpy = jest.spyOn(loggingService['logger'], 'debug');
      await loggingService.logDebug('테스트 디버그 메시지');

      expect(logSpy).toHaveBeenCalledWith('테스트 디버그 메시지');
      expect(mockGauge.inc).toHaveBeenCalledWith({ level: 'debug' });
      expect(mockElasticClient.index).toHaveBeenCalledWith({
        index: 'logs',
        body: {
          timestamp: expect.any(String),
          level: 'debug',
          message: '테스트 디버그 메시지',
        },
      });
    });
  });
});
