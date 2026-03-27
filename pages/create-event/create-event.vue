<template>
	<view class="container">
		<view class="form">
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

			<!-- Remind Option -->
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
				date: '',
				time: '',
				location: '',
				imageUrl: '',
				description: '',
				remindIndex: 0
			},
			remindOptions: ['不提醒', '提前15分钟', '提前30分钟', '提前1小时', '提前1天']
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
			
			db.collection('events').add({
				title: this.event.title,
				dateTime: dateTime,
				location: this.event.location,
				imageUrl: this.event.imageUrl,
				description: this.event.description,
				remindBefore: [0, 15, 30, 60, 1440][this.event.remindIndex],
				createdAt: Date.now()
			}).then(() => {
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
</style>
