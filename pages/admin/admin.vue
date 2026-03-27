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
		
		<view class="section">
			<text class="section-title">🎫 邀请码管理</text>
			<view class="invite-form">
				<input class="invite-input" v-model="newGrade" placeholder="年级，如一年级" />
				<input class="invite-input" v-model="newClass" placeholder="班级，如(1)班" />
				<button class="gen-btn" @click="generateCode">生成邀请码</button>
			</view>
			<view class="code-list">
				<view v-for="code in inviteCodes" :key="code._id" class="code-item">
					<text class="code-grade">{{ code.grade }} {{ code.className }}</text>
					<text class="code-value">{{ code.code }}</text>
					<text :class="['code-status', code.used ? 'used' : 'unused']">
						{{ code.used ? '已用' : '可用' }}
					</text>
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
			schoolId: '',
			schoolName: '',
			isSuperAdmin: false,
			canManageRole: false,
			newGrade: '',
			newClass: '',
			newSchoolName: '',
			inviteCodes: [],
			schools: []
		}
	},
	onShow() {
		this.loadData();
	},
	methods: {
		loadData() {
			const user = uni.getStorageSync('userInfo');
			this.schoolId = user.schoolId || '';
			this.schoolName = user.schoolName || '全部学校';
			this.isSuperAdmin = user && user.role === 'super_admin';
			this.canManageRole = user && (user.role === 'super_admin' || user.role === 'school_admin');
			
			const db = uniCloud.database();
			
			// Load schools (super admin only)
			if (this.isSuperAdmin) {
				db.collection('schools').get().then(res => {
					this.schools = res.result.data;
				});
			}
			
			// Load users
			let userQuery = db.collection('users');
			if (!this.isSuperAdmin && this.schoolId) {
				userQuery = userQuery.where({ schoolId: this.schoolId });
			}
			userQuery.get().then(res => {
				this.users = res.result.data;
				this.userCount = res.result.data.length;
			});
			
			db.collection('events').count().then(res => {
				this.eventCount = res.result.total;
			});
			
			// Load invite codes
			let codeQuery = db.collection('invite_codes');
			if (!this.isSuperAdmin && this.schoolId) {
				codeQuery = codeQuery.where({ schoolId: this.schoolId });
			}
			codeQuery.get().then(res => {
				this.inviteCodes = res.result.data;
			});
		},
		getRoleText(role) {
			const roles = { 'super_admin': '超级管理员', 'school_admin': '学校管理员', 'parent': '家长' };
			return roles[role] || role;
		},
		formatGrades(grades) {
			if (!grades) return '';
			return grades.map(g => `${g.grade}${g.className}`).join(', ');
		},
		toggleRole(user) {
			const db = uniCloud.database();
			const newRole = user.role === 'school_admin' ? 'parent' : 'school_admin';
			
			db.collection('users').doc(user._id).update({
				role: newRole
			}).then(() => {
				uni.showToast({ title: '已更新', icon: 'success' });
				this.loadData();
			});
		},
		addSchool() {
			if (!this.newSchoolName) return;
			const db = uniCloud.database();
			const code = 'SCH' + Date.now().toString().slice(-4);
			
			db.collection('schools').add({
				name: this.newSchoolName,
				code: code,
				createAt: Date.now()
			}).then(() => {
				uni.showToast({ title: '学校已添加', icon: 'success' });
				this.newSchoolName = '';
				this.loadData();
			});
		},
		generateCode() {
			if (!this.newGrade || !this.newClass || !this.schoolId) {
				uni.showToast({ title: '请填写完整信息', icon: 'none' });
				return;
			}
			
			const code = `${this.schoolId.toUpperCase()}${this.newGrade}${this.newClass}${Date.now().toString().slice(-4)}`;
			const db = uniCloud.database();
			
			db.collection('invite_codes').add({
				code: code,
				schoolId: this.schoolId,
				grade: this.newGrade,
				className: this.newClass,
				used: false,
				createAt: Date.now()
			}).then(() => {
				uni.showToast({ title: '邀请码已生成', icon: 'success' });
				this.newGrade = '';
				this.newClass = '';
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

.invite-form {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin-bottom: 15px;
}

.invite-input {
	flex: 1;
	min-width: 120px;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	padding: 10px;
	font-size: 14px;
}

.gen-btn {
	background: #667eea;
	color: white;
	border: none;
	border-radius: 8px;
	padding: 10px 20px;
	font-size: 14px;
}

.code-list {
	margin-top: 10px;
}

.code-item {
	display: flex;
	align-items: center;
	padding: 10px;
	border-bottom: 1px solid #f0f0f0;
}

.code-grade {
	flex: 1;
	font-size: 14px;
}

.code-value {
	font-size: 16px;
	font-weight: bold;
	color: #667eea;
	margin: 0 10px;
	letter-spacing: 2px;
}

.code-status {
	font-size: 12px;
	padding: 3px 8px;
	border-radius: 10px;
}

.code-status.unused {
	background: #e8f5e9;
	color: #4caf50;
}

.code-status.used {
	background: #ffebee;
	color: #f44336;
}
</style>
