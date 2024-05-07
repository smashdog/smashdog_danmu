import messageEvent from './messageEvent'
import STT from './stt'
import Packet from './packet'

export class Client {
  static initOpts = {
    debug: false,
    ignore: [],
  };

  constructor(roomId, opts = Client.initOpts) {
    this.roomId = roomId
    this._ws = null
    this._heartbeatTask = null
    this.messageEvent = messageEvent

    this.debug = opts.debug
    this.ignore = opts.ignore
    this.STT = STT
    this.Packet = Packet
  }

  send = (message) => {
    this._ws.send(Packet.Encode(STT.serialize(message)))
  }

  init = async (successCallBack, failCallBack) => {
    this.successCallBack = successCallBack
    this.failCallBack = failCallBack
    //目前已知的弹幕服务器
    const port = 8500 + ((min, max) => Math.floor(Math.random() * (max - min + 1) + min))(1, 6)
    
    this._ws = new WebSocket(`wss://danmuproxy.douyu.com:${port}/`)
    this._ws.onopen = () => {
      this.send({
        type: 'loginreq',
        roomid: this.roomId,
      })
      this.send({
        type: 'joingroup',
        rid: this.roomId,
        gid: -9999,
      })
    }
    this._ws.onerror = (error) => {
      console.log(error)
    }
    this._ws.onclose = () => {
      if(typeof this.failCallBack === 'function'){
        this.failCallBack({ platform: '斗鱼', roomId: this.roomId, message: `斗鱼房间${this.roomId}弹幕服务器已断开` })
      }
    }
    this._ws.onmessage = (event) => {
      let reader = new FileReader()
      reader.onload = (e) => {
        Packet.Decode(e.target.result, m => {
          const r = STT.deserialize(m)
          const isExist = Object.keys(this.messageEvent)
            .filter(eventName => !this.ignore.includes(eventName))
            .includes(r.type)
          if (isExist) {
            let temp = this.messageEvent[r.type](r)
            if(temp && typeof temp.action != 'undefined'){
              temp.roomId = this.roomId
            }else{
              temp = {action: 'none'}
            }
            this.successCallBack(temp)
          }
        });
      }
      reader.readAsArrayBuffer(event.data)
    }
  }

  ping = async () => {
    this.send({ type: 'mrkl' });
  }

  destroy = async () => {
    // this.logout()
    try {
      this.send({ type: 'logout' });
      this._ws?.close()
    } catch (error) {
      console.log(error)
    }
  }
}
