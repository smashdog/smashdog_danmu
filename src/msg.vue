<template>
  <div class="main">
    <div class="child">
      <div class="item" v-for="item in lists">
        <div v-if="item.user_title == '系统'">
          <a-tag color="#f50">系统</a-tag>弹幕窗口开启
        </div>
        <msg v-else :config="config" :item="item"></msg>
      </div>
    </div>
  </div>
</template>
<script>
import { webset } from './libs/webset'
import { listen, emit } from '@tauri-apps/api/event'
import { WebviewWindow } from '@tauri-apps/api/window'
import msg from './components/msg.vue'

export default {
  components:{
    msg
  },
  async created() {
    if (localStorage.getItem('config')) {
      this.config = JSON.parse(localStorage.getItem('config'))
    }
    this.lists.push({
      platform: '',
      roomId: '',
      user_title: '系统',
      gift: {
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
        if (this.config.danmu == 0 || (this.config.danmu == 1 && rt.user_level > 0)) {
          this.lists.push(rt)
          if (this.lists.length > 100) {
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
        if (this.lists.length > 50) {
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
        if (this.lists.length > 50) {
          this.lists.shift()
        }
      } catch (error) {

      }
    })
    let win = WebviewWindow.getByLabel('window-msg')
    const unlisten3 = await listen('configchange', async (event) => {
      try {
        this.config = JSON.parse(localStorage.getItem('config'))
        if (this.config.backgroundColor) {
          document.body.style.backgroundColor = this.config.backgroundColor
        }
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
    win.once('tauri://close-requested', async () => {
      // let position = await win.innerPosition()
      // let size = await win.innerSize()
      // localStorage.setItem('msg-position', JSON.stringify(position))
      // localStorage.setItem('msg-size', JSON.stringify(size))
      unlisten()
      unlisten1()
      unlisten2()
      unlisten3()
      unlistenall()
      emit(`subwindow-close`, { type: 'msg' })
      await win.close()
    })
  },
  mounted() {
    if (!import.meta.env.VITE_DEBUG) { webset() }
    if (this.config.backgroundColor) {
      document.body.style.backgroundColor = this.config.backgroundColor
    }
  },
  data() {
    return {
      lists: [],
      display_platform: true,
      config: {}
    }
  },
}
</script>
<style lang="less">
@import url('./assets/subwindow.less');
</style>
