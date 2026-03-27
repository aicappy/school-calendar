<template>
	<view class="container">
		<view class="header">
			<text class="title">⚙️ 管理面板</text>
		</view>
		
		<view class="section">
			<text class="section-title">👥 用户管理</text>
			<view class="user-list">
				<view v-for="user in users" :key="user._id" class="user-item">
					<image :src="user.avatar" class="avatar"></image>
					<view class="user-info">
						<text class="nickname">{{ user.nickname }}</text>
						<text class="role">{{ user.role === 'admin' ? '管理员' : '家长' }}</text>
					</view>
					<button v-if="isSuperAdmin" class="role-btn" @click="toggleRole(user)">
						{{ user.role === 'admin' ? '取消管理员' : '设为管理员' }}
					</button>
				</view>
			</view>
		</view>
		
		<view class="section">
			<text class="section-title">📊 数据统计</text>
			<view class="stats">
				<view class="stat-item">
					<text class="stat-num">{{ eventCount }}</text>
					<text class="stat-label">活动数</text>
				</view>
				<view class="stat-item">
					<text class="stat-num">{{ userCount }}</text>
					<text class="stat-label">用户数</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			users: [],
			eventCount: 0,
			userCount: 0,
			isSuperAdmin: false
		}
	},
	onShow() {
		this.loadData();
	},
	methods: {
		loadData() {
			const user = uni.getStorageSync('userInfo');
			this.isSuperAdmin = user && user.role === 'super_admin';
			
			const db = uniCloud.database();
			
			// Load users
			db.collection('users').get().then(res => {
				this.users = res.result.data;
				this.userCount = res.result.data.length;
			});
			
			// Load events count
			db.collection('events').count().then(res => {
				this.eventCount = res.result.total;
			});
		},
		toggleRole(user) {
			const db = uniCloud.database();
			const newRole = user.role === 'admin' ? 'parent' : 'admin';
			
			db.collection('users').doc(user._id).update({
				role: newRole
			}).then(() => {
				uni.showToast({ title: '已更新', icon: 'success' });
				this.loadData();
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

.header {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 20px;
}

.title {
	color: white;
	font-size: 20px;
	font-weight: bold;
}

.section {
	background: white;
	margin: 15px;
	border-radius: 12px;
	padding: 15px;
}

.section-title {
	font-size: 16px;
	font-weight: bold;
	display: block;
	margin-bottom: 15px;
}

.user-item {
	display: flex;
	align-items: center;
	padding: 10px 0;
	border-bottom: 1px solid #f0f0f0;
}

.avatar {
	width: 50px;
	height: 50px;
	border-radius: 25px;
	margin-right: 12px;
}

.user-info {
	flex: 1;
}

.nickname {
	font-size: 15px;
	font-weight: 500;
	display: block;
}

.role {
	font-size: 13px;
	color: #999;
}

.role-btn {
	background: #667eea;
	color: white;
	border: none;
	border-radius: 15px;
	padding: 5px 12px;
	font-size: 12px;
}

.stats {
	display: flex;
	justify-content: space-around;
}

.stat-item {
	text-align: center;
}

.stat-num {
	font-size: 30px;
	font-weight: bold;
	color: #667eea;
	display: block;
}

.stat-label {
	font-size: 13px;
	color: #999;
}
</style>
