// 提示信息小工具
function showStatus(message, isError = false) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#ef4444' : '#10b981';
  setTimeout(() => { statusEl.textContent = ''; }, 3000);
}

// 导出功能
document.getElementById('exportBtn').addEventListener('click', async () => {
  try {
    // 获取当前窗口的所有标签页
    const tabs = await chrome.tabs.query({ currentWindow: true });
    
    // 确保顺序是从左到右
    tabs.sort((a, b) => a.index - b.index);

    let content = '';
    for (const tab of tabs) {
      // 获取标题并去除可能存在的换行符，防止破坏格式
      const title = tab.title ? tab.title.replace(/\n|\r/g, '') : '无标题';
      const url = tab.url;
      // 按照要求的格式拼接
      content += `${url},,,${title}\n`;
    }

    // 生成 txt 文件 Blob 
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const fileUrl = URL.createObjectURL(blob);

    // 调用 Chrome 下载 API 触发保存弹窗 (saveAs: true)
    chrome.downloads.download({
      url: fileUrl,
      filename: 'tabs_export.txt',
      saveAs: true
    }, () => {
      showStatus('准备导出！请选择保存位置。');
      // 清理内存
      setTimeout(() => URL.revokeObjectURL(fileUrl), 10000);
    });
  } catch (error) {
    console.error(error);
    showStatus('导出失败！', true);
  }
});

// 导入功能
document.getElementById('importFile').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const lines = text.split('\n');
    const urlsToOpen = [];

    // 解析文件，提取 url
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        // 以 ,,, 作为分隔符拆分
        const parts = trimmed.split(',,,');
        if (parts.length > 0 && parts[0]) {
          urlsToOpen.push(parts[0].trim());
        }
      }
    }

    if (urlsToOpen.length > 0) {
      // 将 URL 数组发送给后台 Service Worker 处理
      // 以防止 popup 关闭导致定时器中断
      chrome.runtime.sendMessage({
        action: 'openTabs',
        urls: urlsToOpen
      });
      showStatus(`后台正在排队打开 ${urlsToOpen.length} 个页面...`);
    } else {
      showStatus('文件中未找到有效链接！', true);
    }
  };
  
  reader.readAsText(file);
  // 清空 value 允许重复导入同一文件
  event.target.value = ''; 
});