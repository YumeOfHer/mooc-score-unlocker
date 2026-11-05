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

(async function() {
    console.log("====== 🎯 开始精准重放请求 ======");

    // 1. 从 URL 的 Hash (#) 部分精准提取测验 ID (tid) 和 答题记录 ID (targetAid)
    // 这种方式可以避免受到 URL 中问号后面其他无关参数的干扰
    const hash = window.location.hash;
    const match = hash.match(/id=(\d+)&aid=(\d+)/);
    
    // 如果当前页面地址栏的 Hash 里没有匹配到这两个核心参数，则提示并终止执行
    if (!match) {
        console.log("❌ 网址里没找到 id 和 aid，请确认当前是在答题页面。");
        return;
    }
    
    // 提取正则匹配到的参数
    const tid = match[1];
    const targetAid = match[2];
    console.log(`✅ 动态获取参数: tid=${tid}, targetAid=${targetAid}`);

    // 2. 从浏览器的性能资源记录（内存缓存）中，查找刚刚页面真实发出的那个接口请求
    // 这样做的目的是为了直接“白嫖”浏览器自动生成的最精准的 csrfKey，无需自己伪造
    const resources = performance.getEntriesByType("resource");
    const realRequest = resources.find(item => item.name.includes('mocQuizRpcBean.getQuizInfo.rpc'));
    
    // 如果缓存里没有找到该请求，说明页面可能还没发出请求，提示用户刷新页面数据
    if (!realRequest) {
        console.log("❌ 没找到请求缓存，请随便点一下页面刷新数据后再运行。");
        return;
    }
    // 提取包含完整 csrfKey 的真实请求 URL
    const realUrl = realRequest.name;

    try {
        // 3. 发起请求（严格按照抓包成功的 JSON 结构进行构造）
        const response = await fetch(realUrl, {
            method: "POST", // 接口要求必须用 POST
            headers: {
                "Content-Type": "application/json;charset=UTF-8",
                // 提取 URL 中的 csrfKey，作为 edu-script-token 发送
                "edu-script-token": new URL(realUrl).searchParams.get('csrfKey'),
                "nonce": "1001", // 系统常量
                "system": "v1"   // 系统常量
            },
            credentials: "include", // 核心凭证：强制让浏览器带上当前账号的 Cookie
            // 构造请求体，将提取到的 tid 和 targetAid 转为数字类型传入
            body: JSON.stringify({
                "tid": Number(tid),
                "targetAid": Number(targetAid),
                "isDraft": false,
                "isNeedAuth": true
            })
        });

        // 将返回的数据解析为 JSON 格式
        const data = await response.json();
        
        // 4. 解析数据并显示（注意：实际接口返回的是 targetAnswerform，首字母小写）
        if (data && data.result && data.result.targetAnswerform) {
            // 提取分数、总分以及答卷人 ID
            const score = data.result.targetAnswerform.finalScore;
            const total = data.result.targetAnswerform.totalScore;
            const answererId = data.result.targetAnswerform.answererId;
            
            // 在控制台打印高亮的结果，并删除了“模拟”二字
            console.log(`%c 🎉 请求成功！最终得分：${score} / ${total}`, "color: white; background: #28a745; padding: 5px; font-size: 18px;");
            console.log(`👤 当前返回的答卷人 ID: ${answererId} (核对一下是不是你自己的)`);
            
            // 查找页面上显示“解锁得分情况”的那个 span 元素
            const spanElement = document.querySelector('.j-triggerLockScore');
            if (spanElement) {
                // 如果找到了，就把里面替换成红色的真实分数
                spanElement.innerHTML = `<span style="color:red; font-weight:900; font-size:18px;">${score}</span>`;
                // 去掉那个“锁”的背景图
                spanElement.style.background = 'none';
                // 清除可能干扰显示的类名
                spanElement.className = ''; 
            }
        } else {
            // 如果接口通了但没拿到目标数据，打印返回的结构以便排查
            console.log("❌ 接口通了，但没提取到分数。返回数据：", data);
        }

    } catch (error) {
        // 捕获并打印网络请求过程中的任何错误
        console.error("❌ 请求失败：", error);
    }
})();
