import { fetchEntity } from './internalAPI.js';
import { FunctionCache } from '../utils/cache/FunctionCache.js';

/**
 * Temporary cache for fetched entities from the ws/js API.
 */
export const entityCache = new FunctionCache(fetchEntity, {
	keyMapper: (gid) => [gid],
});
