import { fetch as httpFetch, Body, ResponseType } from "@tauri-apps/api/http"
import { WS_CONST, CloseReason, wsBinaryHeaderList } from './const.ts'
import CryptoJS from "crypto-js"
import * as brotli from 'brotli-js'
export class bilibili {
  host = 'https://live-open.biliapi.com'

  constructor(roomId) {
    this.appKey = import.meta.env.VITE_BILIBILI_APP_KEY
    this.appSecret = import.meta.env.VITE_BILIBILI_APP_SECRET
    this.app_id = parseInt(import.meta.env.VITE_BILIBILI_APP_ID)
    this.roomId = roomId
  }

  async init(successCallBack, failCallBack) {
    this.successCallBack = successCallBack
    this.failCallBack = failCallBack
    // 项目开启
    let res = await httpFetch(`${this.host}/v2/app/start`, {
      method: 'POST',
      headers: this.getEncodeHeader({
        code: this.roomId,
        app_id: this.app_id
      }, this.appId, this.appSecret),
      body: Body.json({
        code: this.roomId,
        app_id: this.app_id
      })
    })
    if (res.data && res.data.code === 0) {
      this.res = res
      // 创建ws连接
      this.ws = new WebSocket(res.data.data.websocket_info.wss_link[0])
      this.ws.onopen = () => {
        // 发送认证消息
        this.ws.send(this.convertToArrayBuffer(JSON.parse(res.data.data.websocket_info.auth_body), WS_CONST.WS_OP_USER_AUTHENTICATION))
      }
      this.ws.onmessage = (e) => {
        try {
          // const packets = this.parseArrayBuffer(e.data)
          this.handleMessage(e.data, (res) => {
            res.forEach((v, k) => {
              let data = JSON.parse(JSON.parse(v).body)
              if (data.cmd) {
                let rt = {
                  platform: 'bilibili', // 平台
                  action: 'none', // 动作
                  msg: '', // 消息
                  user_title: '', // 用户名
                  fans_title: '', // 粉丝牌
                  fans_level: 0, // 粉丝牌等级
                  noble_title: '', // 贵族
                  noble_level: 0, // 贵族等级
                  paid: 0, // 价值
                  user_level: 0, // 用户等级
                  roomId: this.roomId, // 房间号
                  header: '', // 头像
                  gift: { // 礼物
                    title: '',// 名称
                    count: 0, // 数量
                    price: 0, // 价值
                    hits: 0, // 连击
                    noble: false // 是否订阅
                  },
                  uid: 0, // 用户id
                }
                switch (data.cmd) {
                  case 'LIVE_OPEN_PLATFORM_DM':
                    rt.action = 'msg'
                    rt.user_title = data.data.uname
                    rt.header = data.data.uface
                    rt.uid = data.data.open_id
                    if(data.data.dm_type == 1){
                      rt.msg = `<img src="${data.data.emoji_img_url}" style="height: 28px;display: inline-block;">`
                    }else{
                      rt.msg = data.data.msg
                    }
                    if (data.data.fans_medal_name.length > 0) {
                      rt.fans_title = data.data.fans_medal_name
                      rt.fans_level = data.data.fans_medal_level
                    }
                    if(data.data.guard_level > 0){
                      rt.noble_title = g[data.data.guard_level]
                      rt.noble_level = data.data.guard_level
                    }
                    break
                  case 'LIVE_OPEN_PLATFORM_SEND_GIFT':
                    rt.action = 'gift'
                    rt.user_title = data.data.uname
                    rt.header = data.data.uface
                    rt.gift = {
                      title: data.data.gift_name,
                      count: data.data.gift_num,
                      price: parseFloat((data.data.price / 1000).toFixed(2)),
                      hits: data.data.combo_gift ? data.data.combo_info.combo_count : 0,
                      noble: false
                    }
                    break
                  case 'LIVE_OPEN_PLATFORM_SUPER_CHAT':
                    rt.action = 'gift'
                    rt.user_title = data.data.uname
                    rt.msg = '高能弹幕：' + data.data.message
                    rt.header = data.data.uface
                    rt.gift = {
                      title: data.data.message,
                      count: 1,
                      price: data.data.rmb,
                      hits: 0,
                      noble: false
                    }
                    break
                  case 'LIVE_OPEN_PLATFORM_SUPER_CHAT_DEL':
                    break
                  case 'LIVE_OPEN_PLATFORM_GUARD':
                    rt.action = 'gift'
                    rt.user_title = data.data.uname
                    rt.msg = data.data.guard_unit
                    rt.gift = {
                      title: data.data.guard_name,
                      count: data.data.guard_num,
                      price: 0,
                      hits: 0,
                      noble: true
                    }
                    break
                  case 'LIVE_OPEN_PLATFORM_LIKE':
                    rt.action = 'like'
                    rt.user_title = data.data.uname
                    rt.uface
                    break
                  case 'LIVE_OPEN_PLATFORM_INTERACTION_END':
                    this.destroy()
                    action = 'LIVE_OPEN_PLATFORM_INTERACTION_END'
                    break
                }
                if (typeof this.successCallBack == 'function') {
                  rt.roomId = this.res.data.data.anchor_info.room_id
                  this.successCallBack(rt)
                }
              }
            })
          })
        } catch (e) {
          console.error("[ws] 解析 packet 失败", e)
        }
      }
      this.ws.onclose = async () => {
        try {
          await this.destroy()
          if(typeof this.failCallBack == 'function'){
            this.failCallBack({ platform: 'bilibili', roomId: this.roomId, message: `bilibili主播${this.res.data.data.anchor_info.uname}的${this.res.data.data.anchor_info.room_id}房间弹幕服务器已断开` })
          }
        } catch (error) {
          
        }
      }
    } else {
      if (typeof this.failCallBack == 'function') {
        this.failCallBack({ platform: 'bilibili', roomId: this.roomId, message: res.data.message })
      }
    }
  }
  getEncodeHeader(params) {
    const timestamp = parseInt(Date.now() / 1000 + "")
    const nonce = parseInt(Math.random() * 100000 + "") + timestamp
    const header = {
      "x-bili-accesskeyid": this.appKey,
      "x-bili-content-md5": this.getMd5Content(JSON.stringify(params)),
      "x-bili-signature-method": "HMAC-SHA256",
      "x-bili-signature-nonce": nonce + "",
      "x-bili-signature-version": "1.0",
      "x-bili-timestamp": timestamp + ""
    }
    const data = []
    for (const key in header) {
      data.push(`${key}:${header[key]}`)
    }

    const signature = CryptoJS.HmacSHA256(data.join("\n"), CryptoJS.enc.Utf8.parse(this.appSecret)).toString(CryptoJS.enc.Hex)
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...header,
      Authorization: signature
    }
  }

  getMd5Content(str) {
    return CryptoJS.MD5(str).toString(CryptoJS.enc.Hex)
  }


  async destroy() {
    this.ws && this.ws.close()
    this.ws = undefined
    let res = await httpFetch(`${this.host}/v2/app/end`, {
      method: 'POST',
      headers: this.getEncodeHeader({
        app_id: this.app_id,
        game_id: this.res.data.data.game_info.game_id
      }, this.appId, this.appSecret),
      // responseType: ResponseType.JSON,
      body: Body.json({
        app_id: this.app_id,
        game_id: this.res.data.data.game_info.game_id
      })
    })
  }

  async ping() {
    try {
      await httpFetch(`${this.host}/v2/app/heartbeat`, {
        method: 'POST',
        headers: this.getEncodeHeader({
          game_id: this.res.data.data.game_info.game_id
        }, this.appId, this.appSecret),
        body: Body.json({
          game_id: this.res.data.data.game_info.game_id
        })
      })
      let buff = new ArrayBuffer(16);
      let i = new DataView(buff);
      i.setUint32(0, 0);    //整个封包
      i.setUint16(4, 16);    //头部
      i.setUint16(6, 1);    //协议版本
      i.setUint32(8, 2);    //操作码,2为心跳包
      i.setUint32(12, 1);    //填1
      this.ws && this.ws.send(buff)
    } catch (error) {
      this.ws?.destroy()
    }
  }
  handleMessage(blob, call) {
    let reader = new FileReader();
    reader.onload = function (e) {
      let buff = e.target.result;    //ArrayBuffer对象
      let decoder = new TextDecoder();    //解码器
      let view = new DataView(buff);    //视图
      let offset = 0;
      let packet = {};
      let result = [];
      while (offset < buff.byteLength) {    //数据提取
        let packetLen = view.getUint32(offset + 0);
        let headLen = view.getUint16(offset + 4);
        let packetVer = view.getUint16(offset + 6);
        let packetType = view.getUint32(offset + 8);
        let num = view.getUint32(12);
        if (packetVer == 3) {    //解压数据
          let brArray = new Uint8Array(buff, offset + headLen, packetLen - headLen);
          let BrotliDecode = this.makeBrotliDecode() // 生成Brotli格式解压工具的实例
          // let BrotliDecode = makeBrotliDecode();    //生成Brotli格式解压工具的实例
          let buffFromBr = BrotliDecode(brArray);    //返回Int8Array视图
          let view = new DataView(buffFromBr.buffer);
          let offset_Ver3 = 0;
          while (offset_Ver3 < buffFromBr.byteLength) {    //解压后数据提取
            let packetLen = view.getUint32(offset_Ver3 + 0);
            let headLen = view.getUint16(offset_Ver3 + 4);
            let packetVer = view.getUint16(offset_Ver3 + 6);
            let packetType = view.getUint32(offset_Ver3 + 8);
            let num = view.getUint32(12);
            packet.Len = packetLen;
            packet.HeadLen = headLen;
            packet.Ver = packetVer;
            packet.Type = packetType;
            packet.Num = num;
            let dataArray = new Uint8Array(buffFromBr.buffer, offset_Ver3 + headLen, packetLen - headLen);
            packet.body = decoder.decode(dataArray);    //utf-8格式数据解码，获得字符串
            result.push(JSON.stringify(packet));    //数据打包后传入数组
            offset_Ver3 += packetLen;
          }
        } else {
          packet.Len = packetLen;
          packet.HeadLen = headLen;
          packet.Ver = packetVer;
          packet.Type = packetType;
          packet.Num = num;
          let dataArray = new Uint8Array(buff, offset + headLen, packetLen - headLen);
          if (packetType == 3) {    //获取人气值
            packet.body = (new DataView(buff, offset + headLen, packetLen - headLen)).getUint32(0);    //若入参为dataArray.buffer，会返回整段buff的视图，而不是截取后的视图
          } else {
            packet.body = decoder.decode(dataArray);    //utf-8格式数据解码，获得字符串
          }
          result.push(JSON.stringify(packet));    //数据打包后传入数组
        }
        offset += packetLen;
      }
      call(result);    //数据后续处理
    }
    reader.readAsArrayBuffer(blob);    //读取服务器传来的数据转换为ArrayBuffer
  }
  convertToArrayBuffer(payload, op) {
    const header = new ArrayBuffer(WS_CONST.WS_PACKAGE_HEADER_TOTAL_LENGTH)
    const dataView = new DataView(header, WS_CONST.WS_PACKAGE_OFFSET)
    const encoder = new TextEncoder()
    const body = encoder.encode(JSON.stringify(payload))

    dataView.setInt32(WS_CONST.WS_PACKAGE_OFFSET, WS_CONST.WS_PACKAGE_HEADER_TOTAL_LENGTH + body.byteLength)
    wsBinaryHeaderList[2].value = op
    wsBinaryHeaderList.forEach(head => {
      if (head.bytes === 4) {
        dataView.setInt32(head.offset, head.value)
      } else if (head.bytes === 2) {
        dataView.setInt16(head.offset, head.value)
      }
    })
    return this.mergeArrayBuffer(header, body)
  }
  mergeArrayBuffer(buf1, buf2) {
    const b1 = new Uint8Array(buf1)
    const b2 = new Uint8Array(buf2)
    const buf = new Uint8Array(b1.byteLength + b2.byteLength)
    buf.set(b1, 0)
    buf.set(b2, b1.byteLength)
    return buf.buffer
  }
}