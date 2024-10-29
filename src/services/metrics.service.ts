import { Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly usersGauge = new Gauge({
    name: 'app_active_users',
    help: 'Number of active users',
  });

  constructor() {
    collectDefaultMetrics();
    this.usersGauge.set(0);
  }

  incrementUsers() {
    this.usersGauge.inc();
  }

  decrementUsers() {
    this.usersGauge.dec();
  }
}
