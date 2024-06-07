import CryptoJS from "crypto-js"
export class huya {
  constructor(roomId) {
    this.appId = import.meta.env.VITE_HUYA_APP_ID
    this.appSecret = import.meta.env.VITE_HUYA_APP_SECRET
    this.roomId = roomId
  }

  async init(successCallBack, failCallBack) {
    if (typeof failCallBack == 'function') {
      if (!this.roomId || !/^[0-9]+$/.test(this.roomId+'')) {
        failCallBack({ platform: 'huya', roomId: this.roomId, message: '房间号错误' })
        return
      }
    }
    this.successCallBack = successCallBack
    this.failCallBack = failCallBack
    const base64UrlEncode = (str) => {
      const base64Encoded = btoa(unescape(encodeURIComponent(str)));
      const base64UrlEncoded = base64Encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      return base64UrlEncoded
    }
    const header = base64UrlEncode(JSON.stringify({
      "alg": "HS256",
      "typ": "JWT"
    }))
    const iat = parseInt(new Date().getTime() / 1000)
    const payloadStr = base64UrlEncode(JSON.stringify({
      iat: iat,
      exp: iat + 600,
      appId: this.appId
    }))
    const signature = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(header + '.' + payloadStr, this.appSecret)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    this.ws = new WebSocket(`wss://ws-apiext.huya.com/index.html?do=comm&roomId=${this.roomId}&appId=${this.appId}&iat=${iat}&exp=${iat + 600}&sToken=${header}.${payloadStr}.${signature}`)
    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({
        "command": "subscribeNotice",
        "data": [
          "getMessageNotice",
          "getVipEnterBannerNotice",
          "getSendItemNotice",
          // "getOnTVAwardNotice", 
          "getOpenNobleNotice",
          "getOpenGuardianNotice",
          // "getUserMutedNotice",
          "getShareLiveNotice",
          "getExpressionEmoticonNotice",
          "getUserDoButtonLikeNotice"
        ],
        "reqId": new Date().getTime()
      }))
    }
    this.ws.onmessage = (e) => {
      if (e.data) {
        let rt = {
          platform: '虎牙', // 平台
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
        }, data = JSON.parse(e.data)
        try {
          switch (data.notice) {
            case 'command':
              rt.action = 'init'
              break
            case 'getMessageNotice':
              rt.action = 'msg'
              rt.user_title = data.data.sendNick
              rt.header = data.data.senderAvatarUrl
              rt.uid = data.data.unionId
              if (typeof data.data.nobleLevel != 'undefined' && data.data.nobleLevel > 0) {
                rt.noble_level = data.data.nobleLevel
                rt.noble_title = '贵'
              }
              if (data.data.badgeName.length > 0) {
                rt.fans_title = data.data.badgeName
                rt.fans_level = data.data.fansLevel
              }
              rt.user_level = data.data.senderLevel
              rt.msg = data.data.content
              break
            case 'getVipEnterBannerNotice':
              rt.action = 'in'
              rt.user_title = typeof data.data.userNick != 'undefined' ? ' ' + data.data.userNick : ''
              rt.header = data.data.userAvatarUrl
              if (typeof data.data.nobleName != 'undefined' && data.data.nobleName.length > 0 && data.data.nobleLevel > 0) {
                rt.noble_title = data.data.nobleName
                rt.noble_level = data.data.nobleLevel
              }
              break
            case 'getSendItemNotice':
              rt.action = 'gift'
              rt.user_title = data.data.sendNick
              rt.header = data.data.senderAvatarurl
              rt.gift = {
                title: data.data.itemName,
                count: data.data.sendItemCount,
                price: parseFloat((data.data.totalPay/100*data.data.sendItemComboHits).toFixed(2)),
                hits: data.data.sendItemComboHits,
                noble: false
              }
              break
            // case 'getOnTVAwardNotice':

            //   break
            case 'getOpenNobleNotice':
              rt.action = 'gift'
              rt.msg = '月'
              rt.user_title = data.data.userNick
              rt.header = data.data.userAvatarUrl
              rt.gift = {
                title: data.data.nobleName,
                count: data.data.months,
                price: 0,
                hits: 0,
                noble: true
              }
              break
            case 'getOpenGuardianNotice':
              rt.action = 'gift'
              rt.user_title = data.data.userNick
              rt.header = data.data.userAvatarUrl
              let temp = {
                0: '守护',
                1: '铁铁'
              }
              rt.msg = '天'
              rt.gift = {
                title: temp[data.data.guardianType],
                count: data.data.openDays,
                price: 0,
                hits: 0,
                noble: true
              }
              break
            // case 'getUserMutedNotice':

            //   break
            case 'getShareLiveNotice':
              rt.action = 'share'
              rt.user_title = data.data.sharerNick
              break
            case 'getExpressionEmoticonNotice':
              rt.action = 'msg'
              rt.user_title = data.data.sendNick
              rt.user_level = data.data.senderLevel
              rt.header = data.data.senderAvatarUrl
              data.data.detail.emoticon.forEach(v => {
                msg += v.content
              })
              break
            case 'getUserDoButtonLikeNotice':
              rt.action = 'like'
              break
          }
        } catch (error) {
          console.log(error)
          rt.action = 'error'
          rt.msg = '信息解析错误'
        }
        if (typeof successCallBack == 'function') {
          successCallBack(rt)
        }
      }
      this.ws.onclose = () => {
        try {
          if(typeof this.failCallBack == 'function'){
            this.failCallBack({ platform: '虎牙', roomId: this.roomId, message: `虎牙房间${this.roomId}弹幕服务器已断开` })
          }
        } catch (error) {
          
        }
      }
    }
  }

  async ping(){
    try {
      this.ws && this.ws.send('ping')
    } catch (error) {
      await this.destroy()
    }
  }

  async destroy() {
    this.ws && this.ws.close()
  }
}