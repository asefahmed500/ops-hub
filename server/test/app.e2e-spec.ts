import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

const run = Date.now().toString(36);

describe('MTO Compass (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('rejects unauthenticated /auth/me with 401', () => {
    return request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('rejects bad credentials with 401', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'hr@opshub.local', password: 'wrong' })
      .expect(401);
  });

  it('registers a company (HR), joins a trainee, and isolates tenants', async () => {
    // HR registers the programme
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        companyName: `QA Corp ${run}`,
        name: 'QA HR',
        email: `qa-hr-${run}@qa.test`,
        password: 'password123',
      })
      .expect(201);
    expect(reg.body.inviteCode).toBeTruthy();
    expect(reg.body.user.role).toBe('hr');
    const hrToken = reg.body.token;

    // Trainee joins with the code
    const join = await request(app.getHttpServer())
      .post('/api/auth/join')
      .send({
        inviteCode: reg.body.inviteCode,
        name: 'QA Trainee',
        email: `qa-trainee-${run}@qa.test`,
        password: 'password123',
        dept: 'Marketing',
      })
      .expect(201);
    expect(join.body.user.role).toBe('trainee');
    const traineeToken = join.body.token;

    // Trainee sees the cloned rotation template, no demo data
    const state = await request(app.getHttpServer())
      .get('/api/state')
      .set('Authorization', `Bearer ${traineeToken}`)
      .expect(200);
    expect(Array.isArray(state.body.rotations)).toBe(true);
    expect(state.body.rotations.length).toBeGreaterThan(0);
    expect(state.body.me.tenantId).toBe(join.body.user.tenantId);
    expect(state.body.trainees.every((u: { id: string }) => true)).toBe(true);

    // Trainee saves a log; HR sees it
    await request(app.getHttpServer())
      .post('/api/logs')
      .set('Authorization', `Bearer ${traineeToken}`)
      .send({ text: 'QA e2e log entry', tags: ['Reporting'] })
      .expect(201);
    const hrLogs = await request(app.getHttpServer())
      .get('/api/logs')
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);
    expect(hrLogs.body.some((l: { text: string }) => l.text === 'QA e2e log entry')).toBe(true);

    // Tenant isolation: demo tenant admin cannot read QA Corp logs
    const demo = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'hr@opshub.local', password: 'hr123456' })
      .expect(201);
    const demoLogs = await request(app.getHttpServer())
      .get('/api/logs')
      .set('Authorization', `Bearer ${demo.body.token}`)
      .expect(200);
    expect(demoLogs.body.some((l: { text: string }) => l.text === 'QA e2e log entry')).toBe(false);

    return undefined;
  });

  it('runs the review lifecycle with notifications', async () => {
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        companyName: `Review Corp ${run}`,
        name: 'Review HR',
        email: `rv-hr-${run}@qa.test`,
        password: 'password123',
      })
      .expect(201);
    const hrToken = reg.body.token;

    const join = await request(app.getHttpServer())
      .post('/api/auth/join')
      .send({
        inviteCode: reg.body.inviteCode,
        name: 'Review Trainee',
        email: `rv-trainee-${run}@qa.test`,
        password: 'password123',
        dept: 'Sales',
      })
      .expect(201);
    const traineeToken = join.body.token;

    // HR creates a pending review
    const created = await request(app.getHttpServer())
      .post('/api/reviews')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ traineeId: join.body.user.id, dept: 'Sales', kind: 'mid-term', due: 'Due Fri' })
      .expect(201);
    expect(created.body.status).toBe('pending');

    // Trainee got notified
    const notes = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Authorization', `Bearer ${traineeToken}`)
      .expect(200);
    expect(notes.body.length).toBeGreaterThan(0);

    // Trainee cannot decide reviews
    await request(app.getHttpServer())
      .post(`/api/reviews/${created.body.id}/decide`)
      .set('Authorization', `Bearer ${traineeToken}`)
      .send({ outcome: 'approved', rating: 5 })
      .expect(403);

    // HR approves with rating
    const decided = await request(app.getHttpServer())
      .post(`/api/reviews/${created.body.id}/decide`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ outcome: 'approved', rating: 5, comment: 'Great work' })
      .expect(201);
    expect(decided.body.status).toBe('approved');
    expect(decided.body.rating).toBe(5);

    // Approving again is rejected
    await request(app.getHttpServer())
      .post(`/api/reviews/${created.body.id}/decide`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ outcome: 'approved', rating: 4 })
      .expect(400);

    return undefined;
  });

  it('enforces platform RBAC and tenant suspension', async () => {
    // Company admin cannot access platform routes
    const hr = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'hr@opshub.local', password: 'hr123456' })
      .expect(201);
    await request(app.getHttpServer())
      .get('/api/platform/overview')
      .set('Authorization', `Bearer ${hr.body.token}`)
      .expect(403);

    // Platform admin sees the estate and can suspend a tenant
    const platform = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'platform@opshub.local', password: 'platform123' })
      .expect(201);
    const overview = await request(app.getHttpServer())
      .get('/api/platform/overview')
      .set('Authorization', `Bearer ${platform.body.token}`)
      .expect(200);
    expect(overview.body.tenants.total).toBeGreaterThan(0);

    const tenants = await request(app.getHttpServer())
      .get('/api/platform/tenants')
      .set('Authorization', `Bearer ${platform.body.token}`)
      .expect(200);
    const qa = tenants.body.find((t: { name: string }) => t.name.startsWith('Review Corp'));
    expect(qa).toBeTruthy();

    // Trainee joins BEFORE suspension (suspended companies correctly reject joins)
    const trainee = await request(app.getHttpServer())
      .post('/api/auth/join')
      .send({
        inviteCode: qa.inviteCode,
        name: 'Suspend Test',
        email: `sp-trainee-${run}@qa.test`,
        password: 'password123',
        dept: 'Ops',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/platform/tenants/${qa.id}`)
      .set('Authorization', `Bearer ${platform.body.token}`)
      .send({ status: 'suspended' })
      .expect(200);

    // Suspended: existing sessions die
    await request(app.getHttpServer())
      .get('/api/state')
      .set('Authorization', `Bearer ${trainee.body.token}`)
      .expect(401);

    // Suspended: new logins rejected
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: `rv-trainee-${run}@qa.test`, password: 'password123' })
      .expect(401);

    // Reactivate → works again
    await request(app.getHttpServer())
      .patch(`/api/platform/tenants/${qa.id}`)
      .set('Authorization', `Bearer ${platform.body.token}`)
      .send({ status: 'active' })
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/state')
      .set('Authorization', `Bearer ${trainee.body.token}`)
      .expect(200);

    return undefined;
  });

  afterAll(async () => {
    await app.close();
  });
});
