<template>
	<view class="container">
		<view class="form">
			<!-- Voice Input -->
			<view class="form-item">
				<text class="label">语音输入活动信息</text>
				<view class="voice-input">
					<button class="voice-btn" @click="startVoiceInput">
						🎤 {{ isRecording ? '录音中...' : '点击说话' }}
					</button>
				</view>
				<text v-if="voiceText" class="voice-result">
					识别结果：{{ voiceText }}
				</text>
			</view>

			<!-- Event Category -->
			<view class="form-item">
				<text class="label">活动类型 *</text>
				<view class="category-selector">
					<view 
						v-for="cat in categories" 
						:key="cat.value"
						:class="['category-chip', event.category === cat.value ? 'selected' : '']"
						@click="event.category = cat.value"
					>
						{{ cat.label }}
					</view>
				</view>
			</view>

			<!-- Title -->
			<view class="form-item">
				<text class="label">活动标题 *</text>
				<input class="input" v-model="event.title" placeholder="请输入活动标题" />
			</view>

			<!-- Date & Time -->
			<view class="form-item">
				<text class="label">活动时间 *</text>
				<picker mode="date" @change="onDateChange">
					<view class="picker">{{ event.date || '选择日期' }}</view>
				</picker>
				<picker mode="time" @change="onTimeChange">
					<view class="picker">{{ event.time || '选择时间' }}</view>
				</picker>
			</view>

			<!-- Location -->
			<view class="form-item">
				<text class="label">活动地点</text>
				<input class="input" v-model="event.location" placeholder="请输入活动地点" />
			</view>

			<!-- Poster Image -->
			<view class="form-item">
				<text class="label">活动海报</text>
				<view class="image-upload" @click="chooseImage">
					<image v-if="event.imageUrl" :src="event.imageUrl" class="preview" mode="aspectFill"></image>
					<text v-else class="upload-icon">+</text>
				</view>
			</view>

			<!-- Description -->
			<view class="form-item">
				<text class="label">活动介绍</text>
				<textarea class="textarea" v-model="event.description" placeholder="请输入活动介绍" />
			</view>

			<!-- Grade Selection -->
			<view class="form-item">
				<text class="label">适用年级（可多选）</text>
				<view class="grade-selector">
					<view 
						v-for="grade in availableGrades" 
						:key="grade"
						:class="['grade-chip', selectedGrades.includes(grade) ? 'selected' : '']"
						@click="toggleGrade(grade)"
					>
						{{ grade }}
					</view>
				</view>
			</view>

			<!-- Remind Option -->
			<view class="form-item">
				<text class="label">提醒设置</text>
				<picker :range="remindOptions" @change="onRemindChange">
					<view class="picker">{{ remindOptions[event.remindIndex] }}</view>
				</picker>
			</view>
			<view class="form-item">
				<text class="label">提醒设置</text>
				<picker :range="remindOptions" @change="onRemindChange">
					<view class="picker">{{ remindOptions[event.remindIndex] }}</view>
				</picker>
			</view>

			<!-- Submit Button -->
			<button class="submit-btn" @click="submitEvent">发布活动</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			event: {
				title: '',
				category: 'school',  // school or ptsa
				date: '',
				time: '',
				location: '',
				imageUrl: '',
				description: '',
				remindIndex: 0
			},
			categories: [
				{ value: 'school', label: '🏫 学校活动' },
				{ value: 'ptsa', label: '🤝 PTSA活动' }
			],
			remindOptions: ['不提醒', '提前15分钟', '提前30分钟', '提前1小时', '提前1天'],
			availableGrades: [],
			selectedGrades: [],
			isRecording: false,
			voiceText: ''
		}
	},
	methods: {
		onDateChange(e) {
			this.event.date = e.detail.value;
		},
		onTimeChange(e) {
			this.event.time = e.detail.value;
		},
		onRemindChange(e) {
			this.event.remindIndex = e.detail.value;
		},
		toggleGrade(grade) {
			if (grade === '全校') {
				this.selectedGrades = ['全校'];
			} else {
				const idx = this.selectedGrades.indexOf(grade);
				if (idx > -1) {
					this.selectedGrades.splice(idx, 1);
					this.selectedGrades = this.selectedGrades.filter(g => g !== '全校');
				} else {
					this.selectedGrades.push(grade);
				}
			}
		},
		startVoiceInput() {
			const that = this;
			
			//#ifdef MP-WEIXIN
			const recorderManager = uni.getRecorderManager();
			
			recorderManager.onStart(() => {
				that.isRecording = true;
			});
			
			recorderManager.onStop((res) => {
				that.isRecording = false;
				
				// Use WeChat AI speech recognition
				const tempFilePath = res.tempFilePath;
				
				// Note: For real implementation, need WeChat plugin or cloud function
				// This is a placeholder
				uni.showLoading({ title: '识别中...' });
				
				// Simulate recognition result (in real app, use cloud function)
				setTimeout(() => {
					uni.hideLoading();
					// Parse voice to fields
					that.parseVoiceResult('请在3月15日上午9点，在学校礼堂举办家长开放日活动');
				}, 1500);
			});
			
			recorderManager.start({ format: 'mp3' });
			//#endif
			
			//#ifndef MP-WEIXIN
			uni.showToast({ title: '仅微信小程序支持语音', icon: 'none' });
			//#endif
		},
		parseVoiceResult(text) {
			// Simple parsing - extract date, time, location
			// In production, use more sophisticated NLP
			this.voiceText = text;
			
			// Extract date
			const dateMatch = text.match(/(\d+)月(\d+)日/);
			if (dateMatch) {
				const month = dateMatch[1];
				const day = dateMatch[2];
				this.event.date = `2026-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
			}
			
			// Extract time
			const timeMatch = text.match(/(上午|下午)(\d+)[点时]/);
			if (timeMatch) {
				let hour = parseInt(timeMatch[2]);
				if (timeMatch[1] === '下午' && hour < 12) hour += 12;
				this.event.time = `${hour}:00`;
			}
			
			// Extract location
			const locationMatch = text.match(/在(.+?)举办/);
			if (locationMatch) {
				this.event.location = locationMatch[1];
			}
			
			// Title - take first part
			const titleMatch = text.split('请')[1] || text;
			this.event.title = titleMatch.split('在')[0].trim() || '新活动';
			
			// Description
			this.event.description = text;
		},
		chooseImage() {
			uni.chooseImage({
				count: 1,
				success: (res) => {
					// Upload to cloud storage
					uniCloud.uploadFile({
						filePath: res.tempFilePaths[0],
						cloudPath: `events/${Date.now()}.jpg`,
						success: (uploadRes) => {
							this.event.imageUrl = uploadRes.fileID;
						}
					});
				}
			});
		},
		submitEvent() {
			if (!this.event.title || !this.event.date || !this.event.time) {
				uni.showToast({ title: '请填写必填项', icon: 'none' });
				return;
			}

			const db = uniCloud.database();
			const dateTime = new Date(`${this.event.date} ${this.event.time}`).getTime();
			const that = this;
			
			db.collection('events').add({
				title: this.event.title,
				category: this.event.category,
				dateTime: dateTime,
				location: this.event.location,
				imageUrl: this.event.imageUrl,
				description: this.event.description,
				grade: this.selectedGrades,
				section: uni.getStorageSync('userInfo').section,
				remindBefore: [0, 15, 30, 60, 1440][this.event.remindIndex],
				createdBy: '{openid}',
				createdAt: Date.now()
			}).then(() => {
				// Send notification ONLY to relevant grade parents
				const targetGrades = this.selectedGrades;
				const userSection = uni.getStorageSync('userInfo').section;
				
				db.collection('users').where({
					role: 'parent',
					section: userSection,
					subscribe: true
				}).get().then(res => {
					const parents = res.result.data;
					const that = this;
					
					// Filter only parents whose grades match
					const targetParents = parents.filter(p => {
						const pGrades = p.grades || [];
						return targetGrades.includes('全校') || 
							   targetGrades.some(g => pGrades.some(pg => pg.grade === g));
					});
					
					// Send in batches of 50 to avoid rate limit
					const batchSize = 50;
					for (let i = 0; i < targetParents.length; i += batchSize) {
						setTimeout(() => {
							const batch = targetParents.slice(i, i + batchSize);
							batch.forEach(user => {
								uniCloud.openapi().subscribeMessage.send({
									touser: user.openid,
									templateId: 'YOUR_TEMPLATE_ID',
									page: '/pages/index/index',
									data: {
										thing1: { value: that.event.title },
										time2: { value: new Date(dateTime).toLocaleString() },
										thing3: { value: targetGrades.join(', ') }
									}
								}).catch(() => {}); // Ignore individual errors
							});
						}, i * 1000); // 1 second delay between batches
					}
				});
				
				uni.showToast({ title: '发布成功', icon: 'success' });
				setTimeout(() => {
					uni.switchTab({ url: '/pages/index/index' });
				}, 1500);
			});
		}
	}
}
</script>

<style>
.container {
	min-height: 100vh;
	background: #f5f5f5;
	padding: 20px;
}

.form {
	background: white;
	border-radius: 12px;
	padding: 20px;
}

.form-item {
	margin-bottom: 20px;
}

.label {
	font-size: 14px;
	color: #333;
	font-weight: 500;
	display: block;
	margin-bottom: 8px;
}

.input {
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	padding: 12px;
	font-size: 15px;
}

.picker {
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	padding: 12px;
	font-size: 15px;
	background: white;
}

.textarea {
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	padding: 12px;
	font-size: 15px;
	width: 100%;
	height: 100px;
}

.image-upload {
	width: 150px;
	height: 150px;
	border: 2px dashed #e0e0e0;
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.upload-icon {
	font-size: 40px;
	color: #e0e0e0;
}

.preview {
	width: 100%;
	height: 100%;
	border-radius: 12px;
}

.submit-btn {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border: none;
	border-radius: 25px;
	padding: 14px;
	font-size: 16px;
	margin-top: 20px;
}

.grade-selector {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
}

.grade-chip {
	padding: 8px 16px;
	border-radius: 20px;
	background: #f0f0f0;
	color: #666;
	font-size: 14px;
	border: 2px solid transparent;
}

.grade-chip.selected {
	background: #e8f0ff;
	color: #667eea;
	border-color: #667eea;
}

.category-selector {
	display: flex;
	gap: 15px;
	margin-bottom: 15px;
}

.category-chip {
	padding: 12px 24px;
	border-radius: 25px;
	background: #f0f0f0;
	color: #666;
	font-size: 15px;
	border: 2px solid transparent;
}

.category-chip.selected {
	background: linear-gradient(135deg, #667eea, #764ba2);
	color: white;
	border-color: transparent;
}

.voice-input {
	margin: 15px 0;
}

.voice-btn {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border: none;
	border-radius: 30px;
	padding: 12px 30px;
	font-size: 15px;
}

.voice-result {
	display: block;
	margin-top: 10px;
	padding: 10px;
	background: #f5f5f5;
	border-radius: 8px;
	font-size: 14px;
	color: #666;
}
</style>
