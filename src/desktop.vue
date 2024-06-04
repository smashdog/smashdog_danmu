<template>
  <div class="main">
    <div class="child">
      <div class="item" v-for="item in lists">
        <div class="item-child" v-if="item.action == 'msg' || item.action == 'share' || item.action == 'like'">
          <span v-if="this.config.platform.platform || this.config.platform.roomId" class="header">
            <img :src="item.logo" alt="" class="logo" v-if="this.config.platform.platform" align="absmiddle">
            <a-tag color="blue" v-if="this.config.platform.roomId">
              <span>{{ item.roomId }}</span>
            </a-tag>
          </span>
          <a-tag color="blue" v-if="item.fans_level > 0 && this.config.platform.fans" class="header">
            {{ item.fans_title }}:{{ item.fans_level }}
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
        <div class="item-child" v-else-if="item.action == 'gift'">
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
        <div class="item-child" v-else-if="item.action == 'in'">
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
          <span>{{ item.user_title }}进入了直播间</span>
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
    const unlisten = await listen('sync-msg', (event) => {
      try {
        let rt = event.payload
        if (this.config.danmu == 0 || (this.config.danmu == 1 && rt.user_level > 0)) {
          this.pushArray(rt)
        }
      } catch (error) {

      }
    })
    const unlisten1 = await listen('sync-share', (event) => {
      try {
        let rt = event.payload
        rt.msg = '分享了直播间'
        this.pushArray(rt)
      } catch (error) {

      }
    })
    const unlisten2 = await listen('sync-like', (event) => {
      try {
        let rt = event.payload
        rt.msg = '点赞了直播间'
        this.pushArray(rt)
      } catch (error) {

      }
    })
    const win = WebviewWindow.getByLabel('window-desktop')
    const unlisten3 = await listen('configchange', async (event) => {
      try {
        this.config = JSON.parse(localStorage.getItem('config'))
        if (this.config.backgroundColor) {
          document.body.style.backgroundColor = this.config.backgroundColor
        }
      } catch (error) {

      }
    })
    const unlisten4 = await listen('sync-gift', (event) => {
      if (this.lists.length > 8) {
        this.lists.shift()
      }
      let rt = event.payload, last = this.lists[this.lists.length - 1]
      this.last = last
      switch (rt.platform) {
        case '虎牙':
          if (this.lists.length > 0 && last.user_title == rt.user_title && last.gift.title == rt.gift.title && rt.gift.count == last.gift.count && rt.gift.hits > last.gift.hits) {
            this.lists[this.lists.length - 1] = rt
          } else {
            this.pushArray(rt)
          }
          break
        default:
          if (this.lists.length > 0 && last.user_title == rt.user_title && last.gift.title == rt.gift.title && rt.gift.hits > last.gift.hits) {
            this.lists[this.lists.length - 1] = rt
          } else {
            this.pushArray(rt)
          }
      }
    })
    const unlisten5 = await listen('sync-in', (event) => {
      try {
        let rt = event.payload
        this.pushArray(rt)
      } catch (error) {

      }
    })
    const unlistenall = await listen('unlisten-msg', (event) => {
      unlisten()
      unlisten1()
      unlisten2()
      unlisten3()
      unlisten4()
      unlisten5()
      unlistenall()
    })
    win.once('tauri://close-requested', async () => {
      unlisten()
      unlisten1()
      unlisten2()
      unlisten3()
      unlisten4()
      unlisten5()
      unlistenall()
      emit(`subwindow-close`, { type: 'desktop' })
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
  methods: {
    pushArray(rt) {
      this.lists.push(rt)
      if (this.lists.length > 8) {
        this.lists.shift()
      }
    }
  }
}
</script>
<style lang="less">
@import url('./assets/subwindow.less');
</style>
