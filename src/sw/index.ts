// import { BroadcastUpdatePlugin } from 'workbox-broadcast-update';
import { clientsClaim } from 'workbox-core';
// import { cleanupOutdatedCaches } from 'workbox-precaching';
// import { setDefaultHandler } from 'workbox-routing';
// import { NetworkFirst } from 'workbox-strategies';
// import type { Libp2p } from 'libp2p';
import debug from 'debug'

import { multiaddr } from '@multiformats/multiaddr'
import { getHelia } from '../get-helia.ts';
// import { getFile } from '../lib/getFile.ts';
import { HeliaServiceWorkerActions, HeliaServiceWorkerEvent } from '../lib/swActions.ts';
import { connectAndGetFile } from '../lib/connectAndGetFile.ts';

// localStorage.setItem doesn't work in service workers
// debug.enable('libp2p:websockets,libp2p:webtransport,libp2p:kad-dht,libp2p:dialer*,libp2p:connection-manager')
// debug.enable('libp2p:*:error')

declare var self: ServiceWorkerGlobalScope;

self?.skipWaiting?.();
clientsClaim();

// const helia = await getHelia()

async function postMessageToClients (data: any, action: HeliaServiceWorkerActions) {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ source: 'helia', action: `${action}_RESPONSE`,  data });
  });
}

self.oninstall = async (event) => {
  console.log(`sw oninstall`);
}

self.onmessage = async (event: HeliaServiceWorkerEvent) => {
  const { data } = event
  if (data.target !== 'helia') {
    // skip messages not intended for helia
    return;
  }
  console.log('Helia SW received message', event);

  switch (data.action) {
    case HeliaServiceWorkerActions.GET_FILE:
      // let dialResponse
      // if (data.data.localMultiaddr) {
      //   const ma = multiaddr(data.data.localMultiaddr)
      //   console.log(`ma: `, ma);
      //   try {
      //     const dialResponse = await helia.libp2p.dial(ma)
      //     console.log(`sw dialResponse: `, dialResponse);
      //   } catch (e) {
      //     console.trace(`sw dial error: `, e);
      //   }
      // }
      // const fileContent = await getFile({ fileCid: data.data.fileCid, helia })
      // await postMessageToClients(fileContent, data.action);
      const { localMultiaddr, fileCid } = data.data
      // console.log(`localMultiaddr: `, localMultiaddr);
      // console.log(`fileCid: `, fileCid);
      // let localConnection: Awaited<ReturnType<Libp2p['dial']>> | undefined
      // if (localMultiaddr) {
      //   const ma = multiaddr(localMultiaddr)
      //   console.log(`ma: `, ma);
      //   try {
      //     localConnection = await helia?.libp2p.dial(ma)
      //     console.log(`sw localConnection: `, localConnection);
      //   } catch (e) {
      //     console.trace(`sw dial error: `, e);
      //   }
      // }

      // const fileContent = await getFile({ fileCid, helia })
      // console.log(`fileContent: `, fileContent);
      // await postMessageToClients(fileContent, data.action);
      // if (localConnection) {
      //   localConnection.close
      // }

      await connectAndGetFile({
        localMultiaddr,
        fileCid,
        helia: await getHelia(),
        action: data.action,
        cb: async ({ fileContent, action }) => postMessageToClients(`fileContent: ${data}`, action)
      })

      break;
    // case HeliaServiceWorkerActions.DIAL:
    //   try {
    //     const ma = multiaddr(data.data)
    //     console.log(`ma: `, ma);
    //     const dialResponse = await helia.libp2p.dial(ma)
    //     console.log(`sw dialResponse: `, dialResponse);
    //   } catch (e) {
    //     console.error(`sw dial error: `, e);
    //   }
    //   break;
    default:
      console.error('SW received unknown action', data.action)
      break;
  }
}
self.onactivate = async (event) => {
  // event.waitUntil(async () => {
  console.log(`sw onactivate`);
  // await cleanupOutdatedCaches();
  // await event.waitUntil(self.clients.claim());
  // })
}

// cleanupOutdatedCaches();
// setDefaultHandler(new NetworkFirst());

console.log('Service Worker Loaded')
