import { http, HttpResponse } from 'msw';
import type { FeatureId } from '@eon/core-entitlements';
import {
  store,
  type ClientEntitlementRecord,
  type ClientRecord,
  type FeatureAssignment,
  type FeatureCatalogEntry,
} from './store.js';

export const configApiHandlers = [
  http.get('/api/feature-catalog', () => {
    return HttpResponse.json(store.featureCatalog);
  }),

  http.put('/api/feature-catalog', async ({ request }) => {
    const body = (await request.json()) as FeatureCatalogEntry[];
    store.featureCatalog = body;
    return HttpResponse.json(store.featureCatalog);
  }),

  http.get('/api/clients', () => {
    return HttpResponse.json(store.clients);
  }),

  http.get('/api/clients/:clientId', ({ params }) => {
    const client = store.clients.find((c) => c.clientId === params.clientId);
    if (!client) {
      return HttpResponse.json({ message: 'Client not found' }, { status: 404 });
    }
    return HttpResponse.json(client);
  }),

  http.post('/api/clients', async ({ request }) => {
    const body = (await request.json()) as ClientRecord;
    if (store.clients.some((c) => c.clientId === body.clientId)) {
      return HttpResponse.json(
        { message: 'Client already exists' },
        { status: 409 },
      );
    }
    store.clients.push(body);
    return HttpResponse.json(body, { status: 201 });
  }),

  http.put('/api/clients/:clientId/entitlements', async ({ params, request }) => {
    const client = store.clients.find((c) => c.clientId === params.clientId);
    if (!client) {
      return HttpResponse.json({ message: 'Client not found' }, { status: 404 });
    }
    const entitlements = (await request.json()) as ClientEntitlementRecord[];
    client.entitlements = entitlements;
    return HttpResponse.json(client);
  }),

  http.get('/api/doctors', ({ request }) => {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    const doctors =
      clientId === null
        ? store.doctors
        : store.doctors.filter((d) => d.clientId === clientId);
    return HttpResponse.json(doctors);
  }),

  http.get('/api/doctors/:userId', ({ params }) => {
    const doctor = store.doctors.find((d) => d.userId === params.userId);
    if (!doctor) {
      return HttpResponse.json({ message: 'Doctor not found' }, { status: 404 });
    }
    return HttpResponse.json(doctor);
  }),

  http.put('/api/doctors/:userId/assignments', async ({ params, request }) => {
    const doctor = store.doctors.find((d) => d.userId === params.userId);
    if (!doctor) {
      return HttpResponse.json({ message: 'Doctor not found' }, { status: 404 });
    }
    const assignments = (await request.json()) as FeatureAssignment[];
    doctor.assignments = assignments;
    return HttpResponse.json(doctor);
  }),

  http.get('/api/features/:featureId/config', ({ params }) => {
    const config = store.featureConfigs[String(params.featureId)];
    if (!config) {
      return HttpResponse.json(
        { message: 'Feature config not found' },
        { status: 404 },
      );
    }
    return HttpResponse.json(config);
  }),
];

export type { FeatureId };
