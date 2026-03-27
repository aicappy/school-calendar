// 云函数：分页获取活动列表
'use strict';
exports.main = async (event, context) => {
	const db = uniCloud.database();
	const { 
		page = 1, 
		pageSize = 20, 
		section, 
		grades = [],
		category 
	} = event;
	
	// 构建查询条件
	let query = db.collection('events').skip((page - 1) * pageSize).limit(pageSize).orderBy('dateTime', 'asc');
	
	const conditions = {};
	
	if (section) {
		conditions.section = section;
	}
	
	if (category) {
		conditions.category = category;
	}
	
	if (grades && grades.length > 0 && !grades.includes('全校')) {
		// 复杂查询：匹配年级
		// 这里简化处理，实际可以用 aggregate
	}
	
	if (Object.keys(conditions).length > 0) {
		query = query.where(conditions);
	}
	
	// 获取数据
	const listResult = await query.get();
	
	// 获取总数（用于分页）
	const countResult = await db.collection('events').count();
	
	return {
		list: listResult.data,
		total: countResult.total,
		page,
		pageSize,
		totalPages: Math.ceil(countResult.total / pageSize)
	};
};
