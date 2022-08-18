# monitoring-tool
关于 一个轻量级的，可扩展的前端监控工具

## 上手


将 monitoring-tool 添加到项目中主要有以下方式：

#### 方法一：使用 npm（推荐）

```bash
$ npm install vconsole
```

Import 并初始化后，即可使用。

```javascript
import monitoringTool from 'monitoring-tool';

new monitoringTool({
    secret: '', // 密钥 必填
});
```

#### 方法二：使用 CDN 直接插入到 HTML

```html
<script src="https://unpkg.com/monitoring-tool@latest/lib/monitoring-tool.min.js"></script>
<script>
  // monitoringTool 默认会挂载到 `window.monitoringTool` 上
new window.monitoringTool({
    secret: '', // 密钥 必填
});
</script>
```

可用的 CDN：

- https://unpkg.com/monitoring-tool@latest/lib/monitoring-tool.min.js
- https://cdn.jsdelivr.net/npm/monitoring-tool@latest/lib/monitoring-tool.min.js

---