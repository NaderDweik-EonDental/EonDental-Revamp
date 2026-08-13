import { setupWorker } from 'msw/browser';
import { configApiHandlers } from '@eon/mocks-config-api';

export const worker = setupWorker(...configApiHandlers);
