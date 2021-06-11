# 系统设置

## 电脑防火墙需要开放端口 2012，20120，2018，8080 以保证正常的远程连接

# PS

#### Storage and theme in config.js (under UserDB) should depend on file location.

#### The theme location should contain themes

#### The storage location respond to the first data folder.

#### Remember you need create two data folder before start.

#### If you wanna develop this project.You'd better install the webpack whose version is 3 .You can text this code in command:   ```npm install webpack@3.9.1 -g```



# 软件打包
```bash
/**
* first
* 先在安装 /software/nsis-3.0b2-setup.exe
* 
* then
* 将AccessControl.zip 解压
* 将 Contrib 和 Docs 文件夹放到 nsis 根目录
* 将 Plugins/AccessControl.dll 文件放到 Plugins/x86-ansi 文件夹下
* 将 Unicode/Plugins/AccessControl.dll 文件放到 Plugins/x86-unicode 文件夹下
* 
* 以上步骤不用再操作，直接进行最后一步
* 
*/

npm run build
```

# 数据不同机器端同步
```bash
// 服务端启动命令
npm run sync:server

// 客户端启动命令
npm run sync

// 同步程序会根据客户端的文件变化，自动传送到服务端
```

# 录音设置
1. 鼠标右键右下角的喇叭图标，选择声音
1. 在弹出的对话框里先选择录音，在列表框里右键，选择显示禁用的设备，启用立体声混响（stereo Mix），并将其设为默认设备
1. 右键麦克风（你要用的麦克风，比如我的Microphone Array）选择属性，点击监听选项卡，将监听此设备打✔，在下面播放设备中选择电脑的默认播放设备，点击确定（此项操作需要录制用户说话的时候选择，而且只能设置一个麦克风，此麦克风必须为降噪和可消除回音的麦克风，不然会产生很强的回音和噪音）
1. 在弹出的对话框里选择播放，将电脑的默认声卡设为默认设备


# 安装包相关操作 setup.nsi.bak
```
!insertmacro MUI_PAGE_INSTFILES // 在此添加下面代码，安装完成后是否打开程序

!define MUI_FINISHPAGE_RUN "$INSTDIR\arcap.exe"
!define MUI_FINISHPAGE_RUN_PARAMETERS "open"
```