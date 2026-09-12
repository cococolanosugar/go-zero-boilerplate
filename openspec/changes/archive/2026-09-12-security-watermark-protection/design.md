# Design: 全站防截屏安全水印系统设计

## 1. 整体架构与渲染流转

```text
[ CurrentUser Profile & Settings ]
             │
             ▼
   [ app.tsx: layout() ]
   ├─ 计算 displayName 与 username
   ├─ 检测 isDark 动态匹配 font.color
   └─ 输出 waterMarkProps:
        - content: [
            "${displayName} (@${username})",
            "${APP_NAME} · 内部机密 严禁外传"
          ]
        - gap: [140, 140]
        - rotate: -22
             │
             ▼
   [ ProLayout (Ant Design Watermark) ]
   └─ 页面全局平铺网格渲染

[ BasicLayout: SettingDrawer ]
   └─ drawerProps.footer:
        ├─ Switch: 全站防截屏水印 (settings.watermark)
        └─ Switch: 多标签页导航 (settings.tabsLayout)
```

## 2. 状态管理与广播机制
- 通过 `useLayoutSettings()` 获取并更新 `watermark` 字段；
- 底层联动 `SafeStorage` 与 `broadcastSessionEvent("THEME_CHANGE", merged)`，保证同浏览器跨 Tab 标签页实时同步。
