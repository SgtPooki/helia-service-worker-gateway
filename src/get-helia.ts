import { type HeliaInit, createHelia } from 'helia'
import type { Helia } from '@helia/interface'
import { type Libp2pOptions, createLibp2p } from 'libp2p'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { webSockets } from '@libp2p/websockets'
import { webTransport } from '@libp2p/webtransport'
import { MemoryBlockstore } from 'blockstore-core'
// import { LevelDatastore } from 'datastore-level'
import { bootstrap } from '@libp2p/bootstrap'
import { MemoryDatastore } from 'datastore-core'
import { delegatedPeerRouting } from '@libp2p/delegated-peer-routing'
import { create as kuboClient } from 'kubo-rpc-client'

import { ipniRouting } from './ipni-routing.ts'
import { delegatedContentRouting } from '@libp2p/delegated-content-routing'

export async function getHelia (): Promise<Helia> {
  // the blockstore is where we store the blocks that make up files
  const blockstore: HeliaInit['blockstore'] = new MemoryBlockstore() as unknown as HeliaInit['blockstore']

  // application-specific data lives in the datastore
  const datastore: HeliaInit['datastore'] = new MemoryDatastore() as unknown as HeliaInit['datastore']
  // use the below datastore if you want to persist your peerId and other data.
  // const datastore = new LevelDatastore('helia-level-datastore')
  // await datastore.open()

  // default is to use ipfs.io
  const delegatedClient = kuboClient({
    // use default api settings
    protocol: 'https',
    port: 443,
    host: 'node3.delegate.ipfs.io'
  })
  const validTransports = ['/ws', '/wss', '/webtransport']
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
    peerRouters: [delegatedPeerRouting(delegatedClient)],
    contentRouters: [ipniRouting('https', 'cid.contact', '443'), delegatedContentRouting(delegatedClient)],
    /**
     * @see https://github.com/libp2p/js-libp2p/blob/master/doc/CONFIGURATION.md#configuring-connection-manager
     */
    connectionManager: {
      // Auto connect to discovered peers (limited by ConnectionManager minConnections)
      //  maxConnections: Infinity,
      minConnections: 1,
      pollInterval: 2000,
      autoDial: true,
      addressSorter: (addressA, addressB) => {
        // Sort addresses by valid browser protocols first
        const addressAString = addressA.multiaddr.toString()
        const addressBString = addressB.multiaddr.toString()
        const addressAIsValidBrowserProtocol = validTransports.some((transport) => addressAString.includes(transport))
        const addressBIsValidBrowserProtocol = validTransports.some((transport) => addressBString.includes(transport))
        if (addressAIsValidBrowserProtocol && !addressBIsValidBrowserProtocol) {
          return -1
        }
        if (!addressAIsValidBrowserProtocol && addressBIsValidBrowserProtocol) {
          return 1
        }
        return 0
      }
      //  maxAddrsToDial: 100,
    },
    /**
     * @see https://github.com/libp2p/js-libp2p/blob/master/doc/CONFIGURATION.md#configuring-peerstore
     */
    peerRouting: { // Peer routing configuration
      refreshManager: { // Refresh known and connected closest peers
        enabled: true, // Should find the closest peers.
        interval: 15000, // Interval for getting the new for closest peers of 10min
        bootDelay: 2000 // Delay for the initial query for closest peers
      }
    },

    /**
     * @see https://github.com/libp2p/js-libp2p/blob/master/doc/CONFIGURATION.md#customizing-peer-discovery
     */
    peerDiscovery: /** @type {import('libp2p').Libp2pOptions['peerDiscovery']} */([
      bootstrap({
        list: [
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
          '/dns4/elastic.dag.house/tcp/443/wss/p2p/bafzbeibhqavlasjc7dvbiopygwncnrtvjd2xmryk5laib7zyjor6kf3avm'
        ]
      })
    ])
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
  console.log('peerId: ', libp2p.peerId.toString())

  // create a Helia node
  return await createHelia({
    datastore,
    blockstore,
    libp2p
  })
}
