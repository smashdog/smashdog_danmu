<template>
  <div class="main">
    <div class="child">
      <div class="item" v-for="item, k in lists">
        <div class="item-child">
          <div v-if="item.user_title == '系统'">
            <a-tag color="#f50">系统</a-tag>礼物窗口开启
          </div>
          <div v-else>
            <span v-if="this.config.platform.platform || this.config.platform.roomId" class="header">
              <img :src="item.logo" alt="" class="logo" v-if="this.config.platform.platform" align="absmiddle">
              <a-tag color="blue" v-if="this.config.platform.roomId">
                <span>{{ item.roomId }}</span>
              </a-tag>
            </span>
            <img v-if="item.header.length > 0" :src="item.header" alt="" class="logo" align="absmiddle">
            {{ item.user_title }}
            <span v-if="item.gift.noble">
              开通{{ item.gift.title }}{{ item.gift.count }}个{{ item.msg }}
            </span>
            <span v-else>
              赠送{{ item.gift.title }}
              <span v-if="item.gift.hits > 0">x{{ item.platform == '斗鱼' ? item.gift.hits : item.gift.count *
                item.gift.hits }}</span>
              <a-tag color="red" v-if="item.platform != '斗鱼' && item.gift.price > 0">￥{{ item.gift.price }}</a-tag>
            </span>
          </div>
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
    const unlisten = await listen('sync-gift', (event) => {
      if (this.lists.length > 100) {
        this.lists.shift()
      }
      let rt = event.payload, last = this.lists[this.lists.length - 1]
      this.last = last
      switch (rt.platform) {
        case '虎牙':
          if (this.lists.length > 0 && last.user_title == rt.user_title && last.gift.title == rt.gift.title && rt.gift.count == last.gift.count && rt.gift.hits > last.gift.hits) {
            this.lists[this.lists.length - 1] = rt
          } else {
            this.lists.push(rt)
          }
          break
        default:
          if (this.lists.length > 0 && last.user_title == rt.user_title && last.gift.title == rt.gift.title && rt.gift.hits > last.gift.hits) {
            this.lists[this.lists.length - 1] = rt
          } else {
            this.lists.push(rt)
          }
      }
    })
    let win = WebviewWindow.getByLabel('window-gift')
    const unlisten1 = await listen('configchange', async (event) => {
      try {
        this.config = JSON.parse(localStorage.getItem('config'))
        if (this.config.backgroundColor) {
          document.body.style.backgroundColor = this.config.backgroundColor
        }
      } catch (error) {

      }
    })
    const unlistenall = await listen('unliste-gift', (event) => {
      unlisten()
      unlisten1()
      unlistenall()
    })
    win.once('tauri://close-requested', async () => {
      // let position = await win.innerPosition()
      // let size = await win.innerSize()
      // localStorage.setItem('gift-position', JSON.stringify(position))
      // localStorage.setItem('gift-size', JSON.stringify(size))
      unlisten()
      unlisten1()
      unlistenall()
      emit(`subwindow-close`, { type: 'gift' })
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
      last: {},
      config: {},
    }
  },
}
</script>
<style lang="less">
@import url('./assets/subwindow.less');
</style>
