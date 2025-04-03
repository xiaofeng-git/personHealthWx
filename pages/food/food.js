const app = getApp()

Page({
  data: {
    imgUrl: '',
    rawResult: null,
    foodInfo: null,
    nutritionInfo: null,
    healthAdvice: null,
    remainingCalls: 3,
    foodRecords: [],
    charts: {
      nutrition: null
    },
    mealType: 'BREAKFAST',
    mealTypes: [
      { label: '早餐', value: 'BREAKFAST', emoji: '🍳' },
      { label: '午餐', value: 'LUNCH', emoji: '🍱' },
      { label: '晚餐', value: 'DINNER', emoji: '🍲' }
    ],
    historyRecords: [],
    healthTip: null,
    isSaved: false,
    isAnalysisExpanded: false
  },

  onLoad() {
    this.loadFoodRecords()
    this.checkApiLimit()
  },
  onUnload() {
    // 页面卸载时移除监听
    app.eventBus.off('callIndexFunction', this.handleCallIndexFunction);
  },
  onShow() {
    // 检查是否有从主页传来的餐食类型
    const app = getApp()
    if (app.globalData.selectedMealType) {
      this.setData({
        mealType: app.globalData.selectedMealType,
        // 清空分析结果
        imgUrl: '',
        rawResult: null,
        foodInfo: null,
        nutritionInfo: null,
        healthTip: null,
        isSaved: false
      })
      // 清除全局存储的餐食类型
      app.globalData.selectedMealType = null
    }
    
    this.loadHistory()
    this.checkApiLimit()
  },

  checkApiLimit() {
    const app = getApp()
    const remaining = Math.max(0, 3 - app.globalData.apiCallCount)
    console.log('当前API调用次数:', app.globalData.apiCallCount)
    console.log('剩余调用次数:', remaining)
    this.setData({ remainingCalls: remaining })
  },

  // 选择图片
  chooseImage() {
    if (this.data.remainingCalls <= 0) {
      wx.showToast({
        title: '今日识别次数已用完',
        icon: 'none'
      })
      return
    }

    // 使用普通的 Promise 方式调用
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera']
    }).then(res => {
      // 设置图片URL
      this.setData({
        imgUrl: res.tempFiles[0].tempFilePath
      })

      // 显示解析中的提示
      wx.showLoading({
        title: '正在解析中...',
        mask: true
      })

      // 调用分析函数
      return this.analyzeFood()
    }).then(() => {
      // 分析成功后的处理
      wx.hideLoading()
    }).catch(error => {
      console.error('选择或分析图片失败:', error)
      wx.hideLoading()
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    })
  },

  // 分析食物图片
  async analyzeFood() {
    console.log('开始分析食物图片')
    
    if (!this.data.imgUrl) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      })
      return
    }
    
    try {
      // 检查API调用次数
      if (this.data.remainingCalls <= 0) {
        wx.showToast({
          title: '今日分析次数已用完',
          icon: 'none'
        })
        return
      }
      
      // 将图片转换为 base64
      const fileManager = wx.getFileSystemManager()
      const fileContent = fileManager.readFileSync(this.data.imgUrl, 'base64')
      
      console.log('图片已转换为base64格式，准备发送请求')
      
      // 获取网络配置
      const networkConfig = getApp().globalData.networkConfig
      
      // 上传图片并分析
      console.log('调用API:(POST) analyze-food')
      const res = await getApp().request({
        url: `${getApp().globalData.baseUrl}/analyze-food`,
        method: 'POST',
        data: {
          image: fileContent
        },
        timeout: networkConfig.timeout
      })
      
      console.log('收到服务器响应:', res)
      
      // 处理响应数据
      if (res.data && res.data.success) {
        // 更新剩余调用次数
        const remainingCalls = res.data.remaining_calls !== undefined ? 
                              res.data.remaining_calls : 
                              this.data.remainingCalls - 1;
        
        // 解析后端返回的数据
        const rawResult = res.data.data.raw_result || '';
        const parsedResult = res.data.data.parsed_result || {};
        
        // 构造前端需要的数据结构
        const foodInfo = {
          name: parsedResult.foodInfo.name || '',
          type: parsedResult.foodInfo.category  || '',
          vitamins: parsedResult.foodInfo.otherNutrients.vitamins  || '',
          description: parsedResult.foodInfo.overall_description || ''
        };
        
        const nutritionInfo = {
          calories: parsedResult.nutritionInfo.calories || 0,
          protein: parsedResult.nutritionInfo.protein || 0,
          carbs: parsedResult.nutritionInfo.carbs || 0,
          fat: parsedResult.nutritionInfo.fat || 0
        };
        
        const healthAdvice = parsedResult.foodInfo.health_advice || '';
        
        console.log('处理后的数据:', {
          foodInfo,
          nutritionInfo,
          healthAdvice,
          rawResult
        });
        
        this.setData({
          foodInfo,
          nutritionInfo,
          healthAdvice,
          rawResult,
          remainingCalls,
          isSaved: false
        })
        
        wx.showToast({
          title: '分析成功',
          icon: 'success'
        })
      } else {
        throw new Error(res.data.error || '分析失败')
      }
    } catch (error) {
      console.error('分析食物失败:', error)
      throw error  // 向上抛出错误，让 chooseImage 函数处理
    }
  },


  async loadFoodRecords() {
    try {
        
        console.log('调用API:(GET) food-records')
       const res = await getApp().request({
        url: `${getApp().globalData.baseUrl}/food-records`,
        method: 'GET'
      })

      if (res && res.data && res.data.success) {
        this.setData({ foodRecords: res.data.data || [] })
      } else {
        this.setData({ foodRecords: [] })
      }
    } catch (error) {
      console.error('加载记录失败：', error)
      this.setData({ foodRecords: [] })
    }
  },

  updateNutritionChart() {
    if (this.data.nutritionInfo) {
      // 更新营养图表的逻辑
    }
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '我的健康饮食记录',
      path: '/pages/food/food',
      imageUrl: this.data.imgUrl
    }
  },

  selectMealType(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      mealType: value,
      // 清空图片和分析结果
      imgUrl: '',
      rawResult: null,
      foodInfo: null,
      nutritionInfo: null,
      healthTip: null,
      isSaved: false
    }, () => {
      console.log('当前选择的餐食类型:', value);
    });
  },

  async saveRecord() {
    if (!this.data.foodInfo || !this.data.foodInfo.name) {
      wx.showToast({
        title: '请先识别食物',
        icon: 'none'
      })
      return
    }

    // 如果已经保存过，就不要重复保存
    if (this.data.isSaved) {
      wx.showToast({
        title: '已经保存过了',
        icon: 'none'
      })
      return
    }

    let loadingShown = false
    try {
      loadingShown = true
      wx.showLoading({ 
        title: '保存中...',
        mask: true
      })
      
      const postData = {
        food_name: this.data.foodInfo.name,
        meal_type: this.data.mealType,
        calories: this.data.nutritionInfo.calories || 0,
        protein: this.data.nutritionInfo.protein || 0,
        carbs: this.data.nutritionInfo.carbs || 0,
        fat: this.data.nutritionInfo.fat || 0,
        image_url: this.data.imgUrl || ''
      }
      
      console.log('调用API:(POST) food-records')
      const res = await getApp().request({
        url: `${getApp().globalData.baseUrl}/food-records`,
        method: 'POST',
        data: postData
      })

      if (!res.data || !res.data.success) {
        throw new Error(res.data?.error || '保存失败')
      }

      this.setData({
        isSaved: true
      })

      wx.showToast({ 
        title: '保存成功', 
        icon: 'success' 
      })
   // 通知首页刷新数据
   console.log('通知首页刷新数据')
   // 触发事件，调用主页的函数
   app.eventBus.emit('callIndexFunction', {type:"food"});
      // 刷新历史记录
      await this.loadHistory()

   

    } catch (error) {
      console.error('保存失败:', error)
      wx.showToast({ 
        title: error.message || '保存失败', 
        icon: 'none' 
      })
    } finally {
      if (loadingShown) {
        wx.hideLoading()
      }
    }
  },

  // 解析大模型返回的结果
  async parseResult(rawResult) {
    // 这里可以添加更复杂的解析逻辑
    return {
      foodName: '待解析',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    }
  },

  async loadHistory() {
    try {
      wx.showLoading({ title: '加载中...' })
      
      console.log('调用API:(GET) food-records')
      const res = await getApp().request({
        url: `${getApp().globalData.baseUrl}/food-records`,
        method: 'GET'
      })
     
      // 检查数据结构
      if (!res || !res.data) {
        console.log('无历史记录数据')
        this.setData({ historyRecords: [] })
        return
      }

      // 确保 data 是数组
      const recordsArray = Array.isArray(res.data) ? res.data : 
                          (Array.isArray(res.data.data) ? res.data.data : [])

      console.log('处理前的记录数组:', recordsArray)

      // 安全地处理每条记录
      const records = recordsArray.map(record => {
        try {
          // 确保所有必要的字段都有默认值
          return {
            id: record?.id || Date.now(), // 使用时间戳作为默认ID
            foodName: record?.food_name || '未知食物',
            mealType: record?.meal_type,
            calories: Number(record?.calories) || 0,
            protein: Number(record?.protein) || 0,
            carbs: Number(record?.carbs) || 0,
            fat: Number(record?.fat) || 0,
            imageUrl: record?.image_url || '',
            createTime: record?.created_at
          }
        } catch (err) {
          console.error('处理单条记录时出错:', err, record)
          // 返回一个默认记录
          return {
            id: Date.now(),
            foodName: '数据错误',
            mealType: '未知',
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            imageUrl: '',
            createTime: '未知时间'
          }
        }
      }).filter(record => record != null) // 过滤掉可能的 null 记录

      console.log('格式化后的记录:', records)
      this.setData({ 
        historyRecords: records 
      }, () => {
        console.log('更新后的历史记录:', this.data.historyRecords)
      })

    } catch (error) {
      console.error('加载历史记录失败：', error)
      // 确保在错误时也设置空数组
      this.setData({ historyRecords: [] })
      wx.showToast({
        title: '加载历史记录失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 改进餐食类型转换函数
  getMealTypeLabel(type) {
    if (!type) return '其他'
    const mealTypeMap = {
      'BREAKFAST': '早餐',
      'LUNCH': '午餐',
      'DINNER': '晚餐'
    }
    return mealTypeMap[type] || '其他'
  },

  // 切换分析文本展开状态
  toggleAnalysis() {
    this.setData({
      isAnalysisExpanded: !this.data.isAnalysisExpanded
    });
  },

  // 检查API调用限制
  async checkApiLimit() {
    try {
      // 从后端获取API调用状态
      const res = await getApp().getAiApiStatus()
      
      if (res) {
        console.log('API调用状态:', res)
        this.setData({ 
          remainingCalls: res.remaining_calls || 0
        })
      }
    } catch (error) {
      console.error('获取API调用状态失败:', error)
      // 如果获取失败，默认设置为0
      this.setData({ remainingCalls: 0 })
    }
  }
}) 