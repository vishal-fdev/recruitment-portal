import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { SlotAttendanceStatus } from './partner-slot.entity';
import { PartnerSlotsService } from './partner-slots.service';

@Controller('partner-slots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PartnerSlotsController {
  constructor(private readonly service: PartnerSlotsService) {}

  @Get()
  @Roles(
    UserRole.HIRING_MANAGER,
    UserRole.VENDOR,
    UserRole.VENDOR_MANAGER,
    UserRole.VENDOR_MANAGER_HEAD,
  )
  list(@Req() req: any) {
    return this.service.getSlotsForUser(req.user);
  }

  @Get('eligible-candidates')
  @Roles(UserRole.HIRING_MANAGER)
  eligibleCandidates(@Req() req: any) {
    return this.service.getEligibleCandidates(req.user);
  }

  @Post()
  @Roles(UserRole.HIRING_MANAGER)
  create(
    @Req() req: any,
    @Body()
    body: {
      candidateId: number;
      interviewDate: string;
      interviewTime: string;
      hmComment?: string;
    },
  ) {
    return this.service.createSlot(req.user, body);
  }

  @Patch(':id/respond')
  @Roles(UserRole.VENDOR)
  respond(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body()
    body: {
      action: 'ACCEPT' | 'REJECT';
      justification?: string;
    },
  ) {
    return this.service.respondToSlot(id, req.user, body);
  }

  @Patch(':id/attendance')
  @Roles(UserRole.VENDOR)
  attendance(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body()
    body: {
      attendanceStatus:
        | SlotAttendanceStatus.ATTENDED
        | SlotAttendanceStatus.NO_SHOW
        | SlotAttendanceStatus.RESCHEDULE_REQUESTED_BY_CANDIDATE
        | SlotAttendanceStatus.RESCHEDULE_REQUESTED_BY_PANEL
        | SlotAttendanceStatus.DROPPED;
      comment?: string;
    },
  ) {
    return this.service.submitAttendance(id, req.user, body);
  }
}
