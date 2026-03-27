<template>
	<view class="container">
		<view class="welcome">
			<text class="title">🏫 家校日历</text>
			<text class="subtitle">{{ isParentFlow ? '申请加入班级' : '管理员入口' }}</text>
		</view>
		
		<!-- Parent: Request to Join -->
		<view v-if="isParentFlow && !isLoggedIn" class="login-form">
			<input class="code-input" v-model="inviteCode" placeholder="请输入邀请码" maxlength="20" />
			<input class="code-input" v-model="parentName" placeholder="您的姓名" />
			
			<button class="login-btn" @click="submitJoinRequest">
				📝 提交入群申请
			</button>
			
			<text class="hint">等待年级管理员审批后即可加入</text>
		</view>
		
		<!-- Parent: After submitted -->
		<view v-if="isParentFlow && requestStatus" class="status-view">
			<text v-if="requestStatus === 'pending'" class="status-pending">⏳ 申请已提交，等待审批...</text>
			<text v-if="requestStatus === 'approved'" class="status-approved">✅ 已批准，欢迎加入！</text>
			<text v-if="requestStatus === 'rejected'" class="status-rejected">❌ 申请被拒绝，请联系年级管理员</text>
		</view>
		
		<!-- Admin Login -->
		<view v-if="!isParentFlow" class="admin-section">
			<view class="section-tabs">
				<view :class="['tab', adminTab === 'super' ? 'active' : '']" @click="adminTab = 'super'">超级管理员</view>
				<view :class="['tab', adminTab === 'section' ? 'active' : '']" @click="adminTab = 'section'">学部管理员</view>
				<view :class="['tab', adminTab === 'grade' ? 'active' : '']" @click="adminTab = 'grade'">年级管理员</view>
			</view>
			
			<button class="login-btn admin-btn" @click="adminLogin">
				🔐 管理员登录
			</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			isParentFlow: true,
			isLoggedIn: false,
			requestStatus: '',
			inviteCode: '',
			parentName: '',
			adminTab: 'super'
		}
	},
	onLoad(options) {
		if (options.admin) {
			this.isParentFlow = false;
		}
	},
	methods: {
		submitJoinRequest() {
			const code = this.inviteCode.trim().toUpperCase();
			const name = this.parentName.trim();
			
			if (!code || !name) {
				uni.showToast({ title: '请填写完整', icon: 'none' });
				return;
			}
			
			const db = uniCloud.database();
			const that = this;
			
			// Verify invite code
			db.collection('invite_codes').where({
				code: code,
				status: 'active'
			}).get().then(res => {
				if (res.result.data.length === 0) {
					uni.showToast({ title: '邀请码无效', icon: 'none' });
					return;
				}
				
				const invite = res.result.data[0];
				
				// Get user info
				uni.getUserProfile({
					desc: '用于入群申请',
					success: (userRes) => {
						const userInfo = userRes.userInfo;
						
						// Create join request
						db.collection('join_requests').add({
							nickname: name,
							avatar: userInfo.avatarUrl,
							openid: '{openid}',
							schoolId: invite.schoolId,
							section: invite.section,
							grade: invite.grade,
							className: invite.className,
							status: 'pending',
							createAt: Date.now()
						}).then(() => {
							that.requestStatus = 'pending';
							uni.setStorageSync('userInfo', {
								nickname: name,
								avatar: userInfo.avatarUrl,
								role: 'parent',
								status: 'pending'
							});
							uni.showToast({ title: '申请已提交', icon: 'success' });
						});
					}
				});
			});
		},
		adminLogin() {
			uni.getUserProfile({
				desc: '用于管理员登录',
				success: (res) => {
					const userInfo = res.userInfo;
					const db = uniCloud.database();
					const role = this.adminTab === 'super' ? 'super_admin' : 
								 this.adminTab === 'section' ? 'section_admin' : 'grade_admin';
					
					// Find or create user
					db.collection('users').where({
						openid: '{openid}'
					}).get().then(queryRes => {
						if (queryRes.result.data.length === 0) {
							db.collection('users').add({
								openid: '{openid}',
								nickname: userInfo.nickName,
								avatar: userInfo.avatarUrl,
								role: role,
								createAt: Date.now()
							});
						} else {
							db.collection('users').where({
								openid: '{openid}'
							}).update({ role: role });
						}
						
						userInfo.role = role;
						uni.setStorageSync('userInfo', userInfo);
						uni.switchTab({ url: '/pages/index/index' });
					});
				}
			});
		}
	}
}
</script>

<style>
.container { min-height: 100vh; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; }
.welcome { text-align: center; margin-bottom: 40px; }
.title { font-size: 32px; font-weight: bold; color: white; display: block; }
.subtitle { font-size: 16px; color: rgba(255,255,255,0.8); margin-top: 10px; display: block; }
.login-form { width: 100%; }
.code-input { background: white; border-radius: 30px; padding: 15px 20px; font-size: 16px; margin-bottom: 15px; }
.login-btn { background: white; color: #667eea; border: none; border-radius: 30px; padding: 15px; font-size: 16px; font-weight: bold; width: 100%; }
.hint { color: rgba(255,255,255,0.7); font-size: 13px; display: block; margin-top: 20px; text-align: center; }
.admin-section { width: 100%; }
.section-tabs { display: flex; margin-bottom: 20px; }
.tab { flex: 1; text-align: center; padding: 10px; color: rgba(255,255,255,0.7); border-bottom: 2px solid transparent; }
.tab.active { color: white; border-bottom-color: white; }
.admin-btn { margin-top: 20px; background: rgba(255,255,255,0.2); color: white; }
.status-view { padding: 30px; text-align: center; }
.status-pending { color: #ffd700; font-size: 18px; }
.status-approved { color: #4caf50; font-size: 18px; }
.status-rejected { color: #f44336; font-size: 18px; }
</style>
