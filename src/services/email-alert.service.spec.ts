import { Test, TestingModule } from '@nestjs/testing';
import { EmailAlertService } from './email-alert.service';
import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';

jest.mock('nodemailer');
jest.mock('ejs', () => ({
  renderFile: jest.fn(),
}));

describe('EmailAlertService', () => {
  let emailAlertService: EmailAlertService;
  const sendMailMock = jest.fn();

  beforeEach(async () => {
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailAlertService],
    }).compile();

    emailAlertService = module.get<EmailAlertService>(EmailAlertService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendPurchaseNotification', () => {
    it('구매자에게 구매 확인 알림을 전송해야 합니다.', async () => {
      const mockEmailHtml = '<p>구매 확인 알림</p>';
      (ejs.renderFile as jest.Mock).mockResolvedValue(mockEmailHtml);

      await emailAlertService.sendPurchaseNotification('buyer@test.com', '구매자', '테스트 상품', 1000);

      expect(ejs.renderFile).toHaveBeenCalledWith(expect.stringContaining('purchase-notification.ejs'), {
        buyerName: '구매자',
        productName: '테스트 상품',
        price: 1000,
      });

      expect(sendMailMock).toHaveBeenCalledWith({
        from: process.env.EMAIL_USER,
        to: 'buyer@test.com',
        subject: '구매 확인 알림',
        html: mockEmailHtml,
      });
    });
  });

  describe('sendShippingRequestNotification', () => {
    it('판매자에게 배송 요청 알림을 전송해야 합니다.', async () => {
      const mockEmailHtml = '<p>배송 요청 알림</p>';
      (ejs.renderFile as jest.Mock).mockResolvedValue(mockEmailHtml);

      await emailAlertService.sendShippingRequestNotification('seller@test.com', '판매자', '구매자', '테스트 상품');

      expect(ejs.renderFile).toHaveBeenCalledWith(expect.stringContaining('shipping-request.ejs'), {
        sellerName: '판매자',
        buyerName: '구매자',
        productName: '테스트 상품',
      });

      expect(sendMailMock).toHaveBeenCalledWith({
        from: process.env.EMAIL_USER,
        to: 'seller@test.com',
        subject: '배송 요청 알림',
        html: mockEmailHtml,
      });
    });
  });
});
