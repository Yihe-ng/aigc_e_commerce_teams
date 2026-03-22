// scripts/migrate-page.js

const fs = require('fs')
const path = require('path')

// 获取项目根目录 (frontend 的上一级)
const PROJECT_ROOT = path.resolve(__dirname, '..')

// 工具函数：将文件名转换为 PascalCase
function toPascalCase(str) {
  return str
    .replace(/\.html$/, '')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

// 1. 定义页面映射
const PAGES_TO_MIGRATE = {
  // 用户数据看板
  'dashboard.html': {
    route: '/dashboard',
    type: 'dashboard',
    description: '用户数据看板'
  },
  
  // 程序员数据看板
  'dashboard_internal.html': {
    route: '/dashboard/internal',
    type: 'dashboard',
    description: '程序员数据看板'
  },
  
  // 商品管理
  'product_management.html': {
    route: '/products',
    type: 'features',
    description: '商品管理'
  },
  
  // 商品营销
  'product_marketing.html': {
    route: '/products/marketing',
    type: 'features',
    description: '商品营销'
  },
  
  // 客户分析
  'customer_analysis.html': {
    route: '/customers',
    type: 'features',
    description: '客户分析'
  },
  
  // 营销笔记
  'note.html': {
    route: '/notes',
    type: 'features',
    description: '营销笔记'
  },
  
  // 营销日程
  'calendar.html': {
    route: '/calendar',
    type: 'features',
    description: '营销日程'
  },
  
  // 设置
  'setting.html': {
    route: '/settings',
    type: 'features',
    description: '设置'
  },
  
  // 配置
  'config.html': {
    route: '/config',
    type: 'features',
    description: '配置'
  },
  
  // 基础表格
  'basic-table.html': {
    route: '/tables/basic',
    type: 'features',
    description: '基础表格'
  },
  
  // 测试页面
  'test1.html': {
    route: '/test/1',
    type: 'features',
    description: '测试页面1'
  },
  'test2.html': {
    route: '/test/2',
    type: 'features',
    description: '测试页面2'
  },
  'test3.html': {
    route: '/test/3',
    type: 'features',
    description: '测试页面3'
  },
  
  // 错误页面
  '404.html': {
    route: '/404',
    type: 'errors',
    description: '页面未找到'
  },
  '500.html': {
    route: '/500',
    type: 'errors',
    description: '服务器错误'
  }
}

// 2. 读取模板文件
function migratePage(templateFile, pageInfo) {
  const GUI_DIR = path.join(PROJECT_ROOT, 'gui', 'templates')
  const NEXTJS_DIR = path.join(PROJECT_ROOT, 'frontend', 'app')
  const SCRIPTS_DIR = path.join(__dirname, 'scripts')
  
  // 确保 scripts 目录存在
  if (!fs.existsSync(SCRIPTS_DIR)) {
    fs.mkdirSync(SCRIPTS_DIR, { recursive: true })
  }
  
  // 读取 GUI 模板
  const templatePath = path.join(GUI_DIR, templateFile)
  const content = fs.readFileSync(templatePath, 'utf-8')
  
  // 3. 创建 Next.js 目录
  let pageDir
  if (pageInfo.type === 'dashboard') {
    pageDir = path.join(NEXTJS_DIR, '(dashboard)', ...pageInfo.route.split('/').filter(Boolean))
  } else {
    pageDir = path.join(NEXTJS_DIR, '(features)', ...pageInfo.route.split('/').filter(Boolean))
  }
  
  fs.mkdirSync(pageDir, { recursive: true })
  
  // 4. 读取页面模板
  const pageTemplatePath = path.join(__dirname, 'scripts', 'page-template.txt')
  const templateContent = fs.readFileSync(pageTemplatePath, 'utf-8')
  
  // 5. 替换占位符
  const componentName = toPascalCase(templateFile)
  const componentCode = templateContent
    .replace(/{{PAGE_NAME}}/g, componentName)
    .replace(/{{PAGE_TITLE}}/g, pageInfo.description)
  
  // 6. 保存文件
  const pageFilePath = path.join(pageDir, 'page.tsx')
  fs.writeFileSync(pageFilePath, componentCode, 'utf-8')
  
  console.log(`✓ 迁移页面: ${templateFile} -> ${pageInfo.route}`)
}

// 7. 运行迁移
console.log('开始迁移页面...')
console.log('====================')

let successCount = 0
let failCount = 0

for (const [templateFile, pageInfo] of Object.entries(PAGES_TO_MIGRATE)) {
  try {
    migratePage(templateFile, pageInfo)
    successCount++
  } catch (error) {
    console.error(`✗ 迁移失败: ${templateFile}`, error.message)
    failCount++
  }
}

console.log('====================')
console.log(`迁移完成！成功: ${successCount} 个，失败: ${failCount} 个`)