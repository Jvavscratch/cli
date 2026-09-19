#!/usr/bin/env node
// 导入项目启动模块
import './boot';

// 导出cli模块的所有功能
export * from './cli/projectManager';
export * from './cli/treeScan';