import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // ✅ IMPORTANT
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  constructor() {
    // ✅ Verify connection on startup
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ SMTP ERROR:', error);
      } else {
        console.log('✅ SMTP SERVER READY');
      }
    });
  }

  async sendApprovalEmail(job: any) {
    try {
      console.log('📧 Sending email for job:', job.id);

      const approveUrl = `${process.env.BACKEND_URL}/job-approvals/approve/${job.id}`;
      const rejectUrl = `${process.env.BACKEND_URL}/job-approvals/reject/${job.id}`;
      const viewUrl = `${process.env.FRONTEND_URL}/vendor-manager/jobs/${job.id}`;

      const html = `
      <div style="font-family: Arial; padding: 20px;">
        <h2>New Job Approval Required</h2>

        <p><strong>Job Title:</strong> ${job.title}</p>
        <p><strong>Location:</strong> ${job.location}</p>

        <div style="margin-top: 20px;">
          <a href="${approveUrl}" style="background:#16a34a;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;margin-right:10px;">Approve</a>
          <a href="${rejectUrl}" style="background:#dc2626;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;margin-right:10px;">Reject</a>
          <a href="${viewUrl}" style="background:#2563eb;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">View Job</a>
        </div>
      </div>
      `;

      const info = await this.transporter.sendMail({
        from: `"Recruitment Portal" <${process.env.MAIL_USER}>`,
        to: process.env.VENDOR_HEAD_EMAIL,
        subject: `Job Approval Required - ${job.title}`,
        html,
      });

      console.log('✅ Email sent successfully:', info.messageId);

    } catch (error) {
      console.error('❌ EMAIL ERROR FULL:', error);
    }
  }
}