import { HeliaInit, createHelia } from 'helia'
import type { Helia } from '@helia/interface'
import { Libp2pOptions, createLibp2p } from 'libp2p'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { webSockets } from '@libp2p/websockets'
import { webTransport } from '@libp2p/webtransport'
// import { bootstrap } from '@libp2p/bootstrap'
import { MemoryBlockstore } from 'blockstore-core'
// import { MemoryDatastore } from 'datastore-core'
import { delegatedPeerRouting } from "@libp2p/delegated-peer-routing";
// import { delegatedContentRouting } from "@libp2p/delegated-content-routing";
import { create as kuboClient } from "kubo-rpc-client";
import { ipniRouting } from './ipni-routing'
import { kadDHT } from '@libp2p/kad-dht'
import { LevelDatastore } from 'datastore-level'
import { bootstrap } from '@libp2p/bootstrap'



export async function getHelia (): Promise<Helia> {
  // the blockstore is where we store the blocks that make up files
  const blockstore: HeliaInit['blockstore'] = new MemoryBlockstore() as unknown as HeliaInit['blockstore']

  // application-specific data lives in the datastore
  // const datastore: HeliaInit['datastore'] = new MemoryDatastore() as unknown as HeliaInit['datastore']
  const datastore = new LevelDatastore('helia-level-datastore')
  await datastore.open()

  // default is to use ipfs.io
  const delegatedClient = kuboClient({
    // use default api settings
    protocol: "https",
    port: 443,
    host: "node3.delegate.ipfs.io",
  })

  // libp2p is the networking layer that underpins Helia
  const libp2p = await createLibp2p({
    datastore: datastore as unknown as Libp2pOptions['datastore'],
    transports: [
      webSockets(), webTransport()
    ],
    connectionEncryption: [
      noise()
    ],
    streamMuxers: [
      yamux()
    ],
    dht: kadDHT({
      kBucketSize: 20,
      clientMode: true,
    }),
    peerRouters: [delegatedPeerRouting(delegatedClient)],
    contentRouters: [ipniRouting("https", "cid.contact", "443")],//delegatedContentRouting(delegatedClient)],
    /**
       * @see https://github.com/libp2p/js-libp2p/blob/master/doc/CONFIGURATION.md#configuring-dialing
       */
    // dialer: {
    //   dialTimeout: 120000,
    // },
    /**
     * @see https://github.com/libp2p/js-libp2p/blob/master/doc/CONFIGURATION.md#configuring-connection-manager
     */
    connectionManager: {
      // Auto connect to discovered peers (limited by ConnectionManager minConnections)
       maxConnections: Infinity,
       minConnections: 0,
       pollInterval: 2000,
       autoDial: true
    },
    /**
     * @see https://github.com/libp2p/js-libp2p/blob/master/doc/CONFIGURATION.md#configuring-peerstore
     */

    peerRouting: { // Peer routing configuration
      refreshManager: { // Refresh known and connected closest peers
        enabled: false, // Should find the closest peers.
        interval: 6e5, // Interval for getting the new for closest peers of 10min
        bootDelay: 10e3 // Delay for the initial query for closest peers
      }
    },

    /**
     * @see https://github.com/libp2p/js-libp2p/blob/master/doc/CONFIGURATION.md#customizing-peer-discovery
     */
    peerDiscovery: /** @type {import('libp2p').Libp2pOptions['peerDiscovery']} */([
      bootstrap({
        list: [
          "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
          "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
          "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
          "/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt",
          "/dns4/elastic.dag.house/tcp/443/wss/p2p/bafzbeibhqavlasjc7dvbiopygwncnrtvjd2xmryk5laib7zyjor6kf3avm"
        ],
      }),
    ]),
  })

  libp2p.addEventListener('peer:discovery', (evt) => {
    console.log(`Discovered peer ${evt.detail.id.toString()}`)
  })

  libp2p.addEventListener('peer:connect', (evt) => {
    console.log(`Connected to ${evt.detail.remotePeer.toString()}`)
  })
  libp2p.addEventListener('peer:disconnect', (evt) => {
    console.log(`Disconnected from ${evt.detail.remotePeer.toString()}`)
  })

  // create a Helia node
  return await createHelia({
    datastore,
    blockstore,
    libp2p
  })
}
