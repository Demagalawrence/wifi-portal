import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface PlansResponse {
  plans: Array<{ id: string }>;
}

interface RegisterResponse {
  token: string;
}

interface PaymentResponse {
  payment: { id: string };
}

interface SessionResponse {
  session: { status: string };
  access_token: { code: string };
}

describe('WiFi Portal API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves the health check', () => {
    return request(app.getHttpServer()).get('/api/health/').expect(200).expect({
      status: 'ok',
      message: 'WiFi Hotspot NestJS API is running',
    });
  });

  it('supports the pay, simulate, session, and token-connect flow', async () => {
    const plansResponse = await request(app.getHttpServer())
      .get('/api/plans/')
      .expect(200);
    const plansBody = plansResponse.body as PlansResponse;
    const planId = plansBody.plans[0].id;

    const registerResponse = await request(app.getHttpServer())
      .post('/api/accounts/register/')
      .send({
        username: 'portal_788123456',
        password: 'portal-788123456',
        password_confirm: 'portal-788123456',
        phone_number: '+250788123456',
      })
      .expect(201);
    const registerBody = registerResponse.body as RegisterResponse;

    const authHeader = `Token ${registerBody.token}`;

    const paymentResponse = await request(app.getHttpServer())
      .post('/api/payments/initiate/')
      .set('Authorization', authHeader)
      .send({
        plan_id: planId,
        payment_method: 'airtel',
        phone_number: '+250788123456',
      })
      .expect(200);
    const paymentBody = paymentResponse.body as PaymentResponse;
    const paymentId = paymentBody.payment.id;

    await request(app.getHttpServer())
      .post(`/api/payments/${paymentId}/simulate/`)
      .set('Authorization', authHeader)
      .expect(200);

    const sessionResponse = await request(app.getHttpServer())
      .post('/api/sessions/create/')
      .set('Authorization', authHeader)
      .send({ payment_id: paymentId, mac_address: 'AA:BB:CC:DD:EE:FF' })
      .expect(201);
    const sessionBody = sessionResponse.body as SessionResponse;

    expect(sessionBody.session.status).toBe('active');
    expect(sessionBody.access_token.code).toMatch(
      /^WIFI-[A-Z0-9]{5}-[A-Z0-9]{5}$/,
    );

    await request(app.getHttpServer())
      .post('/api/sessions/token/connect/')
      .send({
        code: sessionBody.access_token.code,
        mac_address: 'AA:BB:CC:DD:EE:FF',
      })
      .expect(200);
  });
});
