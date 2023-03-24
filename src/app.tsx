import React, { useState, useRef, useEffect } from 'react'

import ipfsLogo from './ipfs-logo.svg'
import Form from './form.tsx'
import { ChannelActions } from './lib/common.ts'

import { getHelia } from './get-helia.ts'
import { connectAndGetFile } from './lib/connectAndGetFile.ts'
import { HeliaServiceWorkerCommsChannel } from './lib/channel.ts'
import { COLORS } from './lib/common'

interface OutputLine {
  content: string
  color: COLORS
  id: string
}

const channel = new HeliaServiceWorkerCommsChannel('WINDOW')

function App (): JSX.Element {
  const [output, setOutput] = useState<OutputLine[]>([])
  const [fileCid, setFileCid] = useState(localStorage.getItem('helia-service-worker-gateway.forms.fileCid') ?? '')
  const [localMultiaddr, setLocalMultiaddr] = useState(localStorage.getItem('helia-service-worker-gateway.forms.localMultiaddr') ?? '')
  const [useServiceWorker, setUseServiceWorker] = useState(localStorage.getItem('helia-service-worker-gateway.forms.useServiceWorker') === 'true' ?? false)

  useEffect(() => {
    localStorage.setItem('helia-service-worker-gateway.forms.fileCid', fileCid)
  }, [fileCid])
  useEffect(() => {
    localStorage.setItem('helia-service-worker-gateway.forms.localMultiaddr', localMultiaddr)
  }, [localMultiaddr])
  useEffect(() => {
    localStorage.setItem('helia-service-worker-gateway.forms.useServiceWorker', useServiceWorker.toString())
  }, [useServiceWorker])

  const terminalEl = useRef<HTMLDivElement>(null)

  const showStatus = (text: OutputLine['content'], color: OutputLine['color'] = COLORS.default, id: OutputLine['id'] = ''): void => {
    setOutput((prev: OutputLine[]) => {
      return [...prev,
        {
          content: text,
          color,
          id
        }
      ]
    })

    terminalEl.current?.scroll?.({ top: terminalEl.current?.scrollHeight, behavior: 'smooth' })
  }

  const handleSubmit = async (e): Promise<void> => {
    e.preventDefault()

    try {
      if (fileCid == null || fileCid.trim() === '') {
        throw new Error('File CID is missing...')
      }

      if (useServiceWorker) {
        showStatus('Fetching content using Service worker...', COLORS.active)
        channel.postMessage({ action: ChannelActions.GET_FILE, data: { fileCid, localMultiaddr } })
      } else {
        showStatus('Fetching content using main thread (no SW)...', COLORS.active)
        await connectAndGetFile({
          // need to use a separate channel instance because a BroadcastChannel instance won't listen to its own messages
          channel: new HeliaServiceWorkerCommsChannel('WINDOW'),
          localMultiaddr,
          fileCid,
          helia: await getHelia(),
          action: ChannelActions.GET_FILE,
          cb: async ({ fileContent, action }) => {
            console.log('non-SW fileContent: ', fileContent)
          }
        })
      }
    } catch (err) {
      showStatus((err as Error)?.message, COLORS.error)
    }
  }

  useEffect(() => {
    const onMsg = (event): void => {
      const { data } = event
      console.log('received message:', data)
      switch (data.action) {
        case ChannelActions.SHOW_STATUS:
          showStatus(`${data.source}: ${data.data.text}`, data.data.color, data.data.id)
          break
        default:
          console.log(`SW action ${data.action} NOT_IMPLEMENTED yet...`)
      }
    }
    channel.onmessage(onMsg)
  }, [channel])

  return (
    <>
      <header className='flex items-center pa3 bg-navy bb bw3 b--aqua'>
        <a href='https://ipfs.io' title='home'>
          <img alt='IPFS logo' src={ipfsLogo} style={{ height: 50 }} className='v-top' />
        </a>
      </header>

      <main className='pa4-l bg-snow mw7 mv5 center pa4'>
        <h1 className='pa0 f2 ma0 mb4 aqua tc'>Fetch content from IPFS using Helia</h1>
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

        <div className='window'>
          <div className='header' />
          <div id='terminal' className='terminal' ref={terminalEl}>
            {output.length > 0 &&
              <div id='output'>
                {output.map((log, index) =>
                  <p key={index} style={{ color: log.color }} id={log.id}>
                    {log.content}
                  </p>)}
              </div>}
          </div>
        </div>
      </main>
    </>
  )
}

export default App
