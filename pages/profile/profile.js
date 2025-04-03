Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    statistics: {
      totalRecords: 0,
      totalCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFat: 0
    },
    functionList: [
      { name: '历史记录', icon: 'history', url: '/pages/history/history' },
      { name: '健康报告', icon: 'report', url: '/pages/report/report' },
      { name: '隐私政策', icon: 'privacy', url: '/pages/privacy/privacy' },
      { name: '关于我们', icon: 'about', url: '/pages/about/about' }
    ],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    recentActivities: [],
  },

  onLoad() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userInfo,
        hasUserInfo: true
      })
    }
    this.loadStatistics()
  },

  onShow() {
    this.loadStats()
    this.loadRecentActivities()
  },

  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        const userInfo = res.userInfo
        wx.setStorageSync('userInfo', userInfo)
        this.setData({
          userInfo,
          hasUserInfo: true
        })
      },
      fail: (error) => {
        console.error('获取用户信息失败:', error)
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
      }
    })
  },

  editUserInfo() {
    wx.navigateTo({
      url: '/pages/user-edit/user-edit'
    })
  },

  showAchievements() {
    wx.navigateTo({
      url: '/pages/achievements/achievements'
    })
  },

  goToHealthStats() {
    wx.navigateTo({
      url: '/pages/health-stats/health-stats',
      fail: (error) => {
        console.error('跳转失败:', error)
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        })
      }
    })
  },

  goToGoalSetting() {
    wx.navigateTo({
      url: '/pages/goal-setting/goal-setting',
      fail: (error) => {
        console.error('跳转失败:', error)
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        })
      }
    })
  },

  goToHistory() {
    wx.navigateTo({
      url: '/pages/history/history',
      fail: (error) => {
        console.error('跳转失败:', error)
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        })
      }
    })
  },

  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings',
      fail: (error) => {
        console.error('跳转失败:', error)
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        })
      }
    })
  },

  goToDietPlan() {
    wx.navigateTo({
      url: '/pages/diet-plan/diet-plan',
      fail: (error) => {
        console.error('跳转失败:', error)
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        })
      }
    })
  },

  async loadStatistics() {
    try {
      wx.showLoading({ title: '加载中...' })
      
      console.log('调用API:(GET) food-records')
      const res = await getApp().request({
        url: `${getApp().globalData.baseUrl}/food-records`,
        method: 'GET'
      })

      if (res.data && Array.isArray(res.data)) {
        const stats = this.calculateStatistics(res.data)
        this.setData({ statistics: stats })
      } else if (res.data && res.data.success && Array.isArray(res.data.data)) {
        const stats = this.calculateStatistics(res.data.data)
        this.setData({ statistics: stats })
      }
    } catch (error) {
      console.error('加载统计数据失败：', error)
      wx.showToast({
        title: '加载统计数据失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  calculateStatistics(records) {
    if (!records || !records.length) return this.data.statistics

    const total = records.reduce((acc, record) => {
      acc.totalCalories += record.calories || 0
      acc.totalProtein += record.protein || 0
      acc.totalCarbs += record.carbs || 0
      acc.totalFat += record.fat || 0
      return acc
    }, {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0
    })

    const count = records.length

    return {
      totalRecords: count,
      totalCalories: total.totalCalories,
      avgProtein: (total.totalProtein / count).toFixed(1),
      avgCarbs: (total.totalCarbs / count).toFixed(1),
      avgFat: (total.totalFat / count).toFixed(1)
    }
  },

  navigateTo(e) {
    const url = e.currentTarget.dataset.url
    wx.navigateTo({ url })
  },

  // 加载统计数据
  async loadStats() {
    try {
      wx.showLoading({ title: '加载中...' })
      
      console.log('调用API:(GET) today-stats')
      const res = await getApp().request({
        url: `${getApp().globalData.baseUrl}/today-stats`,
        method: 'GET'
      })
   

      if (res.data && res.data.data) {
        this.setData({
          totalCalories: res.data.data.calories || 0,
          totalProtein: res.data.data.protein || 0,
          totalCarbs: res.data.data.carbs || 0,
          totalFat: res.data.data.fat || 0
        })
      }
    } catch (error) {
      console.error('加载统计数据失败：', error)
      wx.showToast({
        title: '加载统计数据失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 加载最近活动
  async loadRecentActivities() {
    try {
        console.log('调用API:(GET) exercise-mets')
        const res = await getApp().request({
            url: `${getApp().globalData.baseUrl}/recent-activities`,
            method: 'GET'
          })
     
      if (res.data && res.data.data) {
        this.setData({
          recentActivities: res.data.data.map(activity => ({
            ...activity,
            createdAt: new Date(activity.createdAt).toLocaleString()
          }))
        })
      }
    } catch (error) {
      console.error('加载最近活动失败：', error)
      wx.showToast({
        title: '加载最近活动失败',
        icon: 'none'
      })
    }
  },

  // 处理连接运动手环点击
  handleMenuClick: function() {
    wx.showToast({
      title: '功能开发中，敬请期待',
      icon: 'none'
    });
  }
}) 