# 心情过客的弹幕工具介绍
简单易用的弹幕工具，目前支持斗鱼、虎牙、bilibili，虎牙和bilibili使用的是开发者平台，斗鱼使用的直接解析ws。

# 程序架构
基础框架使用的是[tauri](https://tauri.app/)，前端底层是[vue3+vite](https://cn.vuejs.org/)，前端框架使用的是[ant-design-vue](https://antdv.com/docs/vue/introduce-cn)

bilibi的开放平台申请地址 [bilibili直播开放平台](https://open-live.bilibili.com/open-manage)

虎牙的开放平台申请地址 [虎牙平台开放平台](https://dev.huya.com/)

这两个平台申请都容易通过，bilibili需要一点时间审核，虎牙基本上一申请就过了，然后把密钥填到项目的根目录的.env.local和.env.production.local文件中

# 配置根目录的.env.development.local和.env.production.local文件
```env
# bilibili配置
# 哔哩哔哩appkey
VITE_BILIBILI_APP_KEY=
# 哔哩哔哩appsecret
VITE_BILIBILI_APP_SECRET=
# 哔哩哔哩appid
VITE_BILIBILI_APP_ID=

# 虎牙配置
# 虎牙appid
VITE_HUYA_APP_ID=
# 虎牙appsecret
VITE_HUYA_APP_SECRET=
```
# 开发命令
```
npm run tauri dev
```

# 打包命令
```
npm run tauri build
```
