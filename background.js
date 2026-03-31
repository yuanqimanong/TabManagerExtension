// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openTabs' && message.urls) {
    // 启动异步延时打开函数
    openTabsWithDelay(message.urls);
    // 告知 popup 消息已收到
    sendResponse({ status: 'started' });
  }
  return true; // 保持通信通道打开
});

// 异步函数：带有 0.2s 延迟的循环
async function openTabsWithDelay(urls) {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      // active: false 意味着在后台打开新标签页，不会突然跳转打断用户
      await chrome.tabs.create({ url: url, active: false });
    } catch (error) {
      console.warn(`无法打开 URL: ${url}`, error);
    }
    
    // 如果不是最后一个链接，则等待 0.2 秒 (200 毫秒)
    if (i < urls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
}