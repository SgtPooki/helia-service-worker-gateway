import type { ChannelActions } from './common.ts';

export const getChannel = () => {
  return
}

export enum ChannelUsers {
  SW = 'SW',
  WINDOW = 'WINDOW',
  EMITTER_ONLY = 'EMITTER_ONLY'
}

export type ChannelUserValues = keyof typeof ChannelUsers

// allows you to select all Sources except the pass source, whether you pass as 'SW' or ChannelUsers.SW
/**
 * @example
 * enum ChannelUsers {
 *   SW = 'SW',
 *   WINDOW = 'WINDOW',
 *   EMITTER_ONLY = 'EMITTER_ONLY'
 * }
 * NotSourceUser<ChannelUsers.WINDOW> // === ChannelUsers.SW | ChannelUsers.EMITTER_ONLY | "SW" | "EMITTER_ONLY"
 * NotSourceUser<'SW'> // === ChannelUsers.WINDOW | ChannelUsers.EMITTER_ONLY | "WINDOW" | "EMITTER_ONLY"
 */
type NotSourceUser<T extends ChannelUserValues> = T extends ChannelUsers
  ? (Exclude<ChannelUsers, T> | `${Exclude<ChannelUsers, T>}`)
  : Exclude<ChannelUsers, T> | keyof Omit<typeof ChannelUsers, T>

interface ChannelMessage<Source extends ChannelUserValues, Data = any> {
  source: Source
  target?: ChannelUserValues
  action: ChannelActions | keyof typeof ChannelActions | 'TEST'
  data: Data
}

export class HeliaServiceWorkerCommsChannel<S extends ChannelUserValues = 'EMITTER_ONLY'> {
  channel: BroadcastChannel;
  debug = false
  constructor(public source: S, private channelName = 'helia:sw') {
    this.log(`HeliaServiceWorkerCommsChannel construction: `, source)

    // NOTE: We're supposed to close the channel when we're done with it, but we're not doing that anywhere yet.
    this.channel = new BroadcastChannel(this.channelName);
    this.channel.onmessageerror = (e) => {
      this.error(`onmessageerror`, e);
    }
  }

  log(...args: any[]) {
    if (!this.debug) return;
    console.log(`HeliaServiceWorkerCommsChannel(${this.source}): `, ...args);
  }
  error(...args: any[]) {
    if (!this.debug) return;
    console.error(`HeliaServiceWorkerCommsChannel(${this.source}): `, ...args);
  }

  canListen() {
    return this.source !== 'EMITTER_ONLY'
  }

  onmessage<MType = any>(cb: (e: MessageEvent<ChannelMessage<ChannelUsers, MType>>) => void | Promise<void>) {
    if (!this.canListen()) {
      throw new Error('Cannot use onmessage on EMITTER_ONLY channel')
    }
    this.channel.onmessage = cb
  }

  onmessagefrom<Source extends ChannelUserValues, MType = any>(source: Source, cb: (e: MessageEvent<ChannelMessage<Source, MType>>) => void | Promise<void>) {
    if (!this.canListen()) {
      throw new Error('Cannot use onmessagefrom on EMITTER_ONLY channel')
    }
    const onMsgHandler = async (e: MessageEvent<ChannelMessage<Source, MType>>) => {
      this.log(`onMsgHandler: `, e)
      if (e.data.source !== source) {
        return;
      }
      if (e.data.action === 'PING') {
        this.postMessage({ action: 'PONG', data: e.data.data })
        return;
      }
      await cb(e);
    };
    this.channel.addEventListener('message', onMsgHandler)
  }

  /**
   * Like onmessage, but only fires if the message is from a source other than the current source
   * @param source
   * @param cb
   */
  onmessagefromother<Source extends NotSourceUser<S>, MType = any>(source: Source, cb: (e: MessageEvent<ChannelMessage<Source, MType>>) => void | Promise<void>) {
    if (!this.canListen()) {
      throw new Error('Cannot use onmessagefromother on EMITTER_ONLY channel')
    }
    const onMsgHandler = async (e: MessageEvent<ChannelMessage<Source, MType>>) => {
      this.log(`onMsgHandler: `, e)
      if (e.data.source !== source) {
        return;
      }
      if (e.data.action === 'PING') {
        this.postMessage({ action: 'PONG', data: e.data.data })
        return;
      }
      await cb(e);

      // this.channel.removeEventListener('message', onMsgHandler)
    };
    // this.onmessage(onMsgHandler as any)
    // this.channel.onmessage = onMsgHandler
    this.channel.addEventListener('message', onMsgHandler)
  }

  messageAndWaitForResponse<ResponseSource extends NotSourceUser<S>, MSendType = any, MReceiveType = any>(responseSource: ResponseSource, data: Omit<ChannelMessage<S, MSendType>, 'source'>): Promise<MReceiveType> {
    if (!this.canListen()) {
      throw new Error('Cannot use messageAndWaitForResponse on EMITTER_ONLY channel')
    }
    return new Promise((resolve, reject) => {
      const onMessage = (e: MessageEvent) => {
        if (e.data.source !== responseSource) {
          return;
        }
        this.channel.removeEventListener('message', onMessage)
        resolve(e.data);
      }
      // this.channel.onmessage = onMessage;
      this.channel.addEventListener('message', onMessage)
      this.postMessage(data);
    })
  }

  postMessage<MType>(msg: Omit<ChannelMessage<S, MType>, 'source'>) {
    this.log(`postMessage: `, msg)
    const msgObj: ChannelMessage<typeof this.source, MType> = {
      ...msg,
      source: this.source,
    }

    this.channel.postMessage(msgObj);
  }
}
