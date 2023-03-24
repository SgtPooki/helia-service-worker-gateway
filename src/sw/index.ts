import { clientsClaim } from 'workbox-core';

import { getHelia } from '../get-helia.ts';
import { ChannelActions } from '../lib/common.ts';
import { connectAndGetFile } from '../lib/connectAndGetFile.ts';
import { HeliaServiceWorkerCommsChannel } from '../lib/channel';

// localStorage.setItem doesn't work in service workers
// import debug from 'debug'
// debug.enable('libp2p:websockets,libp2p:webtransport,libp2p:kad-dht,libp2p:dialer*,libp2p:connection-manager')
// debug.enable('libp2p:*:error')
// debug.enable('libp2p:*:error,-*:trace')

declare var self: ServiceWorkerGlobalScope;

self?.skipWaiting?.();
clientsClaim();

const channel = new HeliaServiceWorkerCommsChannel('SW')

self.oninstall = async (event) => {
  console.log(`sw oninstall`);
}

// simple demo of the messageAndWaitForResponse method
// (async () => {
//   const result = await channel.messageAndWaitForResponse('WINDOW', {action: 'PING', data: '123'});
//   console.log(`SW ping result: `, result);

// })();

channel.onmessagefrom('WINDOW', async (event) => {
  const { data } = event
  switch (data.action) {
    case ChannelActions.GET_FILE:
      const { localMultiaddr, fileCid } = data.data

      await connectAndGetFile({
        channel,
        localMultiaddr,
        fileCid,
        helia: await getHelia(),
        action: data.action,
        cb: async ({ fileContent, action }) => console.log('connectAndGetFile cb', fileContent, action)
      })

      break;
    // case ChannelActions.DIAL:
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
      // console.warn('SW received unknown action', data.action)
      break;
  }
})

self.onactivate = async (event) => {
  console.log(`sw onactivate`);
}

console.log('Service Worker Loaded')
