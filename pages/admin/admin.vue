<template>
	<view class="container">
		<view class="header">
			<text class="title">⚙️ 管理面板</text>
			<text class="role-tag">{{ getRoleText(currentRole) }}</text>
		</view>
		
		<!-- Super Admin: Section Admin Management -->
		<view v-if="currentRole === 'super_admin'" class="section">
			<text class="section-title">🏫 学部管理员</text>
			<view class="admin-list">
				<view v-for="admin in sectionAdmins" :key="admin._id" class="admin-item">
					<image :src="admin.avatar" class="avatar"></image>
					<view class="admin-info">
						<text class="nickname">{{ admin.nickname }}</text>
						<text class="section-tag">{{ admin.section }}</text>
					</view>
					<button class="remove-btn" @click="removeSectionAdmin(admin)">移除</button>
				</view>
			</view>
			<view class="add-form">
				<picker :range="sections" @change="onSectionSelect">
					<view class="picker">选择学部 → {{ selectedSection }}</view>
				</picker>
				<button class="add-btn" @click="addSectionAdmin">添加学部管理员</button>
			</view>
		</view>
		
		<!-- Section Admin: Grade Admin Management -->
		<view v-if="currentRole === 'section_admin'" class="section">
			<text class="section-title">👥 年级管理员</text>
			<view class="admin-list">
				<view v-for="admin in gradeAdmins" :key="admin._id" class="admin-item">
					<image :src="admin.avatar" class="avatar"></image>
					<view class="admin-info">
						<text class="nickname">{{ admin.nickname }}</text>
						<text class="grades-tag">{{ formatGrades(admin.grades) }}</text>
					</view>
					<button class="remove-btn" @click="removeGradeAdmin(admin)">移除</button>
				</view>
			</view>
		</view>
		
		<!-- Grade Admin: Join Requests -->
		<view v-if="currentRole === 'grade_admin'" class="section">
			<text class="section-title">📨 入群申请</text>
			<view v-if="joinRequests.length === 0" class="empty">暂无申请</view>
			<view v-for="req in joinRequests" :key="req._id" class="request-item">
				<view class="request-info">
					<text class="request-user">{{ req.nickname }}</text>
					<text class="request-detail">{{ req.section }} {{ req.grade }} {{ req.className }}</text>
				</view>
				<view class="request-actions">
					<button class="approve-btn" @click="processRequest(req, 'approved')">批准</button>
					<button class="reject-btn" @click="processRequest(req, 'rejected')">拒绝</button>
				</view>
			</view>
		</view>
		
		<!-- Grade Admin: Invite Codes -->
		<view v-if="currentRole === 'grade_admin' || currentRole === 'section_admin'" class="section">
			<text class="section-title">🎫 邀请码</text>
			<view class="invite-form">
				<picker :range="availableGrades" @change="onGradeSelect">
					<view class="picker">年级 → {{ selectedGrade }}</view>
				</picker>
				<input class="invite-input" v-model="newClass" placeholder="班级如(1)班" />
				<button class="gen-btn" @click="generateInviteCode">生成</button>
			</view>
			<view class="code-list">
				<view v-for="code in inviteCodes" :key="code._id" class="code-item">
					<text class="code-grade">{{ code.grade }} {{ code.className }}</text>
					<text class="code-value">{{ code.code }}</text>
					<text :class="['code-status', code.status]">{{ code.status }}</text>
				</view>
			</view>
		</view>
		
		<!-- Stats -->
		<view class="section">
			<text class="section-title">📊 统计</text>
			<view class="stats">
				<view class="stat-item"><text class="stat-num">{{ eventCount }}</text><text class="stat-label">活动</text></view>
				<view class="stat-item"><text class="stat-num">{{ userCount }}</text><text class="stat-label">家长</text></view>
				<view v-if="currentRole === 'grade_admin'" class="stat-item"><text class="stat-num">{{ requestCount }}</text><text class="stat-label">待审批</text></view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			currentRole: '',
			section: '',
			sections: ['小学部', '初中部', '高中部'],
			selectedSection: '请选择学部',
			selectedGrade: '请选择年级',
			availableGrades: [],
			newClass: '',
			sectionAdmins: [],
			gradeAdmins: [],
			joinRequests: [],
			inviteCodes: [],
			eventCount: 0,
			userCount: 0,
			requestCount: 0
		}
	},
	onShow() {
		this.loadData();
	},
	methods: {
		getRoleText(role) {
			const roles = { 'super_admin': '超级管理员', 'section_admin': '学部管理员', 'grade_admin': '年级管理员', 'parent': '家长' };
			return roles[role] || role;
		},
		formatGrades(grades) {
			if (!grades) return '';
			return grades.map(g => `${g.grade}`).join(', ');
		},
		loadData() {
			const user = uni.getStorageSync('userInfo');
			this.currentRole = user.role || '';
			this.section = user.section || '';
			
			const db = uniCloud.database();
			const that = this;
			
			// Set available grades based on section
			if (this.section === '小学部') {
				this.availableGrades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
			} else if (this.section === '初中部') {
				this.availableGrades = ['初一', '初二', '初三'];
			} else if (this.section === '高中部') {
				this.availableGrades = ['高一', '高二', '高三'];
			}
			
			// Load section admins (super admin only)
			if (this.currentRole === 'super_admin') {
				db.collection('users').where({ role: 'section_admin' }).get().then(res => {
					this.sectionAdmins = res.result.data;
				});
			}
			
			// Load grade admins (section admin only)
			if (this.currentRole === 'section_admin') {
				db.collection('users').where({ role: 'grade_admin', section: this.section }).get().then(res => {
					this.gradeAdmins = res.result.data;
				});
			}
			
			// Load join requests (grade admin only)
			if (this.currentRole === 'grade_admin') {
				db.collection('join_requests').where({ 
					section: this.section,
					status: 'pending'
				}).get().then(res => {
					this.joinRequests = res.result.data;
					this.requestCount = res.result.data.length;
				});
			}
			
			// Load invite codes
			let codeQuery = db.collection('invite_codes');
			if (this.currentRole === 'grade_admin') {
				codeQuery = codeQuery.where({ section: this.section });
			}
			codeQuery.get().then(res => {
				this.inviteCodes = res.result.data;
			});
			
			// Stats
			db.collection('events').count().then(res => { this.eventCount = res.result.total; });
			db.collection('users').where({ role: 'parent' }).count().then(res => { this.userCount = res.result.total; });
		},
		onSectionSelect(e) {
			this.selectedSection = this.sections[e.detail.value];
		},
		onGradeSelect(e) {
			this.selectedGrade = this.availableGrades[e.detail.value];
		},
		addSectionAdmin() {
			if (this.selectedSection === '请选择学部') {
				uni.showToast({ title: '请选择学部', icon: 'none' });
				return;
			}
			uni.showToast({ title: '请在用户管理中手动设置', icon: 'none' });
		},
		removeSectionAdmin(admin) {
			const db = uniCloud.database();
			db.collection('users').doc(admin._id).update({ role: 'parent' }).then(() => {
				uni.showToast({ title: '已移除', icon: 'success' });
				this.loadData();
			});
		},
		removeGradeAdmin(admin) {
			const db = uniCloud.database();
			db.collection('users').doc(admin._id).update({ role: 'parent' }).then(() => {
				uni.showToast({ title: '已移除', icon: 'success' });
				this.loadData();
			});
		},
		processRequest(req, status) {
			const db = uniCloud.database();
			db.collection('join_requests').doc(req._id).update({ status }).then(() => {
				if (status === 'approved') {
					db.collection('users').doc(req.userId).update({
						role: 'parent',
						section: req.section,
						grades: [{ grade: req.grade, className: req.className }]
					});
				}
				uni.showToast({ title: status === 'approved' ? '已批准' : '已拒绝', icon: 'success' });
				this.loadData();
			});
		},
		generateInviteCode() {
			if (this.selectedGrade === '请选择年级' || !this.newClass) {
				uni.showToast({ title: '请填写完整', icon: 'none' });
				return;
			}
			const code = `${this.section.slice(0,2)}${this.selectedGrade}${this.newClass}${Date.now().toString().slice(-4)}`;
			const db = uniCloud.database();
			db.collection('invite_codes').add({
				code: code,
				schoolId: '',
				section: this.section,
				grade: this.selectedGrade,
				className: this.newClass,
				status: 'active',
				createAt: Date.now()
			}).then(() => {
				uni.showToast({ title: '邀请码已生成', icon: 'success' });
				this.newClass = '';
				this.loadData();
			});
		}
	}
}
</script>

<style>
.container { min-height: 100vh; background: #f5f5f5; }
.header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 20px; }
.title { color: white; font-size: 20px; font-weight: bold; display: block; }
.role-tag { color: rgba(255,255,255,0.8); font-size: 13px; }
.section { background: white; margin: 15px; border-radius: 12px; padding: 15px; }
.section-title { font-size: 16px; font-weight: bold; display: block; margin-bottom: 15px; }
.admin-item, .request-item { display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #f0f0f0; }
.avatar { width: 45px; height: 45px; border-radius: 22px; margin-right: 12px; }
.admin-info, .request-info { flex: 1; }
.nickname, .request-user { font-size: 15px; font-weight: 500; display: block; }
.section-tag, .grades-tag, .request-detail { font-size: 12px; color: #667eea; }
.remove-btn, .reject-btn { background: #f44336; color: white; border: none; border-radius: 15px; padding: 5px 12px; font-size: 12px; }
.approve-btn { background: #4caf50; color: white; border: none; border-radius: 15px; padding: 5px 12px; font-size: 12px; margin-right: 8px; }
.add-form, .invite-form { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; }
.picker, .invite-input { flex: 1; min-width: 120px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px; font-size: 14px; }
.add-btn, .gen-btn { background: #667eea; color: white; border: none; border-radius: 8px; padding: 10px 20px; font-size: 14px; }
.code-item { display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #f0f0f0; }
.code-grade { flex: 1; font-size: 14px; }
.code-value { font-weight: bold; color: #667eea; margin: 0 10px; }
.code-status { font-size: 12px; padding: 3px 8px; border-radius: 10px; }
.code-status.active { background: #e8f5e9; color: #4caf50; }
.code-status.pending { background: #fff3e0; color: #ff9800; }
.stats { display: flex; justify-content: space-around; }
.stat-item { text-align: center; }
.stat-num { font-size: 28px; font-weight: bold; color: #667eea; display: block; }
.stat-label { font-size: 12px; color: #999; }
.empty { text-align: center; padding: 30px; color: #999; }
</style>
