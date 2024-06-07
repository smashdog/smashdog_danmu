<template>
  <div class="item-child" v-if="item.action == 'msg' || item.action == 'share' || item.action == 'like'">
    <span v-if="config.platform.platform || config.platform.roomId" class="header">
      <img :src="item.logo" alt="" class="logo" v-if="config.platform.platform" align="absmiddle">
      <a-tag color="blue" v-if="config.platform.roomId">
        <span>{{ item.roomId }}</span>
      </a-tag>
    </span>
    <a-tag color="blue" v-if="item.fans_level > 0 && config.platform.fans" class="header">
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
    <span v-if="config.platform.platform || config.platform.roomId" class="header">
      <img :src="item.logo" alt="" class="logo" v-if="config.platform.platform" align="absmiddle">
      <a-tag color="blue" v-if="config.platform.roomId">
        <span>{{ item.roomId }}</span>
      </a-tag>
    </span>
    <img v-if="item.header.length > 0" :src="item.header" alt="" class="logo" align="absmiddle">
    <span>{{ item.user_title }}</span>
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
    <span v-if="config.platform.platform || config.platform.roomId" class="header">
      <img :src="item.logo" alt="" class="logo" v-if="config.platform.platform" align="absmiddle">
      <a-tag color="blue" v-if="config.platform.roomId">
        <span>{{ item.roomId }}</span>
      </a-tag>
    </span>
    <a-tag color="blue" v-if="item.noble_level > 0">
      {{ item.noble_title }}:{{ item.noble_level }}
    </a-tag>
    <img v-if="item.header.length > 0" :src="item.header" alt="" class="logo" align="absmiddle">
    <span>{{ item.user_title }}进入了直播间</span>
  </div>
</template>

<script>
export default {
  created() {
  },
  name: 'msg',
  data() {
    return {
    }
  },
  props: {
    item: {},
    config: {},
  },
}
</script>