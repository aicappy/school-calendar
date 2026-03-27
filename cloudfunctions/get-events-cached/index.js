// 云函数：带缓存的活动查询
'use strict';
exports.main = async (event, context) => {
	const db = uniCloud.database();
	const cacheKey = `events_${event.section}_${event.year}_${event.month}`;
	const cacheDuration = 5 * 60 * 1000; // 5分钟缓存
	
	// 尝试从缓存获取
	const cache = await uniCloud.redis.get(cacheKey);
	if (cache) {
		return JSON.parse(cache);
	}
	
	// 查询数据库
	let query = db.collection('events');
	
	if (event.section) {
		query = query.where({ section: event.section });
	}
	
	const startTime = new Date(event.year, event.month - 1, 1).getTime();
	const endTime = new Date(event.year, event.month, 1).getTime();
	
	query = query.where({
		dateTime: db.command.gte(startTime).and(db.command.lt(endTime))
	});
	
	const result = await query.get();
	
	// 存入缓存
	await uniCloud.redis.setex(cacheKey, cacheDuration / 1000, JSON.stringify(result.data));
	
	return result.data;
};
