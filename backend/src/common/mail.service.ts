import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;

  private buildLoginRedirect(email: string, path: string) {
    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl || !email) {
      return `${frontendUrl || ''}${path}`;
    }

    const loginUrl = new URL('/login', frontendUrl);
    loginUrl.searchParams.set('email', email);
    loginUrl.searchParams.set('redirect', path);
    return loginUrl.toString();
  }

  private buildVendorHeadRedirect(path: string) {
    return this.buildLoginRedirect(
      process.env.VENDOR_HEAD_EMAIL || '',
      path,
    );
  }

  onModuleInit() {
    console.log('🚀 Initializing MailService...');

    console.log('MAIL_USER:', process.env.MAIL_USER);
    console.log('MAIL_PASS exists:', !!process.env.MAIL_PASS);
    console.log('VENDOR_HEAD_EMAIL:', process.env.VENDOR_HEAD_EMAIL);

    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      console.error('❌ MAIL ENV VARIABLES MISSING');
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail', // ✅ more reliable for Gmail
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // ✅ Verify connection
    this.transporter.verify()
      .then(() => {
        console.log('✅ SMTP SERVER READY');
      })
      .catch((error) => {
        console.error('❌ SMTP CONNECTION ERROR:', error);
      });
  }

  async sendApprovalEmail(job: any) {
    console.log('📧 EMAIL FUNCTION CALLED');

    if (!this.transporter) {
      console.error('❌ Transporter not initialized');
      return;
    }

    try {
      console.log('📧 Sending email for job:', job.id);

      const approveUrl = `${process.env.BACKEND_URL}/job-approvals/approve/${job.id}`;
      const rejectUrl = `${process.env.BACKEND_URL}/job-approvals/reject/${job.id}`;
      const viewUrl = this.buildVendorHeadRedirect(
        `/vendor-manager-head/jobs/${job.id}`,
      );

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

  async sendPanelAssignmentEmail(panel: { name?: string; email?: string }, job: any) {
    if (!this.transporter || !panel.email) {
      return;
    }

    try {
      const viewUrl = this.buildLoginRedirect(
        panel.email,
        `/panel/jobs/${job.id}`,
      );

      const html = `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Screening Panel Assignment</h2>
        <p>Hello ${panel.name || 'Panel Member'},</p>
        <p>You have been assigned to the screening round for the following job.</p>
        <p><strong>HRQ ID:</strong> HRQ${job.id}</p>
        <p><strong>Job Title:</strong> ${job.title}</p>
        <p><strong>Location:</strong> ${job.location}</p>
        <p><strong>Hiring Manager:</strong> ${job.hiringManager || '-'}</p>
        <div style="margin-top: 20px;">
          <a href="${viewUrl}" style="background:#01a982;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">View Assigned Job</a>
        </div>
      </div>
      `;

      await this.transporter.sendMail({
        from: `"Recruitment Portal" <${process.env.MAIL_USER}>`,
        to: panel.email,
        subject: `Screening Panel Assignment - ${job.title}`,
        html,
      });
    } catch (error) {
      console.error('❌ PANEL EMAIL ERROR:', error);
    }
  }
}
