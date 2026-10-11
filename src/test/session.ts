import { session } from '@/shared/api';

/** The session store, for tests of layers that may not import `shared/api` themselves. */
export const testSession = session;
