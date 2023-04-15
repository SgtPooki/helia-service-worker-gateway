import { type HeliaInit, createHelia } from 'helia'
import type { Helia } from '@helia/interface'
import { MemoryBlockstore } from 'blockstore-core'
import { LevelDatastore } from 'datastore-level'
import { MemoryDatastore } from 'datastore-core'

import type { Libp2pConfigTypes } from './types.ts'
import { getLibp2p } from './getLibp2p.ts'
import type { Datastore } from 'interface-datastore'

interface GetHeliaOptions {
  usePersistentDatastore?: boolean
  libp2pConfigType: Libp2pConfigTypes
}
const defaultOptions: GetHeliaOptions = {
  usePersistentDatastore: false,
  libp2pConfigType: 'ipni'
}

export async function getHelia ({ usePersistentDatastore, libp2pConfigType }: GetHeliaOptions = defaultOptions): Promise<Helia> {
  // the blockstore is where we store the blocks that make up files
  const blockstore = new MemoryBlockstore()

  // application-specific data lives in the datastore
  let datastore: Datastore

  if (usePersistentDatastore === true) {
    // use the below datastore if you want to persist your peerId and other data.
    const level = new LevelDatastore('helia-level-datastore')
    await level.open()
    datastore = level
  } else {
    datastore = new MemoryDatastore()
  }

  // libp2p is the networking layer that underpins Helia
  const libp2p = await getLibp2p({ datastore, type: libp2pConfigType })

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
    datastore: datastore as unknown as HeliaInit['datastore'],
    blockstore,
    libp2p
  })
}
