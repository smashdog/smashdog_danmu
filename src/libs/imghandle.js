import { fetch as httpFetch, Body, ResponseType } from '@tauri-apps/api/http'

export async function imghandle(rt) {
  if(rt.platform == '斗鱼'){
    rt.header = `https://apic.douyucdn.cn/upload/${rt.header}_middle.jpg`
  }
  if(rt.platform == 'bilibili'){
    console.log(1)
    let res = await httpFetch(url, {
      method: 'GET',
      responseType: ResponseType.Binary
    })
    console.log(2)
    if (res.status == 200) {
      let base64String = '';
      for (let i = 0; i < res.data.length; i++) {
        base64String += String.fromCharCode(res.data[i]);
      }
      base64String = btoa(base64String);
      rt.header = 'data:image/png;base64,' + base64String
    } else {
      rt.header = ''
    }
    res = null
  }
  return rt
}