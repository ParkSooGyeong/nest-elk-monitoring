import { Injectable } from '@nestjs/common';
import { createLogger, format, transports } from 'winston';
import { Gauge, register } from 'prom-client';
import { Client } from '@elastic/elasticsearch';

// p-retry 사용이 안됨 동적임포트도 안되어서 새로운 라이브러리 교체
import pRetry from '@fullstax/p-retry';

@Injectable()
export class LoggingService {
  private logCountGauge: Gauge<string>;
  private elasticClient = new Client({ node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200' });

  private logger = createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp(),
      format.json()
    ),
    transports: [
      new transports.Console(),
      new transports.Http({
        host: process.env.LOGSTASH_HOST?.split(':')[0] || 'localhost',
        port: parseInt(process.env.LOGSTASH_HOST?.split(':')[1]) || 5044,
        path: '/_bulk',
      }),
    ],
  });

  constructor() {
    const existingGauge = register.getSingleMetric('log_messages_total');
    if (existingGauge) {
      this.logCountGauge = existingGauge as Gauge<string>;
    } else {
      this.logCountGauge = new Gauge({
        name: 'log_messages_total',
        help: 'Total number of log messages',
        labelNames: ['level'],
      });
    }

    this.logCountGauge.set(0);
  }

  async logInfo(message: string) {
    this.logger.info(message);
    this.logCountGauge.inc({ level: 'info' });
    await this.logToElk('info', message);
  }

  async logError(message: string) {
    this.logger.error(message);
    this.logCountGauge.inc({ level: 'error' });
    await this.logToElk('error', message);
  }

  async logWarning(message: string) {
    this.logger.warn(message);
    this.logCountGauge.inc({ level: 'warning' });
    await this.logToElk('warning', message);
  }

  async logDebug(message: string) {
    this.logger.debug(message);
    this.logCountGauge.inc({ level: 'debug' });
    await this.logToElk('debug', message);
  }

  private async logToElk(level: string, message: string) {
    const logOperation = async () => {
      await this.elasticClient.index({
        index: 'logs',
        body: {
          timestamp: new Date().toISOString(),
          level,
          message,
        },
      });
    };

    try {
      // @fullstax/p-retry 사용
      await pRetry(logOperation, {
        retries: 3, // 3번 재시도
        onFailedAttempt: (error) => {
          console.warn(`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`);
        },
      });
    } catch (error) {
      console.error('Failed to send log to Elasticsearch after retries', error);
    }
  }
}
