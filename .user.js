// ==UserScript==
// @name         MOOC 测验分数本地解锁 (非商业开源版)
// @namespace    https://github.com/你的用户名/mooc-score-unlocker
// @version      1.0.0
// @description  自动拦截 MOOC 测验接口，在本地强行显示被锁定的真实分数。仅供学习交流，严禁用于商业用途或违规刷课。
// @author       你的名字/ID
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

    // 1. 备份浏览器原生的 fetch 请求
    const originalFetch = window.fetch;
    
    // 2. 劫持 fetch 请求进行“旁听”
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        const url = args[0] instanceof Request ? args[0].url : args[0];

        // 3. 只要发现请求了获取测验信息的接口
        if (url && url.includes('mocQuizRpcBean.getQuizInfo.rpc')) {
            response.clone().json().then(data => {
                let foundScore = null;

                // 4. 递归遍历返回的数据，精准寻找分数
                function findScore(obj) {
                    for (let key in obj) {
                        // 只要键名是 finalScore 或 score，且是数字，就抓取
                        if ((key === 'finalScore' || key === 'score') && typeof obj[key] === 'number') {
                            foundScore = obj[key];
                        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                            findScore(obj[key]);
                        }
                    }
                }
                findScore(data);

                // 5. 如果找到了分数，替换页面的显示
                if (foundScore !== null) {
                    console.log(`%c [MOOC Helper] 成功提取分数：${foundScore}`, 'color: white; background: #28a745; padding: 3px; border-radius: 3px;');
                    
                    // 延迟执行，确保原生网页已经渲染出“解锁得分情况”这个节点
                    setTimeout(() => {
                        const spanElement = document.querySelector('.j-triggerLockScore');
                        if (spanElement) {
                            // 将文字替换为红色加粗的分数，并且去除原本锁的背景图
                            spanElement.innerHTML = `<span style="color:#e74c3c; font-weight:900; font-size:18px;">${foundScore}</span>`;
                            spanElement.style.background = 'none';
                            spanElement.className = ''; 
                        }
                    }, 1000); 
                }
            }).catch(e => {
                // 静默处理解析错误，不影响网页正常使用
            });
        }
        return response;
    };
})();
