
export enum HeliaServiceWorkerActions {
  GET_FILE = 'GET_FILE',
  DIAL = 'DIAL',
}

export interface HeliaServiceWorkerEventData<T = HeliaServiceWorkerActions, Data = any> {
  target: 'helia',
  action: T,
  data: Data
}

export interface HeliaServiceWorkerEvent extends ExtendableMessageEvent {
  data: HeliaServiceWorkerEventData
}


export function sendHeliaServiceWorkerMessage({ data, action }: Pick<HeliaServiceWorkerEventData, 'data' | 'action'>) {
  navigator.serviceWorker.controller?.postMessage({ target: 'helia', action, data });
}
