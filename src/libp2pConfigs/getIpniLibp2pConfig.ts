import type { Libp2pOptions } from 'libp2p'
import { delegatedPeerRouting } from '@libp2p/delegated-peer-routing'
import { ipniContentRouting } from '@libp2p/ipni-content-routing'
import { create as kuboClient } from 'kubo-rpc-client'

export const getIpniLibp2pConfig = (): Libp2pOptions => {
  const delegatedClient = kuboClient({
    // use default api settings
    protocol: 'https',
    port: 443,
    host: 'node3.delegate.ipfs.io'
  })

  return {
    peerRouters: [delegatedPeerRouting(delegatedClient)],
    // contentRouters: [ipniRouting('https', 'indexstar.prod.cid.contact', '443'), delegatedContentRouting(delegatedClient)],
    contentRouters: [ipniContentRouting('https://cid.contact')]
  }
}
