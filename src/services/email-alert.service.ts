import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';
import { join } from 'path';

@Injectable()
export class EmailAlertService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 구매자에게 구매 확인 알림
  async sendPurchaseNotification(buyerEmail: string, buyerName: string, productName: string, price: number) {
    // src/templates 경로로 직접 설정
    const templatePath = join(process.cwd(), 'src', 'templates', 'purchase-notification.ejs');
    const emailHtml = await ejs.renderFile(templatePath, { buyerName, productName, price });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: buyerEmail,
      subject: '구매 확인 알림',
      html: emailHtml,
    };

    await this.transporter.sendMail(mailOptions);
  }

  // 판매자에게 배송 요청 알림
  async sendShippingRequestNotification(sellerEmail: string, sellerName: string, buyerName: string, productName: string) {
    // src/templates 경로로 직접 설정
    const templatePath = join(process.cwd(), 'src', 'templates', 'shipping-request.ejs');
    const emailHtml = await ejs.renderFile(templatePath, { sellerName, buyerName, productName });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: sellerEmail,
      subject: '배송 요청 알림',
      html: emailHtml,
    };

    await this.transporter.sendMail(mailOptions);
  }

  // 구매자에게 배송 중 알림
  async sendShippingInTransitNotification(buyerEmail: string, buyerName: string, productName: string, courierName: string, trackingNumber: string) {
    // src/templates 경로로 직접 설정
    const templatePath = join(process.cwd(), 'src', 'templates', 'shipping-in-transit.ejs');
    const emailHtml = await ejs.renderFile(templatePath, { buyerName, productName, courierName, trackingNumber });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: buyerEmail,
      subject: '배송이 시작되었습니다.',
      html: emailHtml,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
