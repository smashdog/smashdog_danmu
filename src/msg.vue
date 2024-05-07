<template>
  <div class="main">
    <div class="child">
      <div class="item" v-for="item in lists">
        <div v-if="item.user_title == '系统'">
          <a-tag color="#f50">系统</a-tag>弹幕窗口开启
        </div>
        <div class="item-child" v-else>
          <span v-if="this.config.platform.platform || this.config.platform.roomId" class="header">
            <img :src="item.logo" alt="" class="logo" v-if="this.config.platform.platform" align="absmiddle">
            <a-tag color="blue" v-if="this.config.platform.roomId">
              <span>{{ item.roomId }}</span>
            </a-tag>
          </span>
          <a-tag color="blue" v-if="item.fans_level > 0 && this.config.platform.fans" class="header">
            {{item.fans_title}}:{{ item.fans_level }}
          </a-tag>
          <a-tag color="red" v-if="item.noble_level > 0">
            贵
          </a-tag>
          <img v-if="item.header.length > 0" :src="item.header" alt="" class="logo" align="absmiddle">
          <span>
            {{ item.user_title }}：
          </span>
          <span v-html="item.msg"></span>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { webset } from './libs/webset'
import { listen, emit } from '@tauri-apps/api/event'
import { WebviewWindow } from '@tauri-apps/api/window'

export default {
  async created() {
    if(localStorage.getItem('config')){
      this.config = JSON.parse(localStorage.getItem('config'))
    }
    this.lists.push({
      platform: '',
      roomId: '',
      user_title: '系统',
      gift:{
        title: '',
        count: 0,
        hits: 0,
        price: 0,
        noble: false
      },
    })
    const unlisten = await listen('sync-msg', (event) => {
      try {
        let rt = event.payload
        if(this.config.danmu == 0 || (this.config.danmu == 1 && rt.user_level > 0)){
          this.lists.push(rt)
          if(this.lists.length > 100){
            this.lists.shift()
          }
        }
      } catch (error) {
        
      }
    })
    const unlisten1 = await listen('sync-share', (event) => {
      try {
        let rt = event.payload
        rt.msg = '分享了直播间'
        this.lists.push(rt)
        if(this.lists.length > 50){
          this.lists.shift()
        }
      } catch (error) {
        
      }
    })
    const unlisten2 = await listen('sync-like', (event) => {
      try {
        let rt = event.payload
        rt.msg = '点赞了直播间'
        this.lists.push(rt)
        if(this.lists.length > 50){
          this.lists.shift()
        }
      } catch (error) {
        
      }
    })
    const unlisten3 = await listen('configchange', (event) => {
      try {
        this.config = JSON.parse(localStorage.getItem('config'))
      } catch (error) {
        
      }
    })
    const unlistenall = await listen('unlisten-msg', (event) => {
      unlisten()
      unlisten1()
      unlisten2()
      unlisten3()
      unlistenall()
    })
    let win = WebviewWindow.getByLabel('window-msg')
    win.once('tauri://close-requested', async () => {
      let position = await win.innerPosition()
      let size = await win.innerSize()
      localStorage.setItem('msg-position', JSON.stringify(position))
      localStorage.setItem('msg-size', JSON.stringify(size))
      unlistenall()
      emit(`subwindow-close`, {type: 'msg'})
      await win.close()
    })
  },
  mounted() {
    if(!import.meta.env.VITE_DEBUG) {webset()}
  },
  data() {
    return {
      lists: [],
      display_platform: true,
      config:{}
    }
  },
}
</script>
<style lang="less">
span{
  display: inline-block;
}
body,div{
  margin: 0;
  padding: 0;
}
.main{
  width: 100%;
  display: flex;
  height: 100vh;
}
.child{
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  overflow-y: scroll;
  margin: 10px 5px;
}
.item{
  width: 100%;
  line-height: 20px;
}
/* 定义整个滚动条的样式 */
::-webkit-scrollbar {
    width: 0; /* 滚动条宽度 */
}
img.logo{
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 5px;
  margin: 0;
  padding: 0;
}
</style>
