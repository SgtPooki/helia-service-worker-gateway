// import { BroadcastUpdatePlugin } from 'workbox-broadcast-update';
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, setDefaultHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

// import { getHelia } from '../get-helia.ts';
import { HeliaServiceWorkerStrategy } from './HeliaServiceWorkerStrategy.ts';
import { getHelia } from '../get-helia.ts';
import { getFile } from '../lib/getFile.ts';


// import { CacheChildren } from './CacheChildrenStrategy.ts';

declare var self: ServiceWorkerGlobalScope;

// Setting the default expiration options for the caches.
const DEFAULT_EXPIRATION_OPTIONS = {
  maxEntries: 128,
  maxAgeSeconds: 60 * 60 * 24 * 7,   // 7 days, making sure we don't end up with sticky caches.
  purgeOnQuotaError: true,
  matchOptions: {
    ignoreVary: true
  }
};

// boilerplate
self?.skipWaiting?.();
clientsClaim();
// @ts-ignore: __WB_MANIFEST is a placeholder filled by workbox-webpack-plugin with the list of dependecies to be cached
const WB_MANIFEST = self.__WB_MANIFEST;
if (WB_MANIFEST) {
  console.log(`WB_MANIFEST: `, WB_MANIFEST);
  precacheAndRoute(WB_MANIFEST);
}

// Static Assets
// registerRoute(
//   /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
//   new CacheFirst({
//     cacheName: 'static-assets',
//     matchOptions: {
//       ignoreVary: true
//     },
//     plugins: [
//       new ExpirationPlugin(DEFAULT_EXPIRATION_OPTIONS),
//     ],
//   }),
//   'GET'
// );

// // Static Assets JS and CSS
// registerRoute(
//   /\.(?:css|js)$/i,
//   new StaleWhileRevalidate({
//     cacheName: 'static-assets',
//     matchOptions: {
//       ignoreVary: true
//     },
//     plugins: [
//       new ExpirationPlugin({
//         ...DEFAULT_EXPIRATION_OPTIONS,
//         // Making sure we don't cache the assets for more than 1 hour. In case we need to update them.
//         maxAgeSeconds: 60 * 60 * 24
//       }),
//     ],
//   }),
//   'GET'
// );




// registerRoute('')

// API Route for roadmap
// registerRoute(
//   ({ url }) => url.pathname === '/api/roadmap',
//   new StaleWhileRevalidate({
//     cacheName: 'roadmap',
//     matchOptions: {
//       ignoreVary: true
//     },
//     plugins: [
//       new ExpirationPlugin({
//         ...DEFAULT_EXPIRATION_OPTIONS,
//         maxEntries: 256
//       }),
//       new BroadcastUpdatePlugin()
//     ],
//   }),
//   'GET'
// );

// // API Route for pending children
// registerRoute(
//   ({ url }) => url.pathname === '/api/pendingChild',
//   new CacheChildren({
//     cacheName: 'milestones',
//     matchOptions: {
//       ignoreVary: true
//     },
//     plugins: [
//       new ExpirationPlugin({
//         ...DEFAULT_EXPIRATION_OPTIONS,
//         maxEntries: 1000
//       }),
//       new BroadcastUpdatePlugin()
//     ],
//   }),
//   'GET'
// );

const helia = await getHelia()

async function postMessageToClients (message) {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    console.log(`client: `, client);
    client.postMessage({source: 'helia', data: message});
  });
}
self.onmessage = async (event) => {
  console.log('SW received message', event);
  const fileContent = await getFile({ fileCid: event.data, helia})
  console.log(`fileContent: `, fileContent);
  postMessageToClients(fileContent);
}

// registerRoute(new RegExp('/ipfs/([^/]+).*'), new HeliaServiceWorkerStrategy({
//   cacheName: 'helia',
//   matchOptions: {
//     ignoreVary: false
//   },
// }, helia), 'GET')


cleanupOutdatedCaches();
setDefaultHandler(new NetworkFirst());

console.log('Service Worker Loaded')
