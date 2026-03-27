<template>
	<view class="container">
		<!-- Header -->
		<view class="header">
			<view class="month-selector">
				<text class="nav-btn" @click="prevMonth">◀</text>
				<text class="month-title">{{ currentMonthName }} {{ currentYear }}</text>
				<text class="nav-btn" @click="nextMonth">▶</text>
			</view>
		</view>

		<!-- Calendar Grid -->
		<view class="calendar">
			<view class="weekday-row">
				<text v-for="day in weekDays" :key="day" class="weekday">{{ day }}</text>
			</view>
			<view class="days-grid">
				<view 
					v-for="(day, index) in calendarDays" 
					:key="index"
					class="day-cell"
					:class="{ 'has-event': day.events && day.events.length > 0, 'today': day.isToday, 'empty': !day.date }"
					@click="day.date && onDayClick(day)"
				>
					<text class="day-number">{{ day.dayNum }}</text>
					<view v-if="day.events && day.events.length > 0" class="event-dots">
						<view class="dot"></view>
					</view>
				</view>
			</view>
		</view>

		<!-- Upcoming Events -->
		<view class="events-section">
			<text class="section-title">📅 近期活动</text>
			<view v-if="upcomingEvents.length === 0" class="no-events">
				<text>暂无活动</text>
			</view>
			<view 
				v-for="event in upcomingEvents" 
				:key="event._id" 
				class="event-card"
				@click="goToDetail(event)"
			>
				<image v-if="event.imageUrl" :src="event.imageUrl" class="event-thumb" mode="aspectFill"></image>
				<view class="event-info">
					<text class="event-title">{{ event.title }}</text>
					<text class="event-date">📅 {{ formatDate(event.dateTime) }}</text>
					<text v-if="event.location" class="event-location">📍 {{ event.location }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			currentYear: 2026,
			currentMonth: 3,
			weekDays: ['一', '二', '三', '四', '五', '六', '日'],
			events: [],
			calendarDays: []
		}
	},
	computed: {
		currentMonthName() {
			const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
			return months[this.currentMonth - 1];
		},
		upcomingEvents() {
			const now = new Date();
			return this.events
				.filter(e => new Date(e.dateTime) >= now)
				.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
				.slice(0, 5);
		}
	},
	onShow() {
		this.loadEvents();
	},
	methods: {
		loadEvents() {
			const db = uniCloud.database();
			const user = uni.getStorageSync('userInfo');
			const userGrades = user.grades || [];
			const schoolId = user.schoolId;
			
			// Get all events for this school
			let query = db.collection('events');
			if (schoolId) {
				query = query.where({ schoolId: schoolId });
			}
			
			query.get().then(res => {
				let allEvents = res.result.data;
				
				// Filter events by user's grades
				if (user.role === 'parent' && userGrades.length > 0) {
					const userGradeNames = userGrades.map(g => g.grade);
					allEvents = allEvents.filter(event => {
						const eventGrades = event.grade || [];
						// Show if event is for "全校" or matches user's grades
						return eventGrades.includes('全校') || 
							   eventGrades.some(g => userGradeNames.includes(g));
					});
				}
				
				this.events = allEvents;
				this.generateCalendar();
			});
		},
		generateCalendar() {
			const days = [];
			const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1);
			const lastDay = new Date(this.currentYear, this.currentMonth, 0);
			const startWeekday = firstDay.getDay() || 7;
			
			// Empty cells before first day
			for (let i = 1; i < startWeekday; i++) {
				days.push({ empty: true });
			}
			
			// Days of month
			const today = new Date();
			for (let d = 1; d <= lastDay.getDate(); d++) {
				const dateStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
				const dayEvents = this.events.filter(e => {
					const eventDate = new Date(e.dateTime).toISOString().slice(0, 10);
					return eventDate === dateStr;
				});
				
				days.push({
					date: dateStr,
					dayNum: d,
					events: dayEvents,
					isToday: today.getFullYear() === this.currentMonth && 
							   today.getMonth() === this.currentMonth - 1 && 
							   today.getDate() === d
				});
			}
			
			this.calendarDays = days;
		},
		prevMonth() {
			if (this.currentMonth === 1) {
				this.currentMonth = 12;
				this.currentYear--;
			} else {
				this.currentMonth--;
			}
			this.generateCalendar();
		},
		nextMonth() {
			if (this.currentMonth === 12) {
				this.currentMonth = 1;
				this.currentYear++;
			} else {
				this.currentMonth++;
			}
			this.generateCalendar();
		},
		onDayClick(day) {
			if (day.events && day.events.length > 0) {
				this.goToDetail(day.events[0]);
			}
		},
		goToDetail(event) {
			uni.navigateTo({
				url: `/pages/event-detail/event-detail?id=${event._id}`
			});
		},
		formatDate(dateTime) {
			const date = new Date(dateTime);
			return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
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

.month-selector {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.nav-btn {
	color: white;
	font-size: 18px;
	padding: 10px;
}

.month-title {
	color: white;
	font-size: 18px;
	font-weight: bold;
}

.calendar {
	background: white;
	margin: 15px;
	border-radius: 12px;
	padding: 15px;
}

.weekday-row {
	display: flex;
	justify-content: space-around;
	margin-bottom: 10px;
}

.weekday {
	width: 40px;
	text-align: center;
	color: #999;
	font-size: 13px;
}

.days-grid {
	display: flex;
	flex-wrap: wrap;
}

.day-cell {
	width: 14.28%;
	height: 45px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.day-number {
	font-size: 14px;
}

.has-event .day-number {
	color: #667eea;
	font-weight: bold;
}

.today .day-number {
	background: #667eea;
	color: white;
	border-radius: 50%;
	width: 28px;
	height: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.event-dots {
	margin-top: 2px;
}

.dot {
	width: 6px;
	height: 6px;
	background: #667eea;
	border-radius: 50%;
}

.events-section {
	margin: 15px;
}

.section-title {
	font-size: 16px;
	font-weight: bold;
	margin-bottom: 10px;
	display: block;
}

.event-card {
	background: white;
	border-radius: 12px;
	padding: 15px;
	margin-bottom: 10px;
	display: flex;
}

.event-thumb {
	width: 80px;
	height: 80px;
	border-radius: 8px;
	margin-right: 12px;
}

.event-info {
	flex: 1;
}

.event-title {
	font-size: 15px;
	font-weight: bold;
	display: block;
}

.event-date, .event-location {
	font-size: 13px;
	color: #666;
	margin-top: 4px;
	display: block;
}

.no-events {
	text-align: center;
	padding: 30px;
	color: #999;
}
</style>
