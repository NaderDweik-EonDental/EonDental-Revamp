import { describe, expect, it, vi } from 'vitest';
import { submitCase, type CaseApi } from './submitCase.js';
import type { CaseConfig, CaseDraft } from '../domain/caseRules.js';

const config: CaseConfig = {
  requireXray: true,
  maxAttachments: 3,
};

const validDraft: CaseDraft = {
  patientId: 'pat_001',
  notes: 'Upper arch crowding',
  attachments: [
    { type: 'photo', fileName: 'smile.jpg' },
    { type: 'xray', fileName: 'panoramic.dcm' },
  ],
};

function fakeApi(overrides: Partial<CaseApi> = {}): CaseApi {
  return {
    submit: vi.fn(async (draft) => ({
      caseId: 'case_abc',
      patientId: draft.patientId,
      submittedAt: '2026-08-04T12:00:00.000Z',
    })),
    ...overrides,
  };
}

describe('submitCase', () => {
  it('rejects an invalid draft without calling the API', async () => {
    const api = fakeApi();
    const result = await submitCase(
      { ...validDraft, patientId: '  ' },
      config,
      api,
    );

    expect(result).toEqual({
      ok: false,
      errors: ['patientId is required'],
    });
    expect(api.submit).not.toHaveBeenCalled();
  });

  it('rejects when a required xray is missing', async () => {
    const api = fakeApi();
    const result = await submitCase(
      {
        ...validDraft,
        attachments: [{ type: 'photo', fileName: 'smile.jpg' }],
      },
      config,
      api,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain('missing required attachment type: xray');
    }
    expect(api.submit).not.toHaveBeenCalled();
  });

  it('rejects when attachments exceed the configured max', async () => {
    const api = fakeApi();
    const result = await submitCase(
      {
        ...validDraft,
        attachments: [
          { type: 'photo', fileName: 'a.jpg' },
          { type: 'xray', fileName: 'b.dcm' },
          { type: 'scan', fileName: 'c.stl' },
          { type: 'photo', fileName: 'd.jpg' },
        ],
      },
      config,
      api,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/at most 3 attachment/);
    }
    expect(api.submit).not.toHaveBeenCalled();
  });

  it('submits a valid draft through the API', async () => {
    const api = fakeApi();
    const result = await submitCase(validDraft, config, api);

    expect(api.submit).toHaveBeenCalledOnce();
    expect(api.submit).toHaveBeenCalledWith(validDraft);
    expect(result).toEqual({
      ok: true,
      case: {
        caseId: 'case_abc',
        patientId: 'pat_001',
        submittedAt: '2026-08-04T12:00:00.000Z',
      },
    });
  });
});
