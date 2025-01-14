import { xmlToJson } from './xml-to-json'

import {
  PadproAppAttachPayload,
  PadproAppMessagePayload,
  PadproMessagePayload,
}                       from '../schemas'

import { log } from '../config'

import { isPayload } from './is-type'

export async function appMessageParser (rawPayload: PadproMessagePayload): Promise<PadproAppMessagePayload | null> {
  if (!isPayload(rawPayload)) {
    return null
  }

  const content = rawPayload.content.trim()

  interface XmlSchema {
    msg: {
      appmsg: {
        title: string,
        des: string,
        type: string,
        url: string,
        appattach: {
          totallen: string,
          attachid: string,
          emoticonmd5: string,
          fileext: string,
          cdnattachurl: string,
          cdnthumbaeskey: string,
          aeskey: string,
          encryver: string,
          islargefilemsg: string,
        },
        thumburl: string,
        md5: any,
        recorditem?: string
      },
      fromusername: string,
      appinfo: {
        appname: any
      }
    }
  }
  let tryXmlText = content
  if (!/^<msg>.*/.test(content)) {
    tryXmlText = content.replace(/^[^\n]+\n/, '')
  }

  try {
    const jsonPayload: XmlSchema = await xmlToJson(tryXmlText)

    const { title, des, url, thumburl, type, md5, recorditem } = jsonPayload.msg.appmsg
    let appattach: PadproAppAttachPayload | undefined
    const tmp = jsonPayload.msg.appmsg.appattach
    if (tmp) {
      appattach = {
        aeskey        : tmp.aeskey,
        attachid      : tmp.attachid,
        cdnattachurl  : tmp.cdnattachurl,
        cdnthumbaeskey: tmp.cdnthumbaeskey,
        emoticonmd5   : tmp.emoticonmd5,
        encryver      : tmp.encryver && parseInt(tmp.encryver, 10) || 0,
        fileext       : tmp.fileext,
        totallen      : tmp.totallen && parseInt(tmp.totallen, 10) || 0,
        islargefilemsg: tmp.islargefilemsg && parseInt(tmp.islargefilemsg, 10) || 0,
      }
    }
    return { title, des, url, thumburl, md5, type: parseInt(type, 10), appattach, recorditem }
  } catch (e) {
    log.verbose(e.stack)
    return null
  }
}
