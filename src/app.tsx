import React, { useState, useRef } from 'react';
import type { Helia } from '@helia/interface'

import ipfsLogo from './ipfs-logo.svg'
import Form from './form';

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

window.addEventListener('message', (event) => {
  if (event.data.source === 'helia') {
    console.log('received message from helia service worker:', )
  }
}, false);

function App() {
  const [output, setOutput] = useState<OutputLine[]>([]);
  // const [helia, setHelia] = useState<Helia | null>(null);
  const [fileCid, setFileCid] = useState('');


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
      navigator.serviceWorker?.controller?.postMessage(fileCid);


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
        <Form handleSubmit={handleSubmit} fileCid={fileCid} setFileCid={setFileCid} />

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
