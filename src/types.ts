import type { multiaddr } from '@multiformats/multiaddr'

export type Multiaddr = ReturnType<typeof multiaddr>

export interface ReframeV1ResponseItem {
  ID: string
  Addrs: Multiaddr[]
  Protocol: string
  Schema: string
}

export interface HTTPClientExtraOptions {
  headers?: Record<string, string>
  searchParams?: URLSearchParams
}
