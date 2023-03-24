import type { multiaddr } from '@multiformats/multiaddr'
import type { Libp2pInit } from 'libp2p'

export type Multiaddr = ReturnType<typeof multiaddr>
export type LibP2pComponents = Parameters<(Required<Libp2pInit['peerRouters']> extends infer K
  ? K extends undefined ? never : K
  : never)[0]>[0]

export interface CustomRoutingEventType {
  Metadata: string // gBI= means bitswap

}
export interface IpniResponseItem extends CustomRoutingEventType {
  ContextID: string
  Provider: {
    ID: string
    Addrs: Multiaddr[]
  }
}

export interface ReframeV1ResponseItem extends CustomRoutingEventType {
  ID: string
  Addrs: Multiaddr[]
  Protocol: string
  Schema: string
}

export interface HTTPClientExtraOptions {
  headers?: Record<string, string>
  searchParams?: URLSearchParams
}
