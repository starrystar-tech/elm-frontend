const PptxGenJS = require('pptxgenjs')

// 创建演示文稿
const pptx = new PptxGenJS()

// 设置演示文稿属性
pptx.author = 'ELM Team'
pptx.company = 'ELM智慧营销管理系统'
pptx.subject = '产品演示'
pptx.title = 'ELM智慧营销管理系统 - 产品演示'

// 定义主题颜色
const THEME_COLOR = '667eea'
const THEME_COLOR_DARK = '764ba2'
const TEXT_COLOR = '333333'
const TEXT_SECONDARY = '666666'

// 封面页
let slide = pptx.addSlide()
slide.background = { color: THEME_COLOR }
slide.addText('ELM智慧营销管理系统', {
  x: 0.5, y: 2.0, w: '90%', h: 1.0,
  fontSize: 44, bold: true, color: 'FFFFFF',
  align: 'center'
})
slide.addText('企业级CRM解决方案', {
  x: 0.5, y: 3.0, w: '90%', h: 0.6,
  fontSize: 24, color: 'FFFFFF',
  align: 'center'
})
// 添加特性标签
const features = ['智能数据分析', 'AI智能助手', '智能外呼中心', '全渠道接入']
features.forEach((text, i) => {
  slide.addText(text, {
    x: 1.5 + (i % 2) * 4, y: 4.2 + Math.floor(i / 2) * 0.8,
    w: 3.5, h: 0.6,
    fontSize: 16, color: 'FFFFFF',
    fill: { color: 'FFFFFF', transparency: 70 },
    align: 'center', valign: 'middle'
  })
})

// 项目概述
slide = pptx.addSlide()
slide.addText('项目概述', {
  x: 0.5, y: 0.3, w: '90%', h: 0.8,
  fontSize: 36, bold: true, color: TEXT_COLOR,
  border: { pt: 2, color: THEME_COLOR, type: 'solid' }
})

// 产品定位卡片
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.5, y: 1.5, w: 4.2, h: 2.2,
  fill: { color: 'F5F7FA' },
  line: { color: 'E0E0E0', width: 1 }
})
slide.addText('产品定位', {
  x: 0.7, y: 1.7, w: 3.8, h: 0.5,
  fontSize: 20, bold: true, color: TEXT_COLOR
})
slide.addText('面向教育培训机构、销售型企业的一站式客户全生命周期管理平台，助力企业数字化转型。', {
  x: 0.7, y: 2.3, w: 3.8, h: 1.2,
  fontSize: 14, color: TEXT_SECONDARY
})

// 核心价值卡片
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 5.0, y: 1.5, w: 4.2, h: 2.2,
  fill: { color: 'F5F7FA' },
  line: { color: 'E0E0E0', width: 1 }
})
slide.addText('核心价值', {
  x: 5.2, y: 1.7, w: 3.8, h: 0.5,
  fontSize: 20, bold: true, color: TEXT_COLOR
})
slide.addText('通过智能化分配引擎、全渠道客户管理、AI驱动的数据分析，提升客户转化率与运营效率。', {
  x: 5.2, y: 2.3, w: 3.8, h: 1.2,
  fontSize: 14, color: TEXT_SECONDARY
})

// 技术架构
slide.addText('技术架构', {
  x: 0.5, y: 4.0, w: '90%', h: 0.5,
  fontSize: 22, bold: true, color: TEXT_COLOR
})
const techStack = ['Vue 3', 'TypeScript', 'Element Plus', 'Spring Boot', 'MySQL', 'FreeSWITCH', 'Docker', 'Nginx']
techStack.forEach((tech, i) => {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.5 + (i % 4) * 2.35, y: 4.6 + Math.floor(i / 4) * 0.6,
    w: 2.2, h: 0.5,
    fill: { color: THEME_COLOR }
  })
  slide.addText(tech, {
    x: 0.5 + (i % 4) * 2.35, y: 4.6 + Math.floor(i / 4) * 0.6,
    w: 2.2, h: 0.5,
    fontSize: 12, color: 'FFFFFF', align: 'center', valign: 'middle'
  })
})

// 核心功能模块
slide = pptx.addSlide()
slide.addText('核心功能模块', {
  x: 0.5, y: 0.3, w: '90%', h: 0.8,
  fontSize: 36, bold: true, color: TEXT_COLOR,
  border: { pt: 2, color: THEME_COLOR, type: 'solid' }
})

// 数据池管理
slide.addText('数据池管理', {
  x: 0.5, y: 1.4, w: '90%', h: 0.5,
  fontSize: 20, bold: true, color: TEXT_COLOR
})
const dataPoolFeatures = [
  '名片查询：全量客户数据管理，支持新增、合并、批量操作',
  '静默数据：智能识别低活跃度客户，支持再次激活',
  '黑名单管理：永久过滤无效数据，避免资源浪费',
  '批量导入：支持Excel批量导入，自动进入分配流程'
]
dataPoolFeatures.forEach((text, i) => {
  slide.addText(text, {
    x: 0.8, y: 2.0 + i * 0.45, w: '85%', h: 0.4,
    fontSize: 14, color: TEXT_COLOR, bullet: { type: 'bullet' }
  })
})

// 客户跟进
slide.addText('客户跟进', {
  x: 0.5, y: 4.0, w: '90%', h: 0.5,
  fontSize: 20, bold: true, color: TEXT_COLOR
})
const followUpFeatures = [
  '公海领取：首咨公海、回访公海、复购公海三池管理',
  '我的客户：客户分层管理，完整跟进记录',
  '订单管理：订单创建、合同签署、支付记录一体化'
]
followUpFeatures.forEach((text, i) => {
  slide.addText(text, {
    x: 0.8, y: 4.5 + i * 0.45, w: '85%', h: 0.4,
    fontSize: 14, color: TEXT_COLOR, bullet: { type: 'bullet' }
  })
})

// 外呼中心
slide = pptx.addSlide()
slide.addText('外呼中心', {
  x: 0.5, y: 0.3, w: '90%', h: 0.8,
  fontSize: 36, bold: true, color: TEXT_COLOR,
  border: { pt: 2, color: THEME_COLOR, type: 'solid' }
})

// 外呼功能卡片
const callFeatures = [
  { title: '话务查询', desc: '完整通话记录查询，支持录音播放、通话统计分析' },
  { title: '话务统计', desc: '多维度通话数据统计，包括通话量、通话时长、接通率等' },
  { title: '外呼监控', desc: '实时监控坐席状态，支持监听、强插、强拆等质检功能' },
  { title: '自动拨号', desc: '批量外呼任务管理，智能拨号策略，提升外呼效率' }
]
callFeatures.forEach((item, i) => {
  const x = 0.5 + (i % 2) * 4.7
  const y = 1.5 + Math.floor(i / 2) * 2.0
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: x, y: y, w: 4.5, h: 1.8,
    fill: { color: 'F5F7FA' },
    line: { color: 'E0E0E0', width: 1 }
  })
  slide.addText(item.title, {
    x: x + 0.2, y: y + 0.2, w: 4.1, h: 0.5,
    fontSize: 18, bold: true, color: TEXT_COLOR
  })
  slide.addText(item.desc, {
    x: x + 0.2, y: y + 0.8, w: 4.1, h: 0.8,
    fontSize: 12, color: TEXT_SECONDARY
  })
})

// 外呼系统优势
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.5, y: 5.5, w: 9.0, h: 1.5,
  fill: { color: THEME_COLOR }
})
slide.addText('外呼系统优势', {
  x: 0.7, y: 5.7, w: 8.6, h: 0.4,
  fontSize: 16, bold: true, color: 'FFFFFF'
})
slide.addText('• 基于FreeSWITCH构建，稳定可靠的通话质量\n• 支持WebSocket实时通讯，低延迟通话控制\n• 完整录音存储，支持合规质检', {
  x: 0.7, y: 6.1, w: 8.6, h: 0.8,
  fontSize: 12, color: 'FFFFFF'
})

// AI能力
slide = pptx.addSlide()
slide.addText('AI能力', {
  x: 0.5, y: 0.3, w: '90%', h: 0.8,
  fontSize: 36, bold: true, color: TEXT_COLOR,
  border: { pt: 2, color: THEME_COLOR, type: 'solid' }
})

// AI功能卡片
const aiFeatures = [
  { title: '智能聊天', desc: '基于大语言模型的智能客服助手，支持多轮对话、意图识别、自动回复' },
  { title: '图片生成', desc: '集成DALL·E 3图像生成能力，一键生成营销素材、产品图片' },
  { title: '写作助手', desc: 'AI驱动的营销文案自动生成，支持公众号文章、短信模板、邮件内容' },
  { title: '知识库', desc: '文档智能检索与问答，支持PDF、Word等多种格式文档解析' }
]
aiFeatures.forEach((item, i) => {
  const x = 0.5 + (i % 2) * 4.7
  const y = 1.5 + Math.floor(i / 2) * 2.0
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: x, y: y, w: 4.5, h: 1.8,
    fill: { color: 'F5F7FA' },
    line: { color: 'E0E0E0', width: 1 }
  })
  slide.addText(item.title, {
    x: x + 0.2, y: y + 0.2, w: 4.1, h: 0.5,
    fontSize: 18, bold: true, color: TEXT_COLOR
  })
  slide.addText(item.desc, {
    x: x + 0.2, y: y + 0.8, w: 4.1, h: 0.8,
    fontSize: 12, color: TEXT_SECONDARY
  })
})

// 数据分析
slide.addText('数据分析', {
  x: 0.5, y: 5.5, w: '90%', h: 0.4,
  fontSize: 18, bold: true, color: TEXT_COLOR
})
const analysisFeatures = ['销售漏斗：可视化转化分析', '业绩统计：多维度业绩报表', '客户画像：360°客户分析', '排行榜：销售业绩排名']
analysisFeatures.forEach((text, i) => {
  slide.addText(text, {
    x: 0.5 + (i % 2) * 4.7, y: 6.0 + Math.floor(i / 2) * 0.4, w: 4.5, h: 0.35,
    fontSize: 12, color: TEXT_COLOR, bullet: { type: 'bullet' }
  })
})

// 智能分配引擎
slide = pptx.addSlide()
slide.addText('智能分配引擎', {
  x: 0.5, y: 0.3, w: '90%', h: 0.8,
  fontSize: 36, bold: true, color: TEXT_COLOR,
  border: { pt: 2, color: THEME_COLOR, type: 'solid' }
})

// 流程图
const flowSteps = ['数据导入/企微同步', '自动分配引擎', '公海领取/自动分配', '客户跟进', '报名转化', '售后工单']
flowSteps.forEach((text, i) => {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 3.5, y: 1.5 + i * 0.8, w: 3.0, h: 0.6,
    fill: { color: THEME_COLOR }
  })
  slide.addText(text, {
    x: 3.5, y: 1.5 + i * 0.8, w: 3.0, h: 0.6,
    fontSize: 12, color: 'FFFFFF', align: 'center', valign: 'middle'
  })
  if (i < flowSteps.length - 1) {
    slide.addText('↓', {
      x: 4.7, y: 2.1 + i * 0.8, w: 0.6, h: 0.3,
      fontSize: 16, color: THEME_COLOR, align: 'center'
    })
  }
})

// 分配规则配置
slide.addText('分配规则配置', {
  x: 7.0, y: 1.5, w: 2.5, h: 0.4,
  fontSize: 16, bold: true, color: TEXT_COLOR
})
const rules = [
  { title: '规则配置', desc: '灵活设置分配规则' },
  { title: '权重分配', desc: '按坐席能力权重分配' },
  { title: '上限控制', desc: '防止坐席过载' },
  { title: '自动回收', desc: '超时自动回收' }
]
rules.forEach((item, i) => {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 7.0, y: 2.0 + i * 1.2, w: 2.5, h: 1.0,
    fill: { color: 'F5F7FA' },
    line: { color: 'E0E0E0', width: 1 }
  })
  slide.addText(item.title, {
    x: 7.1, y: 2.1 + i * 1.2, w: 2.3, h: 0.4,
    fontSize: 14, bold: true, color: TEXT_COLOR
  })
  slide.addText(item.desc, {
    x: 7.1, y: 2.5 + i * 1.2, w: 2.3, h: 0.4,
    fontSize: 11, color: TEXT_SECONDARY
  })
})

// 系统优势
slide = pptx.addSlide()
slide.addText('系统优势', {
  x: 0.5, y: 0.3, w: '90%', h: 0.8,
  fontSize: 36, bold: true, color: TEXT_COLOR,
  border: { pt: 2, color: THEME_COLOR, type: 'solid' }
})

// 技术优势
slide.addText('技术优势', {
  x: 0.5, y: 1.4, w: '90%', h: 0.4,
  fontSize: 20, bold: true, color: TEXT_COLOR
})
const techAdvantages = [
  '前后端分离架构：Vue 3 + Spring Boot，开发效率高',
  '实时通讯：WebSocket实时推送，毫秒级响应',
  '高性能：响应式设计，支持大规模并发',
  '安全可靠：完善的权限控制体系，数据加密传输'
]
techAdvantages.forEach((text, i) => {
  slide.addText(text, {
    x: 0.8, y: 1.9 + i * 0.4, w: '85%', h: 0.35,
    fontSize: 14, color: TEXT_COLOR, bullet: { type: 'bullet' }
  })
})

// 功能优势
slide.addText('功能优势', {
  x: 0.5, y: 3.6, w: '90%', h: 0.4,
  fontSize: 20, bold: true, color: TEXT_COLOR
})
const funcAdvantages = [
  '全链路覆盖：从获客到售后一站式管理',
  '智能化运营：AI驱动的智能客服与数据分析',
  '灵活配置：可自定义分配规则、业务流程',
  '开放集成：支持企业微信、短信、呼叫中心等'
]
funcAdvantages.forEach((text, i) => {
  slide.addText(text, {
    x: 0.8, y: 4.1 + i * 0.4, w: '85%', h: 0.35,
    fontSize: 14, color: TEXT_COLOR, bullet: { type: 'bullet' }
  })
})

// 部署优势
slide.addText('部署优势', {
  x: 0.5, y: 5.8, w: '90%', h: 0.4,
  fontSize: 20, bold: true, color: TEXT_COLOR
})
const deployAdvantages = [
  '容器化部署：Docker一键部署，环境一致性',
  '弹性扩展：支持水平扩展，应对业务增长',
  '高可用：支持集群部署，保障业务连续性'
]
deployAdvantages.forEach((text, i) => {
  slide.addText(text, {
    x: 0.8, y: 6.3 + i * 0.4, w: '85%', h: 0.35,
    fontSize: 14, color: TEXT_COLOR, bullet: { type: 'bullet' }
  })
})

// 典型应用场景
slide = pptx.addSlide()
slide.addText('典型应用场景', {
  x: 0.5, y: 0.3, w: '90%', h: 0.8,
  fontSize: 36, bold: true, color: TEXT_COLOR,
  border: { pt: 2, color: THEME_COLOR, type: 'solid' }
})

// 应用场景卡片
const scenarios = [
  { title: '教育培训', desc: '学员管理、课程销售、售后服务一体化，提升招生转化率和学员留存率。' },
  { title: '金融服务', desc: '客户跟进、产品销售、合规管理，满足金融行业严格的合规要求。' },
  { title: '医疗健康', desc: '患者管理、健康咨询、回访服务，提升患者满意度和复诊率。' },
  { title: '电商零售', desc: '客户运营、复购管理、售后服务，提升客户生命周期价值。' }
]
scenarios.forEach((item, i) => {
  const x = 0.5 + (i % 2) * 4.7
  const y = 1.5 + Math.floor(i / 2) * 2.2
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: x, y: y, w: 4.5, h: 2.0,
    fill: { color: 'F5F7FA' },
    line: { color: 'E0E0E0', width: 1 }
  })
  slide.addText(item.title, {
    x: x + 0.2, y: y + 0.3, w: 4.1, h: 0.5,
    fontSize: 18, bold: true, color: TEXT_COLOR
  })
  slide.addText(item.desc, {
    x: x + 0.2, y: y + 0.9, w: 4.1, h: 0.9,
    fontSize: 12, color: TEXT_SECONDARY
  })
})

// 业务价值
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.5, y: 5.8, w: 9.0, h: 1.2,
  fill: { color: THEME_COLOR }
})
slide.addText('业务价值', {
  x: 0.7, y: 5.95, w: 8.6, h: 0.35,
  fontSize: 16, bold: true, color: 'FFFFFF'
})
slide.addText('提升转化率30% | 降低人力成本20% | 数据驱动决策 | 复购率提升25%', {
  x: 0.7, y: 6.35, w: 8.6, h: 0.5,
  fontSize: 12, color: 'FFFFFF', align: 'center'
})

// 系统演示
slide = pptx.addSlide()
slide.addText('系统演示', {
  x: 0.5, y: 0.3, w: '90%', h: 0.8,
  fontSize: 36, bold: true, color: TEXT_COLOR,
  border: { pt: 2, color: THEME_COLOR, type: 'solid' }
})

// 访问信息
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 2.5, y: 1.5, w: 5.0, h: 1.8,
  fill: { color: 'F0F0F0' },
  line: { color: 'E0E0E0', width: 1 }
})
slide.addText('访问地址', {
  x: 2.7, y: 1.7, w: 4.6, h: 0.4,
  fontSize: 14, color: TEXT_SECONDARY
})
slide.addText('https://elm.bgwa.cn', {
  x: 2.7, y: 2.1, w: 4.6, h: 0.5,
  fontSize: 20, bold: true, color: THEME_COLOR
})
slide.addText('账号: admin  |  密码: lixiaobin8878', {
  x: 2.7, y: 2.6, w: 4.6, h: 0.4,
  fontSize: 14, color: TEXT_SECONDARY
})

// 核心页面
slide.addText('核心页面', {
  x: 0.5, y: 3.6, w: '90%', h: 0.4,
  fontSize: 20, bold: true, color: TEXT_COLOR
})
const pages = [
  { title: '首页仪表盘', desc: '数据概览、快捷操作' },
  { title: '客户列表', desc: '全量客户数据管理' },
  { title: '外呼记录', desc: '通话记录与录音' },
  { title: 'AI助手', desc: '智能客服与内容生成' }
]
pages.forEach((item, i) => {
  const x = 0.5 + (i % 2) * 4.7
  const y = 4.1 + Math.floor(i / 2) * 1.3
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: x, y: y, w: 4.5, h: 1.1,
    fill: { color: 'F5F7FA' },
    line: { color: 'E0E0E0', width: 1 }
  })
  slide.addText(item.title, {
    x: x + 0.2, y: y + 0.15, w: 4.1, h: 0.4,
    fontSize: 16, bold: true, color: TEXT_COLOR
  })
  slide.addText(item.desc, {
    x: x + 0.2, y: y + 0.55, w: 4.1, h: 0.4,
    fontSize: 12, color: TEXT_SECONDARY
  })
})

// 结语
slide = pptx.addSlide()
slide.background = { color: THEME_COLOR }
slide.addText('ELM智慧营销管理系统', {
  x: 0.5, y: 2.0, w: '90%', h: 0.8,
  fontSize: 36, bold: true, color: 'FFFFFF', align: 'center'
})
slide.addText('为企业提供一站式客户管理解决方案\n助力企业数字化转型，提升运营效率与客户价值', {
  x: 0.5, y: 3.0, w: '90%', h: 1.0,
  fontSize: 18, color: 'FFFFFF', align: 'center'
})
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 3.0, y: 4.5, w: 4.0, h: 0.6,
  fill: { color: 'FFFFFF', transparency: 80 }
})
slide.addText('欢迎咨询合作！', {
  x: 3.0, y: 4.5, w: 4.0, h: 0.6,
  fontSize: 20, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle'
})
slide.addText('联系邮箱：contact@elm-crm.com\n服务热线：400-888-8888', {
  x: 0.5, y: 5.5, w: '90%', h: 0.8,
  fontSize: 14, color: 'FFFFFF', align: 'center'
})

// 保存文件
const outputPath = './public/ELM智慧营销管理系统.pptx'
pptx.writeFile({ fileName: outputPath })
  .then(() => {
    console.log(`PPT文件已生成: ${outputPath}`)
  })
  .catch(err => {
    console.error('生成PPT失败:', err)
  })