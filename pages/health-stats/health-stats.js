Page({
  data: {
    overview: {
      totalRecords: 0,
      daysCount: 0,
      avgCalories: 0,
      avgExercise: 0
    },
    nutrition: {
      protein: 0,
      carbs: 0,
      fat: 0
    },
    exercise: {
      count: 0,
      duration: 0,
      calories: 0
    }
  },

  onLoad() {
    this.loadStatistics()
  },

  async loadStatistics() {
    try {
      wx.showLoading({ title: '加载中...' })

      // 获取食物记录统计
      const foodRes = await this.getFoodStats()
      // 获取运动记录统计
      const exerciseRes = await this.getExerciseStats()

      if (foodRes.data && foodRes.data.success && exerciseRes.data && exerciseRes.data.success) {
        const foodStats = foodRes.data.data
        const exerciseStats = exerciseRes.data.data

        this.setData({
          overview: {
            totalRecords: foodStats.totalRecords + exerciseStats.totalRecords,
            daysCount: Math.max(foodStats.daysCount, exerciseStats.daysCount),
            avgCalories: foodStats.avgCalories,
            avgExercise: exerciseStats.avgCalories
          },
          nutrition: {
            protein: foodStats.avgProtein,
            carbs: foodStats.avgCarbs,
            fat: foodStats.avgFat
          },
          exercise: {
            count: exerciseStats.totalRecords,
            duration: exerciseStats.totalDuration,
            calories: exerciseStats.totalCalories
          }
        })
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  async getFoodStats() {
      
    console.log('调用API:(GET) food-stats')
    const res = await getApp().request({
      url: `${getApp().globalData.baseUrl}/food-stats`,
      method: 'GET'
    })
    return res
  },

  async getExerciseStats() {
    console.log('调用API:(GET) exercise-stats')
    const res = await getApp().request({
      url: `${getApp().globalData.baseUrl}/exercise-stats`,
      method: 'GET'
    })
    return res
  }
}) 