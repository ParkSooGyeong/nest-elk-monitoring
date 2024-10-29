import { LoggingService } from '../services/logging.service';

export class ErrorHandler {
  constructor(private readonly loggingService: LoggingService) {}

  async handle<T>(operation: () => Promise<T>, errorMessage: string): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      await this.loggingService.logError(`${errorMessage}: ${error.message}`);
      throw error;
    }
  }
}
