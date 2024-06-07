<template>
  <div>
    <div style="margin-bottom: 10px;">
      当前版本<a-tag>{{ version }}</a-tag>
    </div>
    <div>
      <a-form layout="inline" :model="window_show" @finish="() => { }" @finishFailed="() => { }">
        <a-form-item label="弹幕窗口" name="msg">
          <a-switch v-model:checked="window_show.msg" @change="danmuWindow('msg')"></a-switch>
        </a-form-item>
        <a-form-item label="礼物窗口" name="gift">
          <a-switch v-model:checked="window_show.gift" @change="danmuWindow('gift')"></a-switch>
        </a-form-item>
        <a-form-item label="进场窗口" name="in">
          <a-switch v-model:checked="window_show.in" @change="danmuWindow('in')"></a-switch>
        </a-form-item>
        <a-form-item label="合并显示窗口" name="desktop">
          <a-switch v-model:checked="window_show.desktop" @change="danmuWindow('desktop')"></a-switch>
        </a-form-item>
      </a-form>
      <a-form layout="inline" :model="config" @finish="() => { }" @finishFailed="() => { }">
        <a-form-item label="子窗口是否置顶" name="top">
          <a-switch v-model:checked="config.top" @change="setTop()"></a-switch>
        </a-form-item>
        <a-form-item label="子窗口是否显示边框" name="decorations">
          <a-switch v-model:checked="config.decorations" @change="setDecorations()"></a-switch>
        </a-form-item>
        <a-form-item label="子窗口背景色" name="backgroundColor">
          <a-input v-model:value="config.backgroundColor" type="color" @change="changeBackground()" style="width: 50px;" />
        </a-form-item>
      </a-form>
      <a-button type="primary" @click="add()" v-if="list.data.length < 5">添加房间</a-button>
      <a-button type="primary" @click="configShow = true">弹幕配置</a-button>
      <a-popover title="tips">
        <template #content>
          <p>弹幕配置打不开、子窗口看不见时点我</p>
        </template>
        <a-button type="primary" danger @click="reset()">重置配置</a-button>
      </a-popover>
    </div>
    <a-table :columns="list.cloumns" :dataSource="list.data" emptyText="暂无数据" :pagination="false">
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.dataIndex === 'status'">{{ wsStatus[record.platform + record.roomId] ? '已连接' : '未连接'
          }}</template>
        <template v-if="column.dataIndex === 'roomId'">
          {{ record.platform == 'bilibili' ? 'b站key不显示' : record.roomId }}
        </template>
        <template v-if="column.dataIndex === 'action'">
          <a-button type="primary" @click="add(index)" v-if="!wsStatus[record.platform + record.roomId]"
            size="small">编辑</a-button>
          <a-button type="primary" :danger="wsStatus[record.platform + record.roomId] ? true : false"
            @click="connect(record)" size="small">{{ wsStatus[record.platform + record.roomId] ? '断开' : '连接' }}</a-button>
          <a-button danger type="primary" @click="del(index)" v-if="!wsStatus[record.platform + record.roomId]"
            size="small">删除</a-button>
        </template>
      </template>
    </a-table>
    <a-modal v-model:open="open" :title="form.platform.lenth > 0 ? '编辑' : '添加'" @ok="submit()" okText="提交"
      cancelText="取消" ref="formRef" @cancel="addCancel()" width="100%" wrap-class-name="full-modal">
      <a-form :model="form" autocomplete="off" @finish="submit()" @finishFailed="() => { }">
        <a-form-item label="平台" name="platform">
          <a-radio-group v-model:value="form.platform" @change="form.roomId = ''">
            <a-radio v-for="(item, index) in platforms" :value="index">{{ index }}</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item :label="form.platform == 'bilibili' ? '主播身份码' : '房间号'" name="roomId">
          <a-input-password v-if="form.platform == 'bilibili'" v-model:value="form.roomId"
            placeholder="bilibili主播身份码，在开播里可以找到" v-model:visible="form.roomIdDisplay" />
          <a-input v-else v-model:value="form.roomId" placeholder="请输入房间号" />
        </a-form-item>
      </a-form>
    </a-modal>
    <a-modal v-model:open="configShow" title="配置" @ok="configOk()" okText="提交" cancelText="取消" ref="configRef"
      @cancel="configCancel()" width="100%" wrap-class-name="full-modal">
      <a-form :model="config" autocomplete="off" @finish="configOk()" @finishFailed="() => { }">
        <a-form-item label="弹幕设置" name="danmu" class="danmulabel">
          <a-radio-group v-model:value="config.danmu" button-style="solid" size="small">
            <a-radio-button value="0">全部显示</a-radio-button>
            <a-radio-button value="1">等级大于0</a-radio-button>
            <a-radio-button value="2">仅贵族</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <div style="margin-bottom: 24px;">
          <a-checkbox v-model:checked="config.platform.platform">显示平台</a-checkbox>
          <a-checkbox v-model:checked="config.platform.roomId">显示房间号</a-checkbox>
          <a-checkbox v-model:checked="config.platform.fans">显示灯牌</a-checkbox>
          <a-checkbox v-model:checked="config.platform.header">显示头像</a-checkbox>
        </div>
        <a-form-item label="礼物显示" name="gift">
          <a-radio-group v-model:value="config.gift">
            <a-radio value="0">全部</a-radio>
            <a-radio value="1">高价值</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="是否显示点赞(斗鱼没有)" name="like">
          <a-switch v-model:checked="config.like" />
        </a-form-item>
        <a-form-item label="是否显示分享(bilibili没有)" name="share">
          <a-switch v-model:checked="config.share" />
        </a-form-item>
        <a-form-item label="进入直播间用户配置(bilibili没有)" name="in">
          <a-radio-group v-model:value="config.in" button-style="solid" size="small">
            <a-radio-button value="0">全部</a-radio-button>
            <a-radio-button value="1">只显示贵族</a-radio-button>
            <a-radio-button value="2">不显示</a-radio-button>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
<script>
import { WebviewWindow, appWindow, currentMonitor } from '@tauri-apps/api/window'
import { emit } from '@tauri-apps/api/event'
import { Modal, message } from 'ant-design-vue'
import { huya } from './libs/huya'
import { bilibili } from './libs/bilibili'
import { Client as douyu } from './libs/douyu/client'
import { webset } from './libs/webset'
import { getVersion } from '@tauri-apps/api/app'
import { listen } from '@tauri-apps/api/event'
import { fetch as httpFetch, ResponseType } from '@tauri-apps/api/http'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification'

export default {
  async created() {
    this.config = JSON.parse(localStorage.getItem('config'))
    this.version = await getVersion()
    let list = localStorage.getItem('list')
    if (list) {
      this.list.data = JSON.parse(list)
    }
    for(let k in this.window_type){
      this.window_show[k] = localStorage.getItem(`${k}_window_show`) == 'true' ? true : false
      if(this.window_show[k]){
        await this.openwin(k)
        if(k == 'desktop'){
          this.config.desktop = true
        }
      }
    }
    appWindow.once('tauri://close-requested', async () => {
      try {
        // for (let k in this.window_type) {
        //   const temp = WebviewWindow.getByLabel(`window-${k}`)
        //   if(temp){
        //     const position = await temp.innerPosition()
        //     localStorage.setItem(`${k}-position`, JSON.stringify(position))
        //     temp.close()
        //   }
        // }
        for (let k in this.wsTime) {
          clearInterval(this.wsTime[k])
        }
        this.wsTime = {}
        for (let k in this.wsStatus) {
          await this.wsStatus[k]?.destroy()
        }
        this.wsStatus = {}
        unlisten()
        appWindow.close()
      } catch (error) {
        console.error(error)
      }
    })
    const unlisten = await listen('subwindow-close', (event) => {
      localStorage.setItem(`${event.payload.type}_window_show`, 'false')
      this.window_show[event.payload.type] = false
    })
  },
  async mounted() {
    if (!import.meta.env.VITE_DEBUG) {webset()}
  },
  data() {
    return {
      version: '',
      douyu: null,
      window_type: {
        msg: '弹幕窗口',
        gift: '礼物窗口',
        in: '进场窗口',
        desktop: '合并显示窗口',
      },
      window_show: {
        msg: false,
        gift: false,
        in: false,
        desktop: false,
      },
      configShow: false,
      config: {
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
        desktop: false, // 合并显示
      },
      form: {
        roomId: '',
        platform: '',
        status: '',
        roomIdDisplay: false,
      },
      platforms: {
        '虎牙': {
          timeout: 15000,
          logo: 'huya.png'
        },
        'bilibili': {
          timeout: 20000,
          logo: 'bilibili.png'
        },
        '斗鱼': {
          timeout: 45000,
          logo: 'douyu.png'
        }
      },
      open: false,
      list: {
        cloumns: [
          { title: '平台', dataIndex: 'platform', key: 'platform' },
          { title: '房间号', dataIndex: 'roomId', key: 'roomId' },
          { title: '弹幕状态', dataIndex: 'status', key: 'status' },
          { title: '操作', dataIndex: 'action', key: 'action' }
        ],
        data: []
      },
      wsStatus: {},
      wsTime: {},
    }
  },
  methods: {
    async changeBackground(){
      localStorage.setItem('config', JSON.stringify(this.config))
      emit('configchange', {})
    },
    async setTop(){
      localStorage.setItem('config', JSON.stringify(this.config))
      for(let k in this.window_type){
        let temp = WebviewWindow.getByLabel(`window-${k}`)
        if(temp){
          await temp.setAlwaysOnTop(this.config.top ? true : false)
        }
      }
    },
    async setDecorations(){
      localStorage.setItem('config', JSON.stringify(this.config))
      for(let k in this.window_type){
        let temp = WebviewWindow.getByLabel(`window-${k}`)
        if(temp){
          await temp.setDecorations(this.config.decorations ? true : false)
        }
      }
    },
    reset() {
      let modal = Modal.confirm({
        title: '重置配置',
        content: '如果发现配置打不开，一般是更新后一些数据不匹配造成，这时需要重置一下配置，是否确认？',
        okText: '继续',
        cancelText: '取消',
        onOk: () => {
          localStorage.removeItem('config')
          this.config = {
            gift: '0',// 显示礼物 0全部 1收费
            in: '0',// 显示来访 0全部 1贵族 2不显示
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
          }
          localStorage.setItem('msg-position', JSON.stringify({ x: 0, y: 0 }))
          localStorage.setItem('gift-position', JSON.stringify({ x: 0, y: 0 }))
          localStorage.setItem('in-position', JSON.stringify({ x: 0, y: 0 }))
          localStorage.setItem('config', JSON.stringify(this.config))
          emit('configchange', {})
          modal.destroy()
        },
        onCancel: () => {
          modal.destroy()
        }
      })
    },
    async configOk() {
      if (!this.config.gift) {
        message.error('请选择礼物显示')
        return
      }
      if (!this.config.in) {
        message.error('请选择来访显示')
        return
      }
      let source_config = JSON.parse(localStorage.getItem('config'))
      if(source_config.decorations !== this.config.decorations){
        for(let k in this.window_type){
          let temp = WebviewWindow.getByLabel(`window-${k}`)
          if(temp){
            await temp.setDecorations(this.config.decorations ? true : false)
          }
        }
      }
      localStorage.setItem('config', JSON.stringify(this.config))
      emit('configchange', {})
      this.configShow = false
    },
    configCancel() {
      this.configShow = false;
      this.config = JSON.parse(localStorage.getItem('config'))
    },
    submit() {
      if (!this.platforms[this.form.platform]) {
        message.error('请选择平台')
        return
      }
      if (!this.form.roomId) {
        message.error('请填写房间号（bilibili为主播身份码，在开播里可以找到）')
        return
      }
      if (this.list.data.length >= 5) {
        message.error('为了性能考虑，最多只能添加5个房间')
        return
      }
      let list = localStorage.getItem('list') ? JSON.parse(localStorage.getItem('list')) : []
      for(let k = 0; k < list.length; k ++){
        if (typeof this.form.key != 'undefined') {
          if (list[k].platform === this.form.platform && list[k].roomId === this.form.roomId && k !== this.form.key) {
            message.error(`${this.form.platform}房间号${this.form.roomId}已存在`)
            return
          }
        } else {
          if (list[k].platform === this.form.platform && list[k].roomId === this.form.roomId) {
            message.error(`${this.form.platform}房间号${this.form.roomId}已存在`)
            return
          }
        }
      }
      if (typeof this.form.key != 'undefined') {
        this.list.data[this.form.key] = this.form
      } else {
        this.list.data.push(this.form)
      }
      localStorage.setItem('list', JSON.stringify(this.list.data))
      this.form = {
        roomId: '',
        platform: '',
        status: '',
        roomIdDisplay: false,
      }
      if (localStorage.getItem('listSource')) {
        localStorage.removeItem('listSource')
      }
      this.open = false
    },
    async connect(record) {
      if (this.wsStatus[record.platform + record.roomId]) {
        try {
          clearInterval(this.wsTime[record.platform + record.roomId])
          delete (this.wsTime[record.platform + record.roomId])
          await this.wsStatus[record.platform + record.roomId].destroy()
          delete (this.wsStatus[record.platform + record.roomId])
        } catch (error) {

        }
      } else {
        switch (record.platform) {
          case '虎牙':
            this.wsStatus[record.platform + record.roomId] = new huya(record.roomId)
            break;
          case 'bilibili':
            this.wsStatus[record.platform + record.roomId] = new bilibili(record.roomId)
            break;
          case '斗鱼':
            this.wsStatus[record.platform + record.roomId] = new douyu(record.roomId)
            break;
        }
        await this.wsStatus[record.platform + record.roomId].init((data) => {
          if (data) {
            this.addMsg(data)
          }
        }, async (data) => {
          try {
            this.wsTime[data.platform + data.roomId] && clearInterval(this.wsTime[data.platform + data.roomId])
            this.wsTime[data.platform + data.roomId] && delete (this.wsTime[data.platform + data.roomId])
            this.wsStatus[data.platform + data.roomId] && await this.wsStatus[data.platform + data.roomId].destroy()
            this.wsStatus[data.platform + data.roomId] && delete (this.wsStatus[data.platform + data.roomId])
            message.error(data.message)
            let permissionGranted = await isPermissionGranted()
            if (!permissionGranted) {
              const permission = await requestPermission()
              permissionGranted = permission === 'granted'
            }
            if (permissionGranted) {
              sendNotification({ title: '心情过客的弹幕工具提示', body: data.message })
            }
          } catch (error) {

          }
        })
        this.wsTime[record.platform + record.roomId] = setInterval(async () => {
          if (this.wsStatus[record.platform + record.roomId]) {
            await this.wsStatus[record.platform + record.roomId].ping()
          }
        }, this.platforms[record.platform].timeout)
      }
    },
    add(key) {
      if (typeof key != 'undefined') {
        localStorage.setItem('listSource', JSON.stringify(this.list.data[key]))
        this.form = JSON.parse(localStorage.getItem('listSource'))
        this.form.key = key
      }
      this.open = true
    },
    addCancel() {
      this.form = {
        roomId: '',
        platform: '',
        status: '',
        roomIdDisplay: false,
      }
      if (localStorage.getItem('listSource')) {
        localStorage.removeItem('listSource')
      }
      this.open = false
    },
    del(key) {
      if (this.wsTime[this.list.data[key].platform + this.list.data[key].roomId]) {
        clearInterval(this.wsTime[this.list.data[key].platform + this.list.data[key].roomId])
        delete (this.wsTime[this.list.data[key].platform + this.list.data[key].roomId])
      }
      if (this.wsStatus[this.list.data[key].platform + this.list.data[key].roomId]) {
        this.wsStatus[this.list.data[key].platform + this.list.data[key].roomId].close()
        delete (this.wsStatus[this.list.data[key].platform + this.list.data[key].roomId])
      }
      this.list.data.splice(key, 1)
      localStorage.setItem('list', JSON.stringify(this.list.data))
    },
    async danmuWindow(window_type) {
      if(!this.window_show[window_type]){
        await this.closewin(window_type)
      }else{
        await this.openwin(window_type)
      }
    },
    async openwin (window_type) {
      this.window_show[window_type] = true
      localStorage.setItem(`${window_type}_window_show`, 'true')
      const monitor = await currentMonitor()
      let width = 480, height = 515
      // if(localStorage.getItem(`${window_type}-size`)){
      //   const size = JSON.parse(localStorage.getItem(`${window_type}-size`))
      //   if(size.width && size.height){
      //     width = size.width / monitor.scaleFactor
      //     height = size.height / monitor.scaleFactor
      //   }
      // }else
      // if (monitor) {
      //   width = monitor.size.width / monitor.scaleFactor / 4;
      //   height = (monitor.size.height / monitor.scaleFactor - 156 / monitor.scaleFactor) / 2
      // }
      let x = 0, y = 0
      // if(localStorage.getItem(`${window_type}-position`)){
      //   const position = JSON.parse(localStorage.getItem(`${window_type}-position`))
      //   x = position.x / monitor.scaleFactor
      //   y = position.y / monitor.scaleFactor
      // }else{
        switch (window_type) {
          case 'msg':
            x = monitor.size.width / monitor.scaleFactor - width
            break
          case 'gift':
            x = monitor.size.width / monitor.scaleFactor - width
            y = height + 40 / monitor.scaleFactor
            break
          case 'in':
            x = monitor.size.width / monitor.scaleFactor - width * 2
            break
        }
      // }
      new WebviewWindow(`window-${window_type}`, {
        url: `${window_type}.html`,
        title: this.window_type[window_type],
        width: width,
        height: window_type != 'desktop' ? height : 192,
        x: x,
        y: y,
        alwaysOnTop: this.config.top,
        resizable: true,
        decorations: this.config.decorations
      })
    },
    async closewin(type){
      this.window_show[type] = false
      emit(`unlisten-${type}`, {})
      let window_item = WebviewWindow.getByLabel(`window-${type}`)
      localStorage.setItem(`${type}_window_show`, 'false')
      if(window_item){
        const position = await window_item.innerPosition()
        const size = await window_item.innerSize()
        localStorage.setItem(`${type}-position`, JSON.stringify(position))
        localStorage.setItem(`${type}-size`, JSON.stringify(size))
        await window_item.close()
      }
    },
    async addMsg(rt) {
      if (rt.action != 'gift' && rt.action != 'msg' && rt.action != 'in' && rt.action != 'share' && rt.action != 'like') {
        return
      }
      if (rt.action == 'like' && !this.config.like) {
        return
      }
      if (rt.action == 'share' && !this.config.share) {
        return
      }
      if (rt.action == 'gift' && this.config.gift == 1 && rt.gift.price <= 0 && !rt.gift.noble) {
        return
      }
      if (rt.action == 'in' && ((this.config.in == 1 && rt.noble_level <= 0) || this.config.in == 2)) {
        return
      }
      if (rt.action == 'msg' && this.config.msg == 1 && rt.user_level <= 0) {
        return
      }
      if (rt.action == 'msg' && this.config.msg == 2 && rt.noble_level <= 0 && !rt.big) {
        return
      }
      rt.logo = new URL(`./assets/logo/${this.platforms[rt.platform].logo}`, import.meta.url).href
      if(!this.config.platform.header){
        rt.header = ''
      }else{
        if(rt.platform == '斗鱼'){
          rt.header = `https://apic.douyucdn.cn/upload/${rt.header}_middle.jpg`
        }
        if(rt.platform == 'bilibili' && rt.header.length > 0){
          let res = await httpFetch(rt.header, {
            method: 'GET',
            responseType: ResponseType.Binary
          })
          if(res.status == 200){
            let base64String = '';
            for (let i = 0; i < res.data.length; i++) {
              base64String += String.fromCharCode(res.data[i]);
            }
            base64String = btoa(base64String);
            rt.header = 'data:image/png;base64,' + base64String
          }
        }
      }
      if(rt.msg){
        console.log(rt)
      }
      emit(`sync-${rt.action}`, rt)
    },
  },
}
</script>
<style lang="less">
.full-modal {
  .ant-modal {
    max-width: 100%;
    top: 0;
    padding-bottom: 0;
    margin: 0;
  }

  .ant-modal-content {
    display: flex;
    flex-direction: column;
    height: calc(100vh);
  }

  .ant-modal-body {
    flex: 1;
  }
}

.danmulabel {
  margin-bottom: 0;
}
</style>
