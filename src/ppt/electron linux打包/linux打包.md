---
marp: true
---

# Linux 打包适配

分享者：齐云江

---

# 目录

- WHY
- deb 打包
- 自动升级
- arm64 适配
- 其他问题

---

# WHY

Linux 桌面操作系统的用户越来越多，一部分是使用 Debian、Ubuntu 的开发者、科研人员、爱好者等；另一部分是使用麒麟 OS 和 UOS 这些国产操作系统的党政、国防、教育等领域的用户。支持 Linux 系统可以扩大用户群并提升我们的影响力。

云笔记基于 Electron 开发，而 Electron 就支持 Linux 打包，所以可以直接复用现有的代码，只需要进行一些打包适配。

---

# deb 打包

electron-builder --linux deb

---

![](./title-icon.jpg)

---

![](./title-icon-code.jpg)

---

# 自动升级

1. electron-updater 不支持 deb 的自动升级；[why？](https://stackoverflow.com/a/38137655)
2. 自主开发脚本生成 deb 包的 latest-linux.yml；[e.g.](https://g.hz.netease.com/cowork/web/ynote/ynote-desktop/-/blob/develop/scripts/updateinfo-deb.js)
3. 模仿 electron-updater 的 [API](https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/src/AppUpdater.ts#L33) 开发一个 linux-updater，整合到自动升级流程；只做了检查更新，引导用户到官网下载页自行下载并重装。

---

# arm64 适配

- fpm 问题 [issue](https://github.com/electron-userland/electron-builder/issues/5154)

```
sudo apt-get install ruby-full
sudo gem install fpm
```

```
USE_SYSTEM_FPM=true electron-builder --arm64 --linux deb
```

- UOS 打包 [how?](https://www.vvave.net/archives/how-to-build-a-debian-series-distros-installation-package.html)

```
sudo apt install dh-make fakeroot build-essential
```

编写自动化脚本：[e.g.](https://g.hz.netease.com/cowork/web/ynote/ynote-desktop/-/blob/develop/scripts/rebuild-uos.js)

```
USE_SYSTEM_FPM=true electron-builder --dir --arm64 --linux
node scripts/rebuild-uos.js
```

---

# 其他问题

- npm install 权限问题

```
npm set unsafe-perm true
```

- Electron 镜像加速

```
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
export ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
```

- arm64 麒麟 OS 安装后，创建快捷方式，图标不显示

```
"desktop": { Icon: "/opt/有道云笔记/resources/build/icon.svg" }
```

- Running as root without --no-sandbox is not supported [issue](https://stackoverflow.com/a/60471688)

```
"executableArgs": [ "--no-sandbox" ]
```

<!-- --- -->

<!-- # 总结

Electron 打包过程中还遇到过很多很多的问题，通过不断去 Google、去 Github 上搜 issue，看源码，冷静分析和耐心尝试之后，一定可以找到那个最适合的答案。 -->

---

# THANKS
