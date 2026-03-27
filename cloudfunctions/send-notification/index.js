// 云函数：批量发送通知（避免超时）
'use strict';
exports.main = async (event, context) => {
	const db = uniCloud.database();
	const { eventId, title, dateTime, grades } = event;
	
	// 获取需要通知的家长
	const parents = await db.collection('users').where({
		role: 'parent',
		subscribe: true
	}).get();
	
	// 过滤相关年级
	const targetParents = parents.data.filter(p => {
		const pGrades = p.grades || [];
		return grades.includes('全校') || 
			   grades.some(g => pGrades.some(pg => pg.grade === g));
	});
	
	// 分批处理（每批100条）
	const batchSize = 100;
	const results = { success: 0, failed: 0 };
	
	for (let i = 0; i < targetParents.length; i += batchSize) {
		const batch = targetParents.slice(i, i + batchSize);
		
		// 并行发送（但限制并发）
		const promises = batch.slice(0, 10).map(async (user) => {
			try {
				await uniCloud.openapi().subscribeMessage.send({
					touser: user.openid,
					templateId: process.env.TEMPLATE_ID,
					page: `/pages/event-detail/event-detail?id=${eventId}`,
					data: {
						thing1: { value: title },
						time2: { value: new Date(dateTime).toLocaleString() },
						thing3: { value: grades.join(', ') }
					}
				});
				results.success++;
			} catch (e) {
				results.failed++;
			}
		});
		
		await Promise.all(promises);
		
		// 等待1秒再处理下一批
		await new Promise(resolve => setTimeout(resolve, 1000));
	}
	
	return results;
};
