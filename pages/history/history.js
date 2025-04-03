Page({
  data: {
    currentType: 'food', // 'food' 或 'exercise'
    foodRecords: [],
    exerciseRecords: []
  },

  onLoad() {
    this.loadRecords()
  },

  // 切换记录类型
  switchType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ currentType: type })
    this.loadRecords()
  },

  // 加载记录
  async loadRecords() {
    try {
      wx.showLoading({ title: '加载中...' })
      if (this.data.currentType === 'food') {
        await this.loadFoodRecords()
      } else {
        await this.loadExerciseRecords()
      }
    } catch (error) {
      console.error('加载记录失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 加载饮食记录
  async loadFoodRecords() {
    try {
        console.log('调用API:(GET) food-records')
        const res = await getApp().request({
          url: `${getApp().globalData.baseUrl}/food-records`,
          method: 'GET'
        })

      if (res.data && res.data.success) {
        // 格式化日期
        const records = res.data.data.map(record => ({
          ...record,
          createdAt: this.formatDate(record.created_at)
        }))
        this.setData({ foodRecords: records })
      }
    } catch (error) {
      console.error('加载饮食记录失败:', error)
      this.setData({ foodRecords: [] })
    }
  },

  // 加载运动记录
  async loadExerciseRecords() {
    try {
        console.log('调用API:(GET) exercise-records')
        const res = await getApp().request({
          url: `${getApp().globalData.baseUrl}/exercise-records`,
          method: 'GET'
        })

      if (res.data && res.data.success) {
        // 格式化日期
        const records = res.data.data.map(record => ({
          ...record,
          createdAt: this.formatDate(record.created_at)
        }))
        this.setData({ exerciseRecords: records })
      }
    } catch (error) {
      console.error('加载运动记录失败:', error)
      this.setData({ exerciseRecords: [] })
    }
  },

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  },

  // 查看记录详情
  showRecordDetail(e) {
    const { id } = e.currentTarget.dataset
    const type = this.data.currentType
    wx.navigateTo({
      url: `/pages/${type}-detail/${type}-detail?id=${id}`
    })
  }
}) 