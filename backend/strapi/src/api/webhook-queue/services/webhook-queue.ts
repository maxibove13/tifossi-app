/**
 * webhook-queue service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::webhook-queue.webhook-queue' as any);
