// ==UserScript==
// @name         MOOC 测验分数本地解锁
// @namespace    https://github.com/YumeOfHer/mooc-score-unlocker
// @version      1.0.0
// @description  自动拦截 MOOC 测验接口，在本地强行显示被锁定的真实分数。仅供学习交流，严禁用于商业用途或违规刷课。
// @author       YumeOfHer
// @match        *://*.icourse163.org/learn/*
// @grant        none
// @run-at       document-start
// @license      MIT
// ==/UserScript==

/* 
 * ⚠️ 免责声明 (Disclaimer)
 * 本脚本仅供个人学习、交流及前端技术研究使用。
 * 脚本仅从浏览器本地缓存中提取并展示原本就下发给你的数据，不包含任何篡改服务器数据、自动化答题或破解付费内容的功能。
 * 请勿将本脚本用于任何商业用途。使用本脚本产生的一切风险及后果由使用者自行承担，作者不对因使用本脚本造成的任何账号异常或损失负责。
 */

(function() {
    'use strict';

    console.log("[MOOC 解锁插件] 已注入页面，正在静默监听成绩接口...");

    // 保存原生的 fetch 方法，确保不影响页面原本的正常请求
    const originalFetch = window.fetch;

    // 重写 fetch 方法，充当“中间人”
    window.fetch = async function(...args) {
        // 让浏览器先发起正常的网络请求
        const response = await originalFetch.apply(this, args);
        
        // 提取请求的 URL
        const url = args[0] instanceof Request ? args[0].url : args[0];

        // 🎯 精准定位查分接口
        if (url && url.includes('mocQuizRpcBean.getQuizInfo.rpc')) {
            console.log("%c [MOOC 解锁插件] 成功捕获查分接口！", "color: #17a2b8; font-weight: bold;");
            
            // 克隆一份响应，避免干扰页面正常的业务逻辑
            response.clone().json().then(data => {
                // 解析数据，根据前文抓包，真实结构在 result.targetAnswerform (注意是小写 f)
                if (data && data.result && data.result.targetAnswerform) {
                    const form = data.result.targetAnswerform;
                    const score = form.finalScore; 
                    const total = form.totalScore;
                    
                    // 判断服务器是否下发了分数
                    if (score !== undefined && score !== null) {
                        console.log(`%c [MOOC 解锁插件] 截获真实分数：${score} / ${total}`, "color: white; background: #28a745; padding: 4px; border-radius: 4px; font-size: 14px;");
                        
                        // 开始替换页面文字，设置轮询等待页面渲染出那个锁
                        let count = 0;
                        const interval = setInterval(() => {
                            const spanElement = document.querySelector('.j-triggerLockScore');
                            if (spanElement) {
                                // 替换文字
                                spanElement.innerHTML = `<span style="color: #e74c3c; font-weight: 900; font-size: 18px;">${score}</span>`;
                                // 去除原本用于遮挡的背景图或样式
                                spanElement.style.background = 'none';
                                spanElement.className = ''; // 移除遮罩类名
                                
                                console.log("[MOOC 解锁插件] 页面显示替换成功！");
                                clearInterval(interval); // 成功后就停止轮询
                            }
                            
                            // 最多轮询 5 秒，防止死循环
                            if (count++ > 50) clearInterval(interval);
                        }, 100);
                    }
                }
            }).catch(e => {
                // 忽略解析错误，保持静默
            });
        }
        
        // 返回原生结果，不破坏页面本身的运行
        return response;
    };
})();
