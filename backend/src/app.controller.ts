import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service';

interface RegisterBody {
  username?: string;
  password?: string;
  password_confirm?: string;
  phone_number?: string;
  email?: string;
}

interface LoginBody {
  username?: string;
  password?: string;
}

interface InitiatePaymentBody {
  plan_id?: string;
  payment_method?: 'airtel' | 'mtn' | 'mpesa';
  phone_number?: string;
}

interface CreateSessionBody {
  payment_id?: string;
  mac_address?: string;
}

interface ConnectWithTokenBody {
  code?: string;
  mac_address?: string;
}

interface GenerateVoucherBody {
  plan_id?: string;
  phone_number?: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): { status: string; message: string } {
    return this.appService.getHello();
  }

  @Get('api/health')
  healthCheck(): { status: string; message: string } {
    return this.appService.healthCheck();
  }

  @Post('api/accounts/register')
  register(@Body() body: RegisterBody): Promise<unknown> {
    return this.appService.register(body);
  }

  @Post('api/accounts/login')
  @HttpCode(200)
  login(@Body() body: LoginBody): Promise<unknown> {
    return this.appService.login(body);
  }

  @Post('api/accounts/logout')
  @HttpCode(200)
  logout(@Headers('authorization') authorization?: string): unknown {
    return this.appService.logout(authorization);
  }

  @Get('api/accounts/status')
  userStatus(
    @Headers('authorization') authorization?: string,
  ): Promise<unknown> {
    return this.appService.userStatus(authorization);
  }

  @Get('api/plans')
  listPlans(): Promise<unknown> {
    return this.appService.listPlans();
  }

  @Get('api/plans/:planId')
  getPlan(@Param('planId') planId: string): Promise<unknown> {
    return this.appService.getPlan(planId);
  }

  @Post('api/payments/initiate')
  @HttpCode(200)
  initiatePayment(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: InitiatePaymentBody,
  ): Promise<unknown> {
    return this.appService.initiatePayment(authorization, body);
  }

  @Get('api/payments/history')
  paymentHistory(
    @Headers('authorization') authorization?: string,
  ): Promise<unknown> {
    return this.appService.paymentHistory(authorization);
  }

  @Get('api/payments/:paymentId/status')
  paymentStatus(
    @Headers('authorization') authorization: string | undefined,
    @Param('paymentId') paymentId: string,
  ): Promise<unknown> {
    return this.appService.paymentStatus(authorization, paymentId);
  }

  @Post('api/payments/:paymentId/simulate')
  @HttpCode(200)
  simulatePayment(
    @Headers('authorization') authorization: string | undefined,
    @Param('paymentId') paymentId: string,
  ): Promise<unknown> {
    return this.appService.simulatePayment(authorization, paymentId);
  }

  @Post('api/sessions/create')
  createSession(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: CreateSessionBody,
  ): Promise<unknown> {
    return this.appService.createSession(authorization, body);
  }

  @Post('api/sessions/token/connect')
  @HttpCode(200)
  connectWithToken(@Body() body: ConnectWithTokenBody): Promise<unknown> {
    return this.appService.connectWithToken(body);
  }

  @Get('api/sessions/current')
  currentSession(
    @Headers('authorization') authorization?: string,
  ): Promise<unknown> {
    return this.appService.currentSession(authorization);
  }

  @Get('api/sessions/history')
  sessionHistory(
    @Headers('authorization') authorization?: string,
  ): Promise<unknown> {
    return this.appService.sessionHistory(authorization);
  }

  @Post('api/sessions/:sessionId/terminate')
  @HttpCode(200)
  terminateSession(
    @Headers('authorization') authorization: string | undefined,
    @Param('sessionId') sessionId: string,
  ): Promise<unknown> {
    return this.appService.terminateSession(authorization, sessionId);
  }

  /* Admin Dashboard Endpoints */

  @Get('api/admin/metrics')
  getAdminMetrics(
    @Headers('authorization') authorization?: string,
  ): Promise<unknown> {
    return this.appService.getAdminMetrics(authorization);
  }

  @Post('api/admin/vouchers/generate')
  generateVoucher(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: GenerateVoucherBody,
  ): Promise<unknown> {
    return this.appService.generateVoucher(authorization, body);
  }

  @Get('api/admin/sessions')
  getAllSessions(
    @Headers('authorization') authorization?: string,
  ): Promise<unknown> {
    return this.appService.getAllSessions(authorization);
  }
}
