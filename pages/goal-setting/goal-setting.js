Page({
  data: {
    nutritionGoals: {
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    },
    exerciseGoals: {
      frequency: '',
      duration: '',
      calories: ''
    }
  },

  onLoad() {
    this.loadGoals()
  },

  async loadGoals() {
    try {
      wx.showLoading({ title: '加载中...' })
      const token = wx.getStorageSync('token')
      
      if (!token) {
        console.log('未找到token，尝试重新登录')
        await getApp().silentLogin()
      }
      console.log('调用API:(GET) user-goals')
      const res = await getApp().request({
          url: `${getApp().globalData.baseUrl}/user-goals`,
          method: 'GET'
        })

      if (res.data && res.data.success) {
        const { nutritionGoals, exerciseGoals } = res.data.data
        this.setData({
          nutritionGoals,
          exerciseGoals
        })
      } else {
        // 如果失败，尝试重新登录后再次获取
        if (await getApp().silentLogin()) {
          return this.loadGoals()
        }
        throw new Error(res.data?.error || '加载失败')
      }
    } catch (error) {
      console.error('加载目标设置失败:', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  onNutritionGoalChange(e) {
    const { type } = e.currentTarget.dataset
    const value = e.detail.value
    this.setData({
      [`nutritionGoals.${type}`]: value
    })
  },

  onExerciseGoalChange(e) {
    const { type } = e.currentTarget.dataset
    const value = e.detail.value
    this.setData({
      [`exerciseGoals.${type}`]: value
    })
  },

  async saveGoals() {
    try {
      wx.showLoading({ title: '保存中...' })
      const token = wx.getStorageSync('token')
      console.log('调用API:(POST) user-goals')
      const res = await getApp().request({
          url: `${getApp().globalData.baseUrl}/user-goals`,
          method: 'POST',
          data: {
            nutritionGoals: {
              calories: parseFloat(this.data.nutritionGoals.calories) || 0,
              protein: parseFloat(this.data.nutritionGoals.protein) || 0,
              carbs: parseFloat(this.data.nutritionGoals.carbs) || 0,
              fat: parseFloat(this.data.nutritionGoals.fat) || 0
            },
            exerciseGoals: {
              frequency: parseInt(this.data.exerciseGoals.frequency) || 0,
              duration: parseInt(this.data.exerciseGoals.duration) || 0,
              calories: parseFloat(this.data.exerciseGoals.calories) || 0
            }
          }
        })
     

      if (res.data && res.data.success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        
        // 通知首页更新数据
        const pages = getCurrentPages()
        const indexPage = pages.find(p => p.route === 'pages/index/index')
        if (indexPage) {
          indexPage.loadDailyNutrition()
        }
      } else {
        throw new Error(res.data?.error || '保存失败')
      }
    } catch (error) {
      console.error('保存目标设置失败:', error)
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  }
}) 