<template>
	<view class="container">
		<!-- Poster Image -->
		<image v-if="event.imageUrl" :src="event.imageUrl" class="poster" mode="aspectFit"></image>
		
		<!-- Event Info -->
		<view class="event-content">
			<text class="title">{{ event.title }}</text>
			
			<view class="info-row">
				<text class="label">📅 日期</text>
				<text class="value">{{ formatDate(event.dateTime) }}</text>
			</view>
			
			<view class="info-row" v-if="event.location">
				<text class="label">📍 地点</text>
				<text class="value">{{ event.location }}</text>
			</view>
			
			<view class="description">
				<text class="desc-label">活动介绍</text>
				<text class="desc-text">{{ event.description }}</text>
			</view>
			
			<!-- Action Buttons -->
			<view class="action-buttons">
				<button class="action-btn share-btn" open-type="share">
					📤 分享微信群
				</button>
				<button class="action-btn moments-btn" @click="shareToMoments">
					📸 分享朋友圈
				</button>
			</view>
			
			<!-- Admin Controls -->
			<view v-if="isAdmin" class="admin-controls">
				<button class="edit-btn" @click="editEvent">✏️ 编辑</button>
				<button class="delete-btn" @click="deleteEvent">🗑️ 删除</button>
			</view>
			
			<!-- Remind Button -->
			<button class="remind-btn" @click="setRemind">
				🔔 {{ isRemindSet ? '已设置提醒' : '设置提醒' }}
			</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			event: {},
			isRemindSet: false,
			isAdmin: false
		}
	},
	onLoad(options) {
		if (options.id) {
			this.loadEvent(options.id);
		}
		this.checkAdmin();
	},
	onShareAppMessage() {
		return {
			title: this.event.title,
			path: `/pages/event-detail/event-detail?id=${this.event._id}`,
			imageUrl: this.event.imageUrl
		}
	},
	methods: {
		checkAdmin() {
			const user = uni.getStorageSync('userInfo');
			this.isAdmin = user && user.role === 'admin';
		},
		loadEvent(id) {
			const db = uniCloud.database();
			db.collection('events').doc(id).get().then(res => {
				this.event = res.result.data[0];
			});
		},
		formatDate(dateTime) {
			const date = new Date(dateTime);
			return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
		},
		editEvent() {
			uni.navigateTo({
				url: `/pages/create-event/create-event?id=${this.event._id}`
			});
		},
		deleteEvent() {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这个活动吗？',
				success: (res) => {
					if (res.confirm) {
						const db = uniCloud.database();
						db.collection('events').doc(this.event._id).remove().then(() => {
							uni.showToast({ title: '已删除', icon: 'success' });
							setTimeout(() => {
								uni.switchTab({ url: '/pages/index/index' });
							}, 1500);
						});
					}
				}
			});
		},
		setRemind() {
			if (this.isRemindSet) return;
			
			uni.requestSubscribeMessage({
				tmplIds: ['YOUR_TEMPLATE_ID'],
				success: (res) => {
					const db = uniCloud.database();
					db.collection('reminders').add({
						eventId: this.event._id,
						userId: uni.getStorageSync('userInfo')._id,
						remindTime: new Date(this.event.dateTime).getTime() - 3600000
					}).then(() => {
						this.isRemindSet = true;
						uni.showToast({ title: '提醒已设置', icon: 'success' });
					});
				}
			});
		},
		shareToMoments() {
			uni.showToast({ 
				title: '请使用小程序右上角分享',
				icon: 'none'
			});
		}
	}
}
</script>

<style>
.container {
	min-height: 100vh;
	background: #f5f5f5;
}

.poster {
	width: 100%;
	height: 300px;
	background: white;
}

.event-content {
	background: white;
	margin-top: -20px;
	border-radius: 20px 20px 0 0;
	padding: 20px;
	min-height: 400px;
}

.title {
	font-size: 22px;
	font-weight: bold;
	display: block;
	margin-bottom: 20px;
}

.info-row {
	display: flex;
	justify-content: space-between;
	padding: 12px 0;
	border-bottom: 1px solid #f0f0f0;
}

.label {
	color: #999;
}

.value {
	font-weight: 500;
}

.description {
	margin-top: 20px;
}

.desc-label {
	font-size: 14px;
	color: #999;
	display: block;
	margin-bottom: 10px;
}

.desc-text {
	font-size: 15px;
	line-height: 1.6;
	color: #333;
	display: block;
}

.remind-btn {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border: none;
	border-radius: 25px;
	padding: 12px;
	margin-top: 15px;
	font-size: 15px;
	width: 45%;
}

.action-buttons {
	display: flex;
	justify-content: space-between;
	margin-top: 20px;
}

.action-btn {
	width: 45%;
	padding: 12px;
	border-radius: 25px;
	font-size: 14px;
	border: none;
}

.share-btn {
	background: #07c160;
	color: white;
}

.moments-btn {
	background: #ffcf00;
	color: #333;
}

.admin-controls {
	display: flex;
	justify-content: space-between;
	margin-top: 20px;
}

.edit-btn, .delete-btn {
	width: 48%;
	padding: 12px;
	border-radius: 25px;
	font-size: 14px;
	border: none;
}

.edit-btn {
	background: #667eea;
	color: white;
}

.delete-btn {
	background: #f44336;
	color: white;
}
</style>
