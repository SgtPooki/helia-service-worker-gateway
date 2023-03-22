/* eslint-disable import/no-unused-modules */
import { Strategy, StrategyHandler } from 'workbox-strategies';
import Dexie from 'dexie';

/**
 * A simple cache versioning strategy. If changes are made to the cache strategy, this version number should be incremented
 * in order to prevent issues like the one found in https://github.com/pln-planning-tools/Starmap/issues/345 when we switched from using
 * POST to GET requests.
 */
const CACHE_VERSION = 'v1'

// Based on Java's hashCode implementation: https://stackoverflow.com/a/7616484/104380
const generateHashCode = str => [...str].reduce((hash, chr) => 0 | (31 * hash + chr.charCodeAt(0)), 0)

const contentHashDB: {hashes?: Dexie.Table} & Dexie = new Dexie('contentHashDB')
contentHashDB.version(1).stores({
  hashes: `cacheKey, hashCode`
});

/**
 * This is a custom strategy to cache the milestone children of a Starmap.
 * The benefit of writing this as a workbox strategy is we can use other workbox plugins like expiration.
 */
export class CacheChildren extends Strategy implements Strategy {
  fetchOptions?: RequestInit  = {
    method: 'GET',
    headers: {
      'cache-control': 's-maxage=30, stale-while-revalidate=86400'
    }
  }
  async populateCacheAsync(cacheKey: string, request: Request, handler: StrategyHandler): Promise<void> {
    const response = await handler.fetch(request.clone())
    if (!response.ok) {
      return
    }
    const hashCodeStoredValue = await contentHashDB.hashes?.get({ cacheKey })
    const previousResponseHash = hashCodeStoredValue?.hashCode ?? ''
    const currentResponseHash = generateHashCode(JSON.stringify(await response.clone().json()))

    if (previousResponseHash !== currentResponseHash) {
      await contentHashDB.hashes?.put({ cacheKey, hashCode: currentResponseHash })
      await handler.cachePut(cacheKey, response.clone())
    }
  }

  async _handle(request: Request, handler: StrategyHandler): Promise<Response | undefined> {
    try {
      const url = new URL(request.url)
      // const queryParams = new URLSearchParams(url.search)

      // We are using the owner, repo and issue number as the cache key.
      // We are also using the parent node_id as part of the cache key.
      // This is because the children can have multiple parents.
      // That will cause cache collisions.
      const cacheKey = `${CACHE_VERSION}-${request.url}-${url.search}`
      // Checking if the cache already has the response.
      let cachedResponse = await handler.cacheMatch(cacheKey)
      // WARNING: We're not awaiting this call deliberately. We want to populate the cache in the background.
      // Essentially, poor-man's version of stale-while-revalidate.
      // handler will wait till this promise resolves. This can be monitored using the `doneWaiting` method.
      handler.waitUntil(this.populateCacheAsync(cacheKey, request, handler))
      if (!cachedResponse) {
        await handler.doneWaiting()
        cachedResponse = await handler.cacheMatch(cacheKey)
      } else {
        // console.log(`SW CACHED: ${cacheKey} - x-vercel-cache: `, cachedResponse.headers.get('x-vercel-cache'))
      }

      return cachedResponse
    } catch (error) {
      throw new Error(`Custom Caching of Children Failed with error: ${error}`)
    }
  }
}
