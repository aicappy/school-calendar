<template>
	<view class="container">
		<view class="welcome">
			<text class="title">🏫 家校日历</text>
			<text class="subtitle">获取最新活动通知</text>
		</view>
		
		<button class="login-btn" @click="login">
			📱 微信授权登录
		</button>
		
		<text class="hint">登录后可以设置活动提醒</text>
	</view>
</template>

<script>
export default {
	methods: {
		login() {
			// Get user profile
			uni.getUserProfile({
				desc: '用于设置活动提醒',
				success: (res) => {
					const userInfo = res.userInfo;
					
					// Request subscription message permission
					uni.requestSubscribeMessage({
						tmplIds: ['YOUR_TEMPLATE_ID'],
						success: (subRes) => {
							const db = uniCloud.database();
							
							// Save or update user
							db.collection('users').where({
								openid: '{openid}'
							}).get().then(queryRes => {
								if (queryRes.result.data.length === 0) {
									// New user
									db.collection('users').add({
										openid: '{openid}',
										nickname: userInfo.nickName,
										avatar: userInfo.avatarUrl,
										subscribe: subRes['YOUR_TEMPLATE_ID'] === 'accept',
										createAt: Date.now()
									});
								} else {
									// Update existing user
									db.collection('users').where({
										openid: '{openid}'
									}).update({
										nickname: userInfo.nickName,
										avatar: userInfo.avatarUrl,
										subscribe: subRes['YOUR_TEMPLATE_ID'] === 'accept'
									});
								}
								
								uni.setStorageSync('userInfo', userInfo);
								uni.switchTab({ url: '/pages/index/index' });
							});
						}
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
	margin-bottom: 60px;
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

.login-btn {
	background: white;
	color: #667eea;
	border: none;
	border-radius: 30px;
	padding: 15px 60px;
	font-size: 16px;
	font-weight: bold;
}

.hint {
	color: rgba(255,255,255,0.7);
	font-size: 13px;
	margin-top: 30px;
}
</style>
