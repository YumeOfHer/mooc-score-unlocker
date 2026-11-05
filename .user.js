// ==UserScript==
// @name         MOOC 测验分数本地解锁 (修复时序版)
// @namespace    https://github.com/YumeOfHer/mooc-score-unlocker
// @version      1.1.0
// @description  自动拦截 MOOC 测验接口，在本地强行显示被锁定的真实分数。修复了因页面加载顺序导致的找不到缓存问题。仅供学习交流，严禁用于商业用途或违规刷课。
// @author       YumeOfHer
// @match        *://*.icourse163.org/learn/*
// @grant        none
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

/* 
 * ⚠️ 免责声明 (Disclaimer)
 * 本脚本仅供个人学习、交流及前端技术研究使用。
 * 脚本仅从浏览器本地缓存中提取并展示原本就下发给你的数据，不包含任何篡改服务器数据、自动化答题或破解付费内容的功能。
 * 请勿将本脚本用于任何商业用途。使用本脚本产生的一切风险及后果由使用者自行承担，作者不对因使用本脚本造成的任何账号异常或损失负责。
 */

(async function() {
    console.log("====== 🎯 开始精准重放请求 ======");

    // 1. 从 URL 的 Hash (#) 部分精准提取测验 ID (tid) 和 答题记录 ID (targetAid)
    const hash = window.location.hash;
    const match = hash.match(/id=(\d+)&aid=(\d+)/);
    
    if (!match) {
        console.log("❌ 网址里没找到 id 和 aid，请确认当前是在答题页面。");
        return;
    }
    
    const tid = match[1];
    const targetAid = match[2];
    console.log(`✅ 动态获取参数: tid=${tid}, targetAid=${targetAid}`);

    // 2. 轮询等待函数（解决 document-idle 时请求还没发出的问题）
    function waitForResource(keyword, timeout = 10000) {
        return new Promise((resolve) => {
            const start = Date.now();
            const timer = setInterval(() => {
                const res = performance.getEntriesByType("resource").find(item => item.name.includes(keyword));
                if (res || Date.now() - start > timeout) {
                    clearInterval(timer);
                    resolve(res);
                }
            }, 200); // 每 200 毫秒找一次
        });
    }

    console.log("⏳ 正在等待页面发出真实请求缓存...");
    const realRequest = await waitForResource('mocQuizRpcBean.getQuizInfo.rpc');
    
    if (!realRequest) {
        console.log("❌ 等待超时，依然没找到请求缓存。请刷新页面重试。");
        return;
    }

    const realUrl = realRequest.name;
    console.log("✅ 成功截获真实请求 URL！");

    try {
        // 3. 发起请求
        const response = await fetch(realUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json;charset=UTF-8",
                "edu-script-token": new URL(realUrl).searchParams.get('csrfKey'),
                "nonce": "1001",
                "system": "v1"
            },
            credentials: "include",
            body: JSON.stringify({
                "tid": Number(tid),
                "targetAid": Number(targetAid),
                "isDraft": false,
                "isNeedAuth": true
            })
        });

        const data = await response.json();
        
        // 4. 解析数据并显示
        if (data && data.result && data.result.targetAnswerform) {
            const score = data.result.targetAnswerform.finalScore;
            const total = data.result.targetAnswerform.totalScore;
            const answererId = data.result.targetAnswerform.answererId;
            
            console.log(`%c 🎉 请求成功！最终得分：${score} / ${total}`, "color: white; background: #28a745; padding: 5px; font-size: 18px;");
            console.log(`👤 当前返回的答卷人 ID: ${answererId} (核对一下是不是你自己的)`);
            
            // 🚨 等待 DOM 渲染后再替换（解决元素还没渲染出来的问题）
            function replaceScore() {
                const spanElement = document.querySelector('.j-triggerLockScore');
                if (spanElement) {
                    spanElement.innerHTML = `<span style="color:red; font-weight:900; font-size:18px;">${score}</span>`;
                    spanElement.style.background = 'none';
                    spanElement.className = ''; 
                    console.log("✅ 页面分数已替换！");
                } else {
                    // 如果没找到，等 500 毫秒再找一次
                    setTimeout(replaceScore, 500);
                }
            }
            replaceScore(); // 开始尝试替换

        } else {
            console.log("❌ 接口通了，但没提取到分数。返回数据：", data);
        }

    } catch (error) {
        console.error("❌ 请求失败：", error);
    }
})();
