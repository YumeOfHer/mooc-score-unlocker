# 慕课分数解锁器 (MOOC Score Unlocker)

仅供学习交流的中国大学MOOC（icourse163）测验分数本地解锁脚本。

## 📖 简介
这是一个基于 Tampermonkey（油猴）的用户脚本。用于在中国大学MOOC的测验页面中，绕过前端页面的视觉隐藏（“解锁得分情况”），直接展示服务器已经下发到本地的真实分数。

## ⚠️ 免责声明 (免责必看)
1. **非商业性质**：本项目完全免费，仅供前端技术学习与交流，**严禁用于任何商业用途**。
2. **安全说明**：本脚本仅做浏览器本地的“视觉还原”，**不修改服务器端任何数据**，不提供自动答题功能。它只是把你交卷后本该看到但被前端隐藏的分数显示出来。
3. **风险自负**：请合理使用，遵守平台用户协议。因滥用（如配合第三方工具违规刷课）导致的账号被限制或封禁，与本项目作者无关。

## 🚀 安装与使用
1. 在你的浏览器（Chrome / Edge / Firefox）中安装 [Tampermonkey 插件](https://www.tampermonkey.net/)。
2. **点击下方链接一键安装本脚本**（或者直接把 `.user.js` 文件拖入浏览器）：
   👉 **[点击这里安装脚本](https://raw.githubusercontent.com/YumeOfHer/mooc-score-unlocker/refs/heads/main/.user.js)** 👈
3. 打开中国大学MOOC的测验结果页面，刷新页面即可看到真实分数。

## 🛠️ 原理说明
脚本通过重写浏览器的 `window.fetch` 方法，监听 `mocQuizRpcBean.getQuizInfo.rpc` 接口的响应。当服务器返回包含分数的 JSON 数据时，脚本会自动提取数据，并用 DOM 操作替换页面上原本的占位符。

## 📄 开源协议
本项目采用 [MIT License](LICENSE) 协议开源。
