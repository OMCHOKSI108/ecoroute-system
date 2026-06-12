import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/config/db');
jest.mock('../src/repositories/audit.repository');

import * as auditRepo from '../src/repositories/audit.repository';
import { createApp } from '../src/app';

const mockFindAuditLogs = auditRepo.findAuditLogs as jest.Mock;

const app = createApp();

function makeToken(role: 'admin' | 'dispatcher' | 'driver' = 'admin') {
  return jwt.sign(
    { sub: 'user-uuid', orgId: 'org-uuid', role, email: 'test@test.com' },
    process.env['JWT_SECRET']!,
    { expiresIn: '1h' },
  );
}

const mockLogRow: auditRepo.AuditLogRow = {
  id: 'log-uuid',
  organization_id: 'org-uuid',
  actor_id: 'user-uuid',
  actor_role: 'admin',
  action: 'dispatch_assignment',
  entity_type: 'vehicle',
  entity_id: 'veh-uuid',
  metadata: { pickupIds: ['p1'] },
  created_at: new Date('2026-01-01'),
};

beforeEach(() => jest.resetAllMocks());

// ─── GET /audit-logs ───────────────────────────────────────────────────────

describe('GET /api/v1/audit-logs', () => {
  it('returns 200 with paginated audit logs for admin', async () => {
    mockFindAuditLogs.mockResolvedValue({ data: [mockLogRow], total: 1 });

    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${makeToken('admin')}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].action).toBe('dispatch_assignment');
    expect(res.body.data[0].entityType).toBe('vehicle');
    expect(res.body.total).toBe(1);
  });

  it('returns 403 for dispatcher role', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${makeToken('dispatcher')}`);
    expect(res.status).toBe(403);
  });

  it('returns 403 for driver role', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${makeToken('driver')}`);
    expect(res.status).toBe(403);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/v1/audit-logs');
    expect(res.status).toBe(401);
  });

  it('passes action filter to repository', async () => {
    mockFindAuditLogs.mockResolvedValue({ data: [], total: 0 });
    await request(app)
      .get('/api/v1/audit-logs?action=dispatch_assignment')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(mockFindAuditLogs).toHaveBeenCalledWith(
      'org-uuid',
      expect.objectContaining({ action: 'dispatch_assignment' }),
    );
  });

  it('passes entityType filter to repository', async () => {
    mockFindAuditLogs.mockResolvedValue({ data: [], total: 0 });
    await request(app)
      .get('/api/v1/audit-logs?entityType=vehicle')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(mockFindAuditLogs).toHaveBeenCalledWith(
      'org-uuid',
      expect.objectContaining({ entityType: 'vehicle' }),
    );
  });

  it('returns 400 for invalid limit value', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs?limit=999')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(400);
  });
});
