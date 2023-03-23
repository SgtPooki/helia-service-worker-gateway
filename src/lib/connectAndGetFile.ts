import type { Libp2p } from 'libp2p';
import { multiaddr } from '@multiformats/multiaddr'
import type { createHelia } from 'helia';
import { getFile } from './getFile';
import type { HeliaServiceWorkerActions } from './swActions.ts';

interface ConnectAndGetFileOptions {
  localMultiaddr: string,
  fileCid: string,
  helia: Awaited<ReturnType<typeof createHelia>>,
  action: HeliaServiceWorkerActions,
  cb: (data: { fileContent: string, action: HeliaServiceWorkerActions }) => Promise<void>
  }
export async function connectAndGetFile({localMultiaddr, fileCid, helia, cb, action}: ConnectAndGetFileOptions) {
  console.log(`localMultiaddr: `, localMultiaddr);
  console.log(`fileCid: `, fileCid);
  let localConnection: Awaited<ReturnType<Libp2p['dial']>> | undefined
  if (localMultiaddr) {
    const ma = multiaddr(localMultiaddr)
    console.log(`ma: `, ma);
    try {
      localConnection = await helia?.libp2p.dial(ma)
      console.log(`sw localConnection: `, localConnection);
    } catch (e) {
      console.trace(`sw dial error: `, e);
    }
  }

  const fileContent = await getFile({ fileCid, helia })
  console.log(`fileContent: `, fileContent);
  await cb({fileContent, action})
  // await postMessageToClients(fileContent, data.action);
  if (localConnection) {
    localConnection.close
  }
}
