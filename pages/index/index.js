const app = getApp()

Page({
  data: {
    userInfo: null,
    dailyNutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      exercise_calories: 0
    },
    todayMeals: {
      breakfast: '未记录',
      lunch: '未记录',
      dinner: '未记录'
    },
    todayExercises: [],
    healthTip: null,
    hasUserInfo: false,
    showAuthModal: false
  },

  onShow() {
  },

  onLoad() {
    // 页面加载时检查登录状态
    this.checkLoginStatus()
    // 监听自定义事件
    app.eventBus.on('callIndexFunction', this.handleCallIndexFunction);
   
  },
  onUnload() {
    // 页面卸载时移除监听
    app.eventBus.off('callIndexFunction', this.handleCallIndexFunction)
  },
  handleCallIndexFunction(data) {
    console.log('主页函数被调用，参数：', data)
    if(data.type == "food"){
      this.loadTodayMeals()
    }else{
      this.loadTodayExercises()
    }
     // 调用主页的函数
       // 串行加载数据，避免并发请求过多
       this.loadDailyNutrition()
  },

  async checkLoginStatus() {
    const userInfo = app.globalData.userInfo
    if (userInfo) {
      this.setData({
        hasUserInfo: true,
        userInfo: userInfo
      })
      // 加载页面数据
      this.loadPageData()
    } else {
      // 显示授权提示
      this.setData({ showAuthModal: true })
    }
  },

  async handleLogin() {
    try {
      // 先获取用户信息
      const userInfoRes = await wx.getUserProfile({
        desc: '用于完善会员资料',
        lang: 'zh_CN'
      })

      wx.showLoading({ title: '登录中...' })
      // 保存用户信息
      const userInfo = userInfoRes.userInfo
      wx.setStorageSync('userInfo', userInfo)
      app.globalData.userInfo = userInfo
      // 进行登录
      const loginSuccess = await app.silentLogin()
      if (!loginSuccess) {
        console.error('登录失败')
        throw new Error('登录失败')
      }
      this.setData({
        hasUserInfo: true,
        userInfo: userInfo,
        showAuthModal: false
      })

      // 加载页面数据
      this.loadPageData()
      wx.showToast({ title: '登录成功', icon: 'success' })
    } catch (error) {
      console.error('登录过程发生错误:', error)
      if (error.errMsg && error.errMsg.includes('getUserProfile:fail auth deny')) {
        wx.showModal({
          title: '提示',
          content: '需要您的授权才能使用完整功能',
          showCancel: false
        })
      } else {
        wx.showModal({
          title: '提示',
          content: '登录失败，请稍后重试',
          showCancel: false
        })
      }
    } finally {
      wx.hideLoading()
    }
  },

  async loadPageData() {
    try {
      wx.showLoading({ title: '加载中...' })
      
      // 串行加载数据，避免并发请求过多
      await this.loadDailyNutrition().catch(() => {})
      await this.loadTodayMeals().catch(() => {})
      await this.loadTodayExercises().catch(() => {})
    } catch (error) {
      console.error('加载数据失败：', error)
    } finally {
      wx.hideLoading()
    }
  },

  async loadDailyNutrition() {
    try {
      // 获取今日营养摄入
      
        console.log('调用API:(GET) daily-nutrition')
        const nutritionRes = await getApp().request({
            url: `${getApp().globalData.baseUrl}/daily-nutrition`,
            method: 'GET',
        })
      
      // 获取用户目标
      console.log('调用API:(GET) user-goals')
        const goalsRes = await getApp().request({
          url: `${getApp().globalData.baseUrl}/user-goals`,
          method: 'GET',
      })

      if (nutritionRes.data && nutritionRes.data.success) {
        const nutrition = nutritionRes.data.data
        
        // 获取目标值，如果有设置的话
        let caloriesGoal = 2000 // 默认值
        let proteinGoal = 60
        let carbsGoal = 250
        let fatGoal = 70
        
        if (goalsRes.data && goalsRes.data.success && goalsRes.data.data.nutritionGoals) {
          const goals = goalsRes.data.data.nutritionGoals
          caloriesGoal = goals.calories > 0 ? goals.calories : caloriesGoal
          proteinGoal = goals.protein > 0 ? goals.protein : proteinGoal
          carbsGoal = goals.carbs > 0 ? goals.carbs : carbsGoal
          fatGoal = goals.fat > 0 ? goals.fat : fatGoal
        }
        
        this.setData({
          dailyNutrition: {
            calories: {
              value: nutrition.calories || 0,
              goal: caloriesGoal,
              percent: Math.min(100, ((nutrition.calories || 0) / caloriesGoal) * 100)
            },
            protein: {
              value: nutrition.protein || 0,
              goal: proteinGoal,
              percent: Math.min(100, ((nutrition.protein || 0) / proteinGoal) * 100)
            },
            carbs: {
              value: nutrition.carbs || 0,
              goal: carbsGoal,
              percent: Math.min(100, ((nutrition.carbs || 0) / carbsGoal) * 100)
            },
            fat: {
              value: nutrition.fat || 0,
              goal: fatGoal,
              percent: Math.min(100, ((nutrition.fat || 0) / fatGoal) * 100)
            }
          }
        })
      }
    } catch (error) {
      console.error('加载每日营养数据失败:', error)
    }
  },

  // 加载今日饮食记录
  async loadTodayMeals() {
    try {
      console.log('调用API:(GET) today-meals')
      const res = await getApp().request({
        url: `${getApp().globalData.baseUrl}/today-meals`,
        method: 'GET'
      })

      if (res.data?.success && res.data.data) {
        const{breakfast, lunch, dinner} = res.data.data
      
        this.setData({
          todayMeals: {
            breakfast: breakfast?.food_name || '未记录',
            lunch: lunch?.food_name || '未记录',
            dinner: dinner?.food_name || '未记录'
          }
        })
      }
    } catch (error) {
      console.error('加载今日饮食记录失败：', error)
      this.setData({
        todayMeals: {
          breakfast: '未记录',
          lunch: '未记录',
          dinner: '未记录'
        }
      })
    }
  },

  // 修改导航方法，添加餐食类型参数
  goToFood(e) {
    // 获取点击的餐食类型
    const mealType = e.currentTarget.dataset.mealType || 'BREAKFAST'
    console.log('正在跳转到饮食页面...餐食类型:', mealType)
    
    // 将餐食类型存储到全局数据
    const app = getApp()
    app.globalData.selectedMealType = mealType
    
    wx.switchTab({
      url: '/pages/food/food',
      success: () => {
        console.log('跳转到饮食页面成功')
      },
      fail: (error) => {
        console.error('跳转到饮食页面失败:', error)
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        })
      }
    })
  },

  goToExercise() {
    console.log('正在跳转到运动页面...')
    wx.switchTab({
      url: '/pages/exercise/exercise',
      success: () => {
        console.log('跳转到运动页面成功')
      },
      fail: (error) => {
        console.error('跳转到运动页面失败:', error)
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        })
      }
    })
  },

  goToProfile() {
    console.log('正在跳转到个人页面...')
    wx.switchTab({
      url: '/pages/profile/profile',
      success: () => {
        console.log('跳转到个人页面成功')
      },
      fail: (error) => {
        console.error('跳转到个人页面失败:', error)
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        })
      }
    })
  },

  // 加载今日运动记录
  async loadTodayExercises() {
    try {
        
      console.log('调用API:(GET) today-exercise-records')
      const res = await getApp().request({
        url: `${getApp().globalData.baseUrl}/today-exercise-records`,
        method: 'GET'
      })

      if (res.data?.success && Array.isArray(res.data.data)) {
        const todayExercises = res.data.data
        this.setData({ todayExercises })
      }
    } catch (error) {
      console.error('加载今日运动记录失败：', error)
      this.setData({ todayExercises: [] })
    }
  },
}) 