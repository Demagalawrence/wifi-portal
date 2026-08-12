import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { Prisma, type Plan } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';

type PaymentMethod = 'airtel' | 'mtn' | 'mpesa';

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
  payment_method?: PaymentMethod;
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

type PaymentWithPlan = Prisma.PaymentGetPayload<{ include: { plan: true } }>;
type SessionWithPlan = Prisma.SessionGetPayload<{ include: { plan: true } }>;
type SessionWithRelations = Prisma.SessionGetPayload<{
  include: { user: true; plan: true };
}>;

@Injectable()
export class AppService implements OnModuleInit {
  // Token cache mapping token -> userId for fast authentication lookups
  private readonly tokens = new Map<string, string>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedPlansIfEmpty();
    await this.seedAdminIfEmpty();
  }

  getHello(): { status: string; message: string } {
    return this.healthCheck();
  }

  healthCheck(): { status: string; message: string } {
    return {
      status: 'ok',
      message: 'WiFi Hotspot NestJS API is running',
    };
  }

  async register(body: RegisterBody): Promise<{
    message: string;
    user: unknown;
    token: string;
  }> {
    const username = body.username?.trim();
    const password = body.password ?? '';

    if (!username || !password) {
      throw new BadRequestException({
        error: 'Username and password are required',
      });
    }

    if (
      body.password_confirm !== undefined &&
      body.password_confirm !== password
    ) {
      throw new BadRequestException({ error: 'Passwords do not match' });
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUser) {
      throw new BadRequestException({ error: 'Username already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await this.prisma.user.create({
      data: {
        username,
        passwordHash,
        email: body.email,
        phone_number: body.phone_number,
      },
    });

    const token = this.issueAuthToken(user.id);

    return {
      message: 'User registered successfully',
      user: this.serializeUser(user),
      token,
    };
  }

  async login(
    body: LoginBody,
  ): Promise<{ message: string; user: unknown; token: string }> {
    const username = body.username?.trim();
    const password = body.password ?? '';

    if (!username || !password) {
      throw new BadRequestException({
        error: 'Username and password are required',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      throw new BadRequestException({ error: 'Invalid username or password' });
    }

    const token = this.issueAuthToken(user.id);

    return {
      message: 'Login successful',
      user: this.serializeUser(user),
      token,
    };
  }

  logout(authorization?: string): { message: string } {
    const token = this.extractAuthToken(authorization);
    if (token) {
      this.tokens.delete(token);
    }
    return { message: 'Logout successful' };
  }

  async userStatus(authorization?: string): Promise<{ user: unknown }> {
    const user = await this.authenticate(authorization);
    return { user: this.serializeUser(user) };
  }

  async listPlans(): Promise<{ plans: unknown[]; count: number }> {
    const plans = await this.prisma.plan.findMany({
      where: { is_active: true },
      orderBy: [{ sort_order: 'asc' }, { price: 'asc' }],
    });

    const serialized = plans.map((plan: Plan) => this.serializePlan(plan));
    return { plans: serialized, count: serialized.length };
  }

  async getPlan(planId: string): Promise<unknown> {
    const plan = await this.getActivePlan(planId);
    return this.serializePlan(plan);
  }

  async initiatePayment(
    authorization: string | undefined,
    body: InitiatePaymentBody,
  ): Promise<{
    message: string;
    payment: unknown;
    provider_response: unknown;
  }> {
    const user = await this.authenticate(authorization);
    const plan = await this.getActivePlan(body.plan_id ?? '');

    const validMethods = ['airtel', 'mtn', 'mpesa'];
    if (!body.payment_method || !validMethods.includes(body.payment_method)) {
      throw new BadRequestException({ error: 'Invalid payment method' });
    }

    if (!body.phone_number || body.phone_number.length < 10) {
      throw new BadRequestException({ error: 'Invalid phone number' });
    }

    const transaction_id = `SIM-${body.payment_method.toUpperCase()}-${randomBytes(6).toString('hex').toUpperCase()}`;

    const payment = await this.prisma.payment.create({
      data: {
        user_id: user.id,
        plan_id: plan.id,
        amount: plan.price,
        payment_method: body.payment_method,
        phone_number: body.phone_number,
        transaction_id,
        status: 'processing',
      },
    });

    return {
      message: 'Payment initiated successfully',
      payment: this.serializePayment(
        payment,
        user.username,
        plan.name,
        plan.duration_display,
      ),
      provider_response: {
        transaction_id: payment.transaction_id,
        reference: payment.id,
        status: payment.status,
        provider: body.payment_method,
        simulated: true,
      },
    };
  }

  async paymentStatus(
    authorization: string | undefined,
    paymentId: string,
  ): Promise<unknown> {
    const user = await this.authenticate(authorization);
    const payment = await this.getUserPayment(paymentId, user.id);
    const plan = await this.prisma.plan.findUnique({
      where: { id: payment.plan_id },
    });
    return this.serializePayment(
      payment,
      user.username,
      plan?.name ?? 'Plan',
      plan?.duration_display ?? '',
    );
  }

  async paymentHistory(authorization?: string): Promise<{
    payments: unknown[];
    count: number;
  }> {
    const user = await this.authenticate(authorization);
    const payments = await this.prisma.payment.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      include: { plan: true },
    });

    const serialized = payments.map((p: PaymentWithPlan) =>
      this.serializePayment(
        p,
        user.username,
        p.plan.name,
        p.plan.duration_display,
      ),
    );
    return { payments: serialized, count: serialized.length };
  }

  async simulatePayment(
    authorization: string | undefined,
    paymentId: string,
  ): Promise<{ message: string; payment: unknown }> {
    const user = await this.authenticate(authorization);
    let payment = await this.getUserPayment(paymentId, user.id);

    payment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'completed',
        transaction_id: `SIM_${randomBytes(6).toString('hex').toUpperCase()}`,
      },
    });

    const plan = await this.prisma.plan.findUnique({
      where: { id: payment.plan_id },
    });

    return {
      message: 'Payment simulated successfully',
      payment: this.serializePayment(
        payment,
        user.username,
        plan?.name ?? 'Plan',
        plan?.duration_display ?? '',
      ),
    };
  }

  async createSession(
    authorization: string | undefined,
    body: CreateSessionBody,
  ): Promise<{ message: string; session: unknown; access_token: unknown }> {
    const user = await this.authenticate(authorization);
    const payment = await this.getUserPayment(body.payment_id ?? '', user.id);

    if (payment.status !== 'completed') {
      throw new BadRequestException({ error: 'Invalid or unpaid payment' });
    }

    const existingSession = await this.prisma.session.findFirst({
      where: { payment_id: payment.id },
    });
    if (existingSession) {
      throw new BadRequestException({
        error: 'Payment already has an active session',
      });
    }

    const activeUserSession = await this.findActiveSessionForUser(user.id);
    if (activeUserSession) {
      throw new BadRequestException({
        error: 'User already has an active session',
      });
    }

    const plan = await this.getActivePlan(payment.plan_id);
    const session = await this.createWifiSession(
      user.id,
      plan,
      payment.id,
      body.mac_address,
    );
    const accessToken = await this.createAccessToken(
      user.id,
      plan,
      payment.id,
      payment.phone_number,
      session.id,
      body.mac_address,
    );

    return {
      message: 'WiFi session created successfully',
      session: this.serializeSession(
        session,
        user.username,
        plan.name,
        plan.duration_display,
      ),
      access_token: this.serializeAccessToken(
        accessToken,
        user.username,
        plan.name,
        plan.duration_display,
      ),
    };
  }

  async connectWithToken(body: ConnectWithTokenBody): Promise<{
    message: string;
    session: unknown;
    access_token: unknown;
  }> {
    const code = body.code?.trim().toUpperCase();
    if (!code) {
      throw new BadRequestException({ error: 'Access token is required' });
    }

    const accessToken = await this.prisma.accessToken.findUnique({
      where: { code },
      include: { user: true, plan: true, payment: true },
    });

    if (!accessToken) {
      throw new BadRequestException({ error: 'Invalid access token' });
    }

    if (!this.isAccessTokenUsable(accessToken)) {
      throw new BadRequestException({
        error: 'This access token is expired or revoked',
      });
    }

    const macAddress = body.mac_address || accessToken.mac_address || undefined;
    if (
      accessToken.mac_address &&
      macAddress &&
      accessToken.mac_address !== macAddress
    ) {
      throw new BadRequestException({
        error: 'This token is registered to another device',
      });
    }

    const user = accessToken.user;
    const plan = accessToken.plan;
    let session = accessToken.session_id
      ? await this.prisma.session.findUnique({
          where: { id: accessToken.session_id },
        })
      : null;

    if (!session || !(await this.isSessionActive(session))) {
      session = await this.createWifiSession(
        user.id,
        plan,
        accessToken.payment_id,
        macAddress,
      );
    } else if (macAddress && session.mac_address !== macAddress) {
      session = await this.prisma.session.update({
        where: { id: session.id },
        data: { mac_address: macAddress },
      });
    }

    const updatedToken = await this.prisma.accessToken.update({
      where: { id: accessToken.id },
      data: {
        status: 'redeemed',
        mac_address: macAddress,
        session_id: session.id,
      },
    });

    return {
      message: 'Token accepted',
      session: this.serializeSession(
        session,
        user.username,
        plan.name,
        plan.duration_display,
      ),
      access_token: this.serializeAccessToken(
        updatedToken,
        user.username,
        plan.name,
        plan.duration_display,
      ),
    };
  }

  async currentSession(authorization?: string): Promise<unknown> {
    const user = await this.authenticate(authorization);
    const session = await this.findActiveSessionForUser(user.id);
    if (!session) {
      throw new NotFoundException({ message: 'No active session found' });
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: session.plan_id },
    });

    return this.serializeSession(
      session,
      user.username,
      plan?.name ?? 'Plan',
      plan?.duration_display ?? '',
    );
  }

  async sessionHistory(authorization?: string): Promise<{
    sessions: unknown[];
    count: number;
  }> {
    const user = await this.authenticate(authorization);
    const sessions = await this.prisma.session.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      include: { plan: true },
    });

    const serialized = sessions.map((s: SessionWithPlan) =>
      this.serializeSession(
        s,
        user.username,
        s.plan.name,
        s.plan.duration_display,
      ),
    );

    return { sessions: serialized, count: serialized.length };
  }

  async terminateSession(
    authorization: string | undefined,
    sessionId: string,
  ): Promise<{ message: string; session: unknown }> {
    const user = await this.authenticate(authorization);
    let session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (
      !session ||
      session.user_id !== user.id ||
      !(await this.isSessionActive(session))
    ) {
      throw new NotFoundException({ error: 'Active session not found' });
    }

    const now = new Date();
    session = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'terminated',
        end_time: now,
        last_activity: now,
      },
    });

    const activeRemaining = await this.findActiveSessionForUser(user.id);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { is_active_session: Boolean(activeRemaining) },
    });

    const plan = await this.prisma.plan.findUnique({
      where: { id: session.plan_id },
    });

    return {
      message: 'Session terminated successfully',
      session: this.serializeSession(
        session,
        user.username,
        plan?.name ?? 'Plan',
        plan?.duration_display ?? '',
      ),
    };
  }

  /* Admin Endpoints */

  async getAdminMetrics(authorization?: string): Promise<{
    metrics: {
      total_revenue: number;
      active_sessions: number;
      total_users: number;
      total_payments: number;
      active_vouchers: number;
    };
  }> {
    await this.requireAdmin(authorization);

    const completedPayments = await this.prisma.payment.aggregate({
      where: { status: 'completed' },
      _sum: { amount: true },
      _count: { id: true },
    });

    const totalUsers = await this.prisma.user.count();
    const activeSessions = await this.prisma.session.count({
      where: { status: 'active' },
    });
    const activeVouchers = await this.prisma.accessToken.count({
      where: { status: 'active' },
    });

    return {
      metrics: {
        total_revenue: completedPayments._sum.amount ?? 0,
        active_sessions: activeSessions,
        total_users: totalUsers,
        total_payments: completedPayments._count.id ?? 0,
        active_vouchers: activeVouchers,
      },
    };
  }

  async generateVoucher(
    authorization: string | undefined,
    body: GenerateVoucherBody,
  ): Promise<{
    message: string;
    access_token: unknown;
  }> {
    const adminUser = await this.requireAdmin(authorization);
    const plan = await this.getActivePlan(body.plan_id ?? '24-hours');

    const dummyPayment = await this.prisma.payment.create({
      data: {
        user_id: adminUser.id,
        plan_id: plan.id,
        amount: plan.price,
        payment_method: 'voucher_admin',
        phone_number: body.phone_number || '0000000000',
        status: 'completed',
        transaction_id: `VOUCHER-${randomBytes(4).toString('hex').toUpperCase()}`,
      },
    });

    const accessToken = await this.createAccessToken(
      adminUser.id,
      plan,
      dummyPayment.id,
      body.phone_number || '0000000000',
    );

    return {
      message: 'Voucher code generated successfully',
      access_token: this.serializeAccessToken(
        accessToken,
        adminUser.username,
        plan.name,
        plan.duration_display,
      ),
    };
  }

  async getAllSessions(authorization?: string): Promise<{
    sessions: unknown[];
    count: number;
  }> {
    await this.requireAdmin(authorization);

    const sessions = await this.prisma.session.findMany({
      orderBy: { created_at: 'desc' },
      include: { user: true, plan: true },
    });

    const serialized = sessions.map((s: SessionWithRelations) =>
      this.serializeSession(
        s,
        s.user.username,
        s.plan.name,
        s.plan.duration_display,
      ),
    );

    return { sessions: serialized, count: serialized.length };
  }

  /* Private Helper Methods */

  private async seedAdminIfEmpty() {
    await this.prisma.user.upsert({
      where: { username: 'admin' },
      update: { role: 'admin' },
      create: {
        username: 'admin',
        passwordHash: bcrypt.hashSync('admin123', 10),
        role: 'admin',
      },
    });
  }

  private async seedPlansIfEmpty() {
    const count = await this.prisma.plan.count();
    if (count === 0) {
      const plans = [
        {
          id: '2-hours',
          name: '2 hours',
          price: 500,
          duration_hours: 2,
          duration_display: '2 hours',
          sort_order: 1,
        },
        {
          id: '12-hours',
          name: '12 hours',
          price: 1000,
          duration_hours: 12,
          duration_display: '12 hours',
          sort_order: 2,
        },
        {
          id: '24-hours',
          name: '24 hours',
          price: 1500,
          duration_hours: 24,
          duration_display: '24 hours',
          sort_order: 3,
        },
        {
          id: '3-days',
          name: '3 days',
          price: 3000,
          duration_hours: 72,
          duration_display: '3 days',
          sort_order: 4,
        },
        {
          id: '1-week',
          name: '1 week',
          price: 5000,
          duration_hours: 168,
          duration_display: '1 week',
          sort_order: 5,
        },
        {
          id: '1-month',
          name: '1 month',
          price: 20000,
          duration_hours: 720,
          duration_display: '1 month',
          sort_order: 6,
        },
      ];

      for (const p of plans) {
        await this.prisma.plan.create({
          data: {
            ...p,
            description: `High speed unlimited WiFi access for ${p.duration_display}`,
            features: JSON.stringify([
              { feature_name: 'High Speed WiFi', is_included: true },
              { feature_name: 'Unlimited Bandwidth', is_included: true },
              { feature_name: '24/7 Support', is_included: true },
            ]),
          },
        });
      }
    }
  }

  private async authenticate(authorization?: string) {
    const token = this.extractAuthToken(authorization);
    const userId = token ? this.tokens.get(token) : undefined;

    if (!userId) {
      throw new UnauthorizedException({
        detail: 'Authentication credentials were not provided.',
      });
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException({ detail: 'Invalid token.' });
    }

    return user;
  }

  private async requireAdmin(authorization?: string) {
    const user = await this.authenticate(authorization);
    if (user.role !== 'admin') {
      throw new UnauthorizedException({ detail: 'Admin privileges required.' });
    }
    return user;
  }

  private extractAuthToken(authorization?: string): string | undefined {
    if (!authorization) return undefined;
    const [scheme, value] = authorization.split(' ');
    if (!value) return scheme;
    if (scheme.toLowerCase() === 'token' || scheme.toLowerCase() === 'bearer')
      return value;
    return undefined;
  }

  private issueAuthToken(userId: string): string {
    const token = randomBytes(20).toString('hex');
    this.tokens.set(token, userId);
    return token;
  }

  private async getActivePlan(planId: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { id: planId, is_active: true },
    });
    if (!plan) {
      throw new NotFoundException({ error: 'Plan not found' });
    }
    return plan;
  }

  private async getUserPayment(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment || payment.user_id !== userId) {
      throw new NotFoundException({ error: 'Payment not found' });
    }
    return payment;
  }

  private async findActiveSessionForUser(userId: string) {
    const session = await this.prisma.session.findFirst({
      where: { user_id: userId, status: 'active' },
    });
    if (!session) return null;
    if (await this.isSessionActive(session)) {
      return session;
    }
    return null;
  }

  private async createWifiSession(
    userId: string,
    plan: { id: string; duration_hours: number },
    paymentId: string,
    macAddress?: string,
  ) {
    const now = new Date();
    const endTime = new Date(
      now.getTime() + plan.duration_hours * 60 * 60 * 1000,
    );

    const session = await this.prisma.session.create({
      data: {
        user_id: userId,
        plan_id: plan.id,
        payment_id: paymentId,
        mac_address: macAddress,
        status: 'active',
        start_time: now,
        end_time: endTime,
        data_used: 0,
        last_activity: now,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { is_active_session: true },
    });

    return session;
  }

  private async createAccessToken(
    userId: string,
    plan: { id: string; duration_hours: number },
    paymentId: string,
    phoneNumber: string,
    sessionId?: string,
    macAddress?: string,
  ) {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + plan.duration_hours * 60 * 60 * 1000,
    );

    return this.prisma.accessToken.create({
      data: {
        code: this.generateAccessCode(),
        user_id: userId,
        plan_id: plan.id,
        payment_id: paymentId,
        session_id: sessionId,
        phone_number: phoneNumber,
        mac_address: macAddress,
        status: 'active',
        expires_at: expiresAt,
      },
    });
  }

  private generateAccessCode(): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = (): string =>
      Array.from(
        { length: 5 },
        () => alphabet[randomBytes(1)[0] % alphabet.length],
      ).join('');

    return `WIFI-${segment()}-${segment()}`;
  }

  private async isSessionActive(session: {
    id: string;
    status: string;
    end_time: Date;
    user_id: string;
  }): Promise<boolean> {
    if (session.status !== 'active') return false;

    if (new Date(session.end_time).getTime() <= Date.now()) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { status: 'expired' },
      });
      await this.prisma.user.update({
        where: { id: session.user_id },
        data: { is_active_session: false },
      });
      return false;
    }

    return true;
  }

  private isAccessTokenUsable(token: {
    status: string;
    expires_at: Date;
  }): boolean {
    if (!['active', 'redeemed'].includes(token.status)) return false;
    if (new Date(token.expires_at).getTime() <= Date.now()) {
      return false;
    }
    return true;
  }

  private serializeUser(user: {
    id: string;
    username: string;
    role: string;
    email?: string | null;
    phone_number?: string | null;
    is_active_session: boolean;
  }): unknown {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email ?? undefined,
      phone_number: user.phone_number ?? undefined,
      is_active_session: user.is_active_session,
      is_authenticated: true,
    };
  }

  private serializePlan(plan: {
    id: string;
    name: string;
    description: string;
    price: number;
    duration_hours: number;
    duration_display: string;
    features: string;
    is_active: boolean;
    sort_order: number;
  }): unknown {
    let parsedFeatures: unknown = [];
    try {
      parsedFeatures = JSON.parse(plan.features) as unknown;
    } catch {
      parsedFeatures = [];
    }

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      duration_hours: plan.duration_hours,
      duration_display: plan.duration_display,
      features: Array.isArray(parsedFeatures) ? parsedFeatures : [],
      is_active: plan.is_active,
      sort_order: plan.sort_order,
    };
  }

  private serializePayment(
    payment: {
      id: string;
      user_id: string;
      plan_id: string;
      amount: number;
      payment_method: string;
      phone_number: string;
      transaction_id?: string | null;
      status: string;
      failure_reason?: string | null;
      created_at: Date;
      updated_at: Date;
    },
    username: string,
    planName: string,
    planDuration: string,
  ): unknown {
    return {
      id: payment.id,
      user: payment.user_id,
      user_username: username,
      plan: payment.plan_id,
      plan_name: planName,
      plan_duration: planDuration,
      amount: payment.amount,
      payment_method: payment.payment_method,
      phone_number: payment.phone_number,
      transaction_id: payment.transaction_id ?? undefined,
      status: payment.status,
      failure_reason: payment.failure_reason ?? undefined,
      created_at: payment.created_at.toISOString(),
      updated_at: payment.updated_at.toISOString(),
    };
  }

  private serializeSession(
    session: {
      id: string;
      user_id: string;
      plan_id: string;
      payment_id: string;
      mac_address?: string | null;
      ip_address?: string | null;
      status: string;
      start_time: Date;
      end_time: Date;
      data_used: number;
      last_activity: Date;
      created_at: Date;
      updated_at: Date;
    },
    username: string,
    planName: string,
    planDuration: string,
  ): unknown {
    const isActive =
      session.status === 'active' &&
      new Date(session.end_time).getTime() > Date.now();
    return {
      id: session.id,
      user: session.user_id,
      user_username: username,
      plan: session.plan_id,
      plan_name: planName,
      plan_duration: planDuration,
      payment: session.payment_id,
      mac_address: session.mac_address ?? undefined,
      ip_address: session.ip_address ?? undefined,
      status: session.status,
      start_time: session.start_time.toISOString(),
      end_time: session.end_time.toISOString(),
      data_used: session.data_used,
      last_activity: session.last_activity.toISOString(),
      is_active: isActive,
      time_remaining: this.formatDuration(
        Math.max(0, new Date(session.end_time).getTime() - Date.now()),
      ),
      duration_used: this.formatDuration(
        Math.max(0, Date.now() - new Date(session.start_time).getTime()),
      ),
      created_at: session.created_at.toISOString(),
      updated_at: session.updated_at.toISOString(),
    };
  }

  private serializeAccessToken(
    accessToken: {
      id: string;
      code: string;
      user_id: string;
      plan_id: string;
      payment_id: string;
      session_id?: string | null;
      phone_number: string;
      mac_address?: string | null;
      status: string;
      expires_at: Date;
      regenerated_from?: string | null;
      created_at: Date;
      updated_at: Date;
    },
    username: string,
    planName: string,
    planDuration: string,
  ): unknown {
    return {
      id: accessToken.id,
      code: accessToken.code,
      user: accessToken.user_id,
      user_username: username,
      plan: accessToken.plan_id,
      plan_name: planName,
      plan_duration: planDuration,
      payment: accessToken.payment_id,
      session: accessToken.session_id ?? undefined,
      phone_number: accessToken.phone_number,
      mac_address: accessToken.mac_address ?? undefined,
      status: accessToken.status,
      expires_at: accessToken.expires_at.toISOString(),
      regenerated_from: accessToken.regenerated_from ?? undefined,
      created_at: accessToken.created_at.toISOString(),
      updated_at: accessToken.updated_at.toISOString(),
    };
  }

  private formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map((value) => value.toString().padStart(2, '0'))
      .join(':');
  }
}
