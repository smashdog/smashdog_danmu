<template>
  <div class="main">
    <div class="child">
      <div class="item" v-for="item in lists">
        <div v-if="item.user_title == '系统'">
          <a-tag color="#f50">系统</a-tag>进场窗口开启
        </div>
        <msg v-else :config="config" :item="item"></msg>
      </div>
    </div>
  </div>
</template>
<script>
import { listen, emit } from '@tauri-apps/api/event'
import { webset } from './libs/webset'
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
      }
    })
    const unlisten = await listen('sync-in', (event) => {
      try {
        let rt = event.payload
        this.lists.push(rt)
        if (this.lists.length > 100) {
          this.lists.shift()
        }
      } catch (error) {

      }
    })
    let win = WebviewWindow.getByLabel('window-in')
    const unlisten1 = await listen('configchange', async (event) => {
      try {
        this.config = JSON.parse(localStorage.getItem('config'))
        if (this.config.backgroundColor) {
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
      // let position = await win.innerPosition()
      // let size = await win.innerSize()
      // localStorage.setItem('in-position', JSON.stringify(position))
      // localStorage.setItem('in-size', JSON.stringify(size))
      unlisten()
      unlisten1()
      unlistenall()
      emit(`subwindow-close`, { type: 'in' })
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
      config: {},
    }
  },
}
</script>
<style lang="less">
@import url('./assets/subwindow.less');
</style>
