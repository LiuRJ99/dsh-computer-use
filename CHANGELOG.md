# Changelog

## [0.1.6-dev.2] - 2026-10-08

### Fixed

- 修复 macOS Chrome 启动后 AppKit 状态未刷新、独立浏览器 profile 复用，以及首个可访问窗口出现前的捕获失败。使用 RunLoop 等待原生状态通知，并为每次独立浏览器启动生成新 profile。
