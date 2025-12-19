// src/constants/templates.js

export const DOC_TEMPLATES = [
  {
    id: 'blank',
    name: '空白文档',
    icon: 'FilePlus', // 对应 Lucide 图标名
    description: '从零开始创建一个新文档',
    content: '' // 空字符串
  },

  {
    id: 'weekly_report',
    name: '工作周报',
    icon: 'Calendar',
    description: '包含本周进展、下周计划和问题反馈',
    // 这是一个简单的 TipTap JSON 结构
    content: JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '📅 工作周报' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '本周进展' }] },
        { type: 'bulletList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '完成任务 A' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '跟进项目 B' }] }] }
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '下周计划' }] },
        { type: 'paragraph' }
      ]
    })
  },
  
  {
    id: 'meeting_notes',
    name: '会议纪要',
    icon: 'Users',
    description: '记录参会人、会议主题和决议项',
    content: JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '📝 会议纪要' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '时间：2025年X月X日' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '参会人：' }] },
        { type: 'horizontalRule' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '会议议题' }] },
        { type: 'orderedList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '议题一' }] }] }
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '结论与行动' }] },
        { type: 'taskList', content: [
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '@某人 跟进此事' }] }] }
        ]}
      ]
    })
  }
];