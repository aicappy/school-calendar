<template>
	<view class="container">
		<view class="welcome">
			<text class="title">🏫 家校日历</text>
			<text class="subtitle">请输入邀请码加入</text>
		</view>
		
		<view class="input-group">
			<input class="code-input" v-model="inviteCode" placeholder="请输入邀请码" maxlength="20" />
		</view>
		
		<button class="login-btn" @click="submitCode">
			📱 微信授权登录
		</button>
		
		<view v-if="!hasLoggedIn" class="opt-out-notice">
			<switch v-model="optOutNotifications" color="#667eea" />
			<text class="opt-out-text">关闭活动通知（仅查看日历）</text>
		</view>
		
		<view v-if="hasLoggedIn" class="add-more">
			<text class="add-more-title">已在多个班级群？</text>
			<input class="code-input second" v-model="secondCode" placeholder="输入第二个邀请码" maxlength="20" />
			<button class="add-btn" @click="addMoreCode">+ 添加班级</button>
		</view>
		
		<text class="hint">联系班级老师或家委会获取邀请码</text>
		
		<!-- Admin bypass -->
		<view v-if="isAdminCode" class="admin-login">
			<text class="admin-hint">管理员入口</text>
			<button class="admin-btn" @click="adminLogin">管理登录</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			inviteCode: '',
			secondCode: '',
			isAdminCode: false,
			hasLoggedIn: false,
			optOutNotifications: false
		}
	},
	watch: {
		inviteCode(val) {
			this.isAdminCode = val.toUpperCase() === 'ADMIN001';
		}
	},
	methods: {
		submitCode() {
			const code = this.inviteCode.trim().toUpperCase();
			
			if (!code) {
				uni.showToast({ title: '请输入邀请码', icon: 'none' });
				return;
			}
			
			const db = uniCloud.database();
			const that = this;
			
			// Verify invite code
			db.collection('invite_codes').where({
				code: code,
				used: false
			}).get().then(res => {
				if (res.result.data.length === 0) {
					// Check if already used by this user
					db.collection('invite_codes').where({
						code: code
					}).get().then(oldRes => {
						if (oldRes.result.data.length > 0 && oldRes.result.data[0].usedBy === '{openid}') {
							that.doLogin(oldRes.result.data[0]);
						} else {
							uni.showToast({ title: '邀请码无效或已使用', icon: 'none' });
						}
					});
					return;
				}
				
				const invite = res.result.data[0];
				that.doLogin(invite);
			});
		},
		addMoreCode() {
			const code = this.secondCode.trim().toUpperCase();
			
			if (!code) {
				uni.showToast({ title: '请输入第二个邀请码', icon: 'none' });
				return;
			}
			
			const db = uniCloud.database();
			const user = uni.getStorageSync('userInfo');
			const that = this;
			
			db.collection('invite_codes').where({
				code: code,
				used: false
			}).get().then(res => {
				if (res.result.data.length === 0) {
					uni.showToast({ title: '邀请码无效', icon: 'none' });
					return;
				}
				
				const invite = res.result.data[0];
				
				// Mark as used
				db.collection('invite_codes').doc(invite._id).update({
					used: true,
					usedBy: '{openid}',
					usedAt: Date.now()
				});
				
				// Add to user's grades
				db.collection('users').where({
					openid: '{openid}'
				}).get().then(userRes => {
					const currentGrades = userRes.result.data[0]?.grades || [];
					const newGrades = [...currentGrades, { grade: invite.grade, className: invite.className }];
					
					db.collection('users').where({
						openid: '{openid}'
					}).update({
						grades: newGrades
					});
					
					uni.showToast({ title: `已加入${invite.grade} ${invite.className}`, icon: 'success' });
					that.secondCode = '';
				});
			});
		},
		adminLogin() {
			const code = this.inviteCode.trim().toUpperCase();
			
			if (code !== 'ADMIN001') {
				uni.showToast({ title: '管理员码无效', icon: 'none' });
				return;
			}
			
			// Direct admin login without invite code
			uni.getUserProfile({
				desc: '用于管理员登录',
				success: (res) => {
					const userInfo = res.userInfo;
					const db = uniCloud.database();
					
					// Create or update admin user
					db.collection('users').where({
						openid: '{openid}'
					}).get().then(queryRes => {
						if (queryRes.result.data.length === 0) {
							db.collection('users').add({
								openid: '{openid}',
								nickname: userInfo.nickName,
								avatar: userInfo.avatarUrl,
								role: 'admin',
								createAt: Date.now()
							});
						}
						
						userInfo.schoolId = school._id;
						userInfo.schoolName = school.name;
						userInfo.role = 'school_admin';
						uni.setStorageSync('userInfo', userInfo);
						uni.switchTab({ url: '/pages/index/index' });
					});
				}
			});
		},
		doLogin(invite) {
			uni.getUserProfile({
				desc: '用于完善家长信息',
				success: (res) => {
					const userInfo = res.userInfo;
					const db = uniCloud.database();
					const that = this;
					
					// Mark invite code as used
					db.collection('invite_codes').doc(invite._id).update({
						used: true,
						usedBy: '{openid}',
						usedAt: Date.now()
					});
					
					// Create user with grades array and notification preference
					db.collection('users').where({
						openid: '{openid}'
					}).get().then(queryRes => {
						if (queryRes.result.data.length === 0) {
							db.collection('users').add({
								openid: '{openid}',
								nickname: userInfo.nickName,
								avatar: userInfo.avatarUrl,
								role: 'parent',
								schoolId: invite.schoolId,
								grades: [{ grade: invite.grade, className: invite.className }],
								subscribe: !that.optOutNotifications,
								createAt: Date.now()
							});
						}
						
						userInfo.grades = [{ grade: invite.grade, className: invite.className }];
						userInfo.schoolId = invite.schoolId;
						userInfo.role = 'parent';
						userInfo.subscribe = !that.optOutNotifications;
						uni.setStorageSync('userInfo', userInfo);
						
						that.hasLoggedIn = true;
						
						const msg = that.optOutNotifications ? '已加入（关闭通知）' : `欢迎加入${invite.grade}`;
						uni.showToast({ title: msg, icon: 'success' });
					});
				}
			});
		}
	}
}
</script>

<style>
.container {
	min-height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 40px;
}

.welcome {
	text-align: center;
	margin-bottom: 40px;
}

.title {
	font-size: 32px;
	font-weight: bold;
	color: white;
	display: block;
}

.subtitle {
	font-size: 16px;
	color: rgba(255,255,255,0.8);
	margin-top: 10px;
	display: block;
}

.input-group {
	width: 100%;
	margin-bottom: 20px;
}

.code-input {
	background: white;
	border-radius: 30px;
	padding: 15px 20px;
	font-size: 16px;
	text-align: center;
	letter-spacing: 2px;
}

.login-btn {
	background: white;
	color: #667eea;
	border: none;
	border-radius: 30px;
	padding: 15px 60px;
	font-size: 16px;
	font-weight: bold;
	width: 100%;
}

.hint {
	color: rgba(255,255,255,0.7);
	font-size: 13px;
	margin-top: 30px;
}

.admin-login {
	margin-top: 50px;
	text-align: center;
}

.admin-hint {
	color: rgba(255,255,255,0.5);
	font-size: 12px;
}

.admin-btn {
	background: transparent;
	color: rgba(255,255,255,0.7);
	border: 1px solid rgba(255,255,255,0.5);
	border-radius: 20px;
	padding: 8px 20px;
	font-size: 13px;
	margin-top: 10px;
}

.add-more {
	width: 100%;
	margin-top: 40px;
	text-align: center;
}

.add-more-title {
	color: rgba(255,255,255,0.8);
	font-size: 14px;
	display: block;
	margin-bottom: 15px;
}

.code-input.second {
	margin-bottom: 10px;
}

.add-btn {
	background: rgba(255,255,255,0.2);
	color: white;
	border: 1px solid rgba(255,255,255,0.5);
	border-radius: 20px;
	padding: 10px 30px;
	font-size: 14px;
}

.opt-out-notice {
	display: flex;
	align-items: center;
	justify-content: center;
	margin-top: 30px;
	padding: 15px;
	background: rgba(255,255,255,0.1);
	border-radius: 10px;
}

.opt-out-text {
	color: rgba(255,255,255,0.8);
	font-size: 14px;
	margin-left: 10px;
}
</style>
