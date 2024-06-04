import { createApp } from "vue"
import App from "./index.vue"
import CryptoJS from "crypto-js"
import 'ant-design-vue/dist/reset.css'
import { BaseDirectory, writeTextFile, exists, createDir } from '@tauri-apps/api/fs'
import { fetch as httpFetch, Body, ResponseType } from "@tauri-apps/api/http"

// 每次启动更新斗鱼的礼物数据
const gift_file_exist = await exists('gift.json', {dir: BaseDirectory.App})
if(!gift_file_exist){
  const obs = await exists('obs', {dir: BaseDirectory.App})
  if(!obs){
    await createDir('obs', {dir: BaseDirectory.App, recursive: true})
  }
}
let res = await httpFetch(`https://webconf.douyucdn.cn/resource/common/prop_gift_list/prop_gift_config.json`, {
  method: 'GET',
  responseType: ResponseType.Text
})
const start = res.data.indexOf('(') + 1
const end = res.data.lastIndexOf(')')
await writeTextFile('gift.json', JSON.stringify(JSON.parse(res.data.slice(start, end)).data), { dir: BaseDirectory.App })

// 默认配置
if (!localStorage.getItem('list')) {
  localStorage.setItem('list', JSON.stringify([]))
}
if (!localStorage.getItem('config')) {
  localStorage.setItem('config', JSON.stringify({
    gift: '0',// 显示礼物 0全部 1收费
    in: '0',// 显示来访 0全部 1贵族
    top: false,
    like: true,
    danmu: '0',// 显示弹幕 0全部 1有等级用户 2贵族
    share: true, // 显示分享
    platform: {
      roomId: true, // 房间号
      platform: true, // 平台
      fans: true, // 灯牌
    }, // 显示平台
    header: false, // 头像
    backgroundColor: '#00ff00', // 背景色
    decorations: true, // 边框
  }))
}
if(!localStorage.getItem('msg_window_show')){
  localStorage.setItem('msg_window_show', 'false')
}
if(!localStorage.getItem('gift_window_show')){
  localStorage.setItem('gift_window_show', 'false')
}
if(!localStorage.getItem('in_window_show')){
  localStorage.setItem('in_window_show', 'false')
}
if(!localStorage.getItem('desktop_window_show')){
  localStorage.setItem('desktop_window_show', 'false')
}

let app = createApp(App)

app.mount("#app")
