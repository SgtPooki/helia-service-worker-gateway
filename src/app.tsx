import React, { useState, useRef, useEffect } from 'react';

import ipfsLogo from './ipfs-logo.svg'
import Form from './form.tsx';
import { HeliaServiceWorkerActions, sendHeliaServiceWorkerMessage } from './lib/swActions.ts';
import {multiaddr, protocols} from '@multiformats/multiaddr'

import { getHelia } from './get-helia.ts';
import { connectAndGetFile } from './lib/connectAndGetFile.ts';

// console.log(`multiaddr: `, multiaddr);
(window as any).multiaddr = multiaddr;

(window as any).protocols = protocols;

enum COLORS {
  default = '#fff',
  active = '#357edd',
  success = '#0cb892',
  error = '#ea5037'
}

interface OutputLine {
  content: string
  color: COLORS
  id: string
}

window.addEventListener('message', ({data}) => {
  if (data.source === 'helia') {
    console.log('received message from helia service worker:')
    console.log('SW action: ', data.action)
    console.log('SW data: ', data.data)
  }
}, false);

function App() {
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [fileCid, setFileCid] = useState(localStorage.getItem('helia-service-worker-gateway.forms.fileCid') ?? '');
  const [localMultiaddr, setLocalMultiaddr] = useState(localStorage.getItem('helia-service-worker-gateway.forms.localMultiaddr') ?? '');
  const [useServiceWorker, setUseServiceWorker] = useState(localStorage.getItem('helia-service-worker-gateway.forms.useServiceWorker') === 'true' ?? false);

  useEffect(() => {
    localStorage.setItem('helia-service-worker-gateway.forms.fileCid', fileCid)
  }, [fileCid])
  useEffect(() => {
    localStorage.setItem('helia-service-worker-gateway.forms.localMultiaddr', localMultiaddr)
  }, [localMultiaddr])
  useEffect(() => {
    localStorage.setItem('helia-service-worker-gateway.forms.useServiceWorker', useServiceWorker.toString())
  }, [useServiceWorker])

  const terminalEl = useRef<HTMLDivElement>(null);

  const showStatus = (text: OutputLine['content'], color: OutputLine['color'] = COLORS.default, id: OutputLine['id'] = '') => {
    setOutput((prev: OutputLine[]) => {
      return [...prev,
        {
        'content': text,
        'color': color,
        'id': id
        }
      ]
    })

    terminalEl.current?.scroll?.({ top: terminalEl.current?.scrollHeight, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (fileCid == null || fileCid.trim() === '') {
        throw new Error('File CID is missing...')
      }

      if (useServiceWorker) {

        sendHeliaServiceWorkerMessage({ action: HeliaServiceWorkerActions.GET_FILE, data: { fileCid, localMultiaddr } })
      } else {
        await connectAndGetFile({
          localMultiaddr,
          fileCid,
          helia: await getHelia(),
          action: HeliaServiceWorkerActions.GET_FILE,
          cb: async ({ fileContent, action }) => {
            console.log('non-SW fileContent: ', fileContent);
          }
        })
      }

      // const output = await fetch(`/ipfs/${fileCid}`, { method: 'GET' })
      // console.log(`output: `, output);
      // console.log(`output: `, output.text());
    } catch (err) {
      showStatus((err as Error)?.message, COLORS.error)
    }
  }

  return (
    <>
      <header className='flex items-center pa3 bg-navy bb bw3 b--aqua'>
        <a href='https://ipfs.io' title='home'>
          <img alt='IPFS logo' src={ipfsLogo} style={{ height: 50 }} className='v-top' />
        </a>
      </header>

      <main className="pa4-l bg-snow mw7 mv5 center pa4">
        <h1 className="pa0 f2 ma0 mb4 aqua tc">Fetch content from IPFS using Helia</h1>
        <Form
          handleSubmit={handleSubmit}
          fileCid={fileCid}
          setFileCid={setFileCid}
          localMultiaddr={localMultiaddr}
          setLocalMultiaddr={setLocalMultiaddr}
          useServiceWorker={useServiceWorker}
          setUseServiceWorker={setUseServiceWorker}
        />

        <h3>Output</h3>

        <div className="window">
          <div className="header"></div>
          <div id="terminal" className="terminal" ref={terminalEl}>
            { output.length > 0 &&
              <div id="output">
                { output.map((log, index) =>
                  <p key={index} style={{'color': log.color}} id={log.id}>
                    {log.content}
                  </p>)
                }
              </div>
            }
          </div>
        </div>
      </main>
    </>
  );
}

export default App;
