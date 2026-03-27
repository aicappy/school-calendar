# 🏫 家校日历小程序

家校活动管理小程序，用于学校家委会管理活动日历。

## 功能

- 📅 **日历视图** - 查看每月活动
- 📝 **发布活动** - 文字或海报图片
- 🔔 **活动提醒** - 微信通知

## 开发

### 技术栈
- Uni-app (Vue.js)
- 微信云开发

### 本地开发

1. 下载 HBuilderX
2. 导入项目
3. 关联微信小程序 AppID
4. 开通云开发
5. 导入数据库 schema

### 云数据库

```json
{
  "events": {
    "title": "活动标题",
    "description": "活动描述", 
    "imageUrl": "海报图片",
    "dateTime": "活动时间",
    "location": "活动地点",
    "remindBefore": "提前提醒分钟数"
  },
  "reminders": {
    "eventId": "活动ID",
    "userId": "用户ID", 
    "remindTime": "提醒时间"
  }
}
```

## 部署

1. HBuilderX → 发行 → 微信小程序
2. 登录微信公众平台提交审核
3. 审核通过后发布

## 目录

```
├── app.json           # 小程序配置
├── pages/
│   ├── index/        # 日历首页
│   ├── event-detail/  # 活动详情
│   └── create-event/ # 发布活动
└── cloudfunctions/    # 云函数
```
