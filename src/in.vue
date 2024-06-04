<template>
  <div class="main">
    <div class="child">
      <div class="item" v-for="item in lists">
        <div v-if="item.user_title == '系统'">
          <a-tag color="#f50">系统</a-tag>进场窗口开启
        </div>
        <div class="item-child" v-else>
          <span v-if="this.config.platform.platform || this.config.platform.roomId" class="header">
            <img :src="item.logo" alt="" class="logo" v-if="this.config.platform.platform" align="absmiddle">
            <a-tag color="blue" v-if="this.config.platform.roomId">
              <span>{{ item.roomId }}</span>
            </a-tag>
          </span>
          <a-tag color="blue" v-if="item.noble_level > 0">
            {{ item.noble_title }}:{{ item.noble_level }}
          </a-tag>
          <img v-if="item.header.length > 0" :src="item.header" alt="" class="logo" align="absmiddle">
          {{item.user_title}}进入了直播间
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { listen, emit } from '@tauri-apps/api/event'
import { webset } from './libs/webset'
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
      }
    })
    const unlisten = await listen('sync-in', (event) => {
      try {
        let rt = event.payload
        this.lists.push(rt)
        if(this.lists.length > 100){
          this.lists.shift()
        }
      } catch (error) {
        
      }
    })
    let win = WebviewWindow.getByLabel('window-in')
    const unlisten1 = await listen('configchange', async (event) => {
      try {
        this.config = JSON.parse(localStorage.getItem('config'))
        if(this.config.backgroundColor){
          document.body.style.backgroundColor = this.config.backgroundColor
        }
      } catch (error) {
        
      }
    })
    const unlistenall = await listen('unlisten-in', (event) => {
      unlisten()
      unlisten1()
      unlistenall()
    })
    win.once('tauri://close-requested', async () => {
      let position = await win.innerPosition()
      let size = await win.innerSize()
      localStorage.setItem('in-position', JSON.stringify(position))
      localStorage.setItem('in-size', JSON.stringify(size))
      unlistenall()
      emit(`subwindow-close`, {type: 'in'})
      await win.close()
    })
  },
  mounted() {
    if(!import.meta.env.VITE_DEBUG) {webset()}
    if(this.config.backgroundColor){
      document.body.style.backgroundColor = this.config.backgroundColor
    }
  },
  data() {
    return {
      lists: [],
      config: {},
    }
  },
}
</script>
<style>
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
