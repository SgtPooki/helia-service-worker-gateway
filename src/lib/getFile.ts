import { unixfs } from '@helia/unixfs'
import { CID } from 'multiformats/cid'

export const getFile = async ({fileCid, helia}) => {

    // if (helia == null) {
    //   throw new Error('Helia helia is not available')
    // }


  const peerId = helia.libp2p.peerId
  console.log(peerId)
  console.log(`My ID is ${peerId}`)//, COLORS.active, peerId.toString())

  const fs = unixfs(helia)
  const cid = CID.parse(fileCid)

  console.log(`Reading UnixFS text file ${cid}...`)//, COLORS.active)
  const decoder = new TextDecoder()
  let text = ''

  for await (const chunk of fs.cat(cid)) {
    text += decoder.decode(chunk, {
      stream: true
    })
  }

  console.log(`\u2514\u2500 CID: ${cid}`)
  console.log(`${text}`)//, COLORS.success)

  return text
}
