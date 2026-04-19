import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { JobsService } from './jobs.service';

@Controller('job-approvals')
export class JobApprovalsController {
  constructor(private readonly jobsService: JobsService) {}

  private buildVendorHeadRedirect(path: string) {
    const frontendUrl = process.env.FRONTEND_URL;
    const email = process.env.VENDOR_HEAD_EMAIL;

    if (!frontendUrl || !email) {
      return `${frontendUrl || ''}${path}`;
    }

    const loginUrl = new URL('/login', frontendUrl);
    loginUrl.searchParams.set('email', email);
    loginUrl.searchParams.set('redirect', path);
    return loginUrl.toString();
  }

  @Get('approve/:id')
  async approve(@Param('id') id: number, @Res() res: Response) {
    await this.jobsService.approveJob(Number(id));

    return res.redirect(
      this.buildVendorHeadRedirect(
        `/vendor-manager-head/jobs/${id}?emailAction=approved`,
      ),
    );
  }

  @Get('reject/:id')
  async reject(@Param('id') id: number, @Res() res: Response) {
    await this.jobsService.rejectJob(Number(id));

    return res.redirect(
      this.buildVendorHeadRedirect(
        `/vendor-manager-head/jobs/${id}?emailAction=rejected`,
      ),
    );
  }
}
