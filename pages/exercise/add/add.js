Page({
  data: {
    exerciseTypes: [
      { name: '跑步', icon: 'run' },
      { name: '游泳', icon: 'swim' },
      { name: '骑行', icon: 'bike' },
      { name: '健身', icon: 'gym' }
    ],
    selectedType: '',
    duration: 30,
    calories: 0
  },

  onTypeSelect(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      selectedType: type
    })
  },

  onDurationChange(e) {
    this.setData({
      duration: e.detail.value
    })
  },

  async saveExercise() {
    if (!this.data.selectedType) {
      wx.showToast({
        title: '请选择运动类型',
        icon: 'none'
      })
      return
    }

    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${getApp().globalData.baseUrl}/exercise-records`,
          method: 'POST',
          data: {
            type: this.data.selectedType,
            duration: this.data.duration,
            calories: this.calculateCalories(),
            date: new Date().toISOString()
          },
          success: resolve,
          fail: reject
        })
      })

      if (res && res.data && res.data.success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        wx.navigateBack()
      } else {
        throw new Error('保存失败')
      }
    } catch (error) {
      console.error('保存失败：', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  calculateCalories() {
    // 简单的卡路里计算逻辑
    const baseRate = {
      '跑步': 10,
      '游泳': 12,
      '骑行': 8,
      '健身': 9
    }
    return Math.round(this.data.duration * (baseRate[this.data.selectedType] || 8))
  }
}) 