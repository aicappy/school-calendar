// 云函数：检查活动提醒
'use strict';
exports.main = async (event, context) => {
	const db = uniCloud.database();
	const now = Date.now();
	const oneHourLater = now + 3600000;
	
	// 查找需要提醒的活动
	const eventsRes = await db.collection('events').where({
		dateTime: db.command.gte(now),
		dateTime: db.command.lte(oneHourLater)
	}).get();
	
	const events = eventsRes.data;
	
	// 查找设置了提醒的用户
	for (const event of events) {
		const remindersRes = await db.collection('reminders').where({
			eventId: event._id,
			remindTime: db.command.lte(now)
		}).get();
		
		const reminders = remindersRes.data;
		
		for (const reminder of reminders) {
			// 发送订阅消息
			await uniCloud.openapi().subscribeMessage.send({
				touser: reminder.userId,
				templateId: 'YOUR_TEMPLATE_ID',
				page: `/pages/event-detail/event-detail?id=${event._id}`,
				data: {
					thing1: { value: event.title },
					time2: { value: new Date(event.dateTime).toLocaleString() },
					thing3: { value: event.location || '未设置地点' }
				}
			});
			
			// 删除已发送的提醒
			await db.collection('reminders').doc(reminder._id).remove();
		}
	}
	
	return { success: true };
};
