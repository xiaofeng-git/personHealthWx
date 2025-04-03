const app = getApp()
Page({
  data: {
    gender: 'male',
    weight: '',
    weightRange: [],  // 体重范围数组
    weightIndex: -1,
    duration: '',
    durationRange: [],  // 时长范围数组
    durationIndex: -1,
    calories: 0,
    exerciseTypes: [],
    selectedExerciseIndex: -1,
    selectedExercise: null,
    historyRecords: []
  },

  onLoad() {
    console.log('运动页面加载开始')  // 添加日志
    
    // 初始化体重范围（30-200kg）
    const weightRange = Array.from({length: 171}, (_, i) => i + 30)
    // 初始化时长范围（5-180分钟，步长为5）
    const durationRange = Array.from({length: 36}, (_, i) => (i + 1) * 5)
    
    console.log('初始化数据:', {  // 添加日志
      weightRange: weightRange,
      durationRange: durationRange
    })
    
    this.setData({
      weightRange,
      durationRange,
      weightIndex: -1,
      selectedExerciseIndex: -1,
      selectedExercise: null,
      durationIndex: -1,
      duration: '',
      calories: 0
    }, () => {
      console.log('setData完成，当前数据:', this.data)  // 添加日志
    })
    
    this.loadExerciseTypes()
  },
  onUnload() {
    // 页面卸载时移除监听
    app.eventBus.off('callIndexFunction', this.handleCallIndexFunction);
  },
  onShow() {
    this.loadHistory()
  },

  // 加载运动类型
  async loadExerciseTypes() {
    try {
      
      console.log('调用API:(GET) exercise-mets')
      const res = await getApp().request({
        url: `${getApp().globalData.baseUrl}/exercise-mets`,
        method: 'GET'
      })
      
      console.log('运动类型响应:', res)
      
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        // 确保每个运动类型都有正确的MET值
        const exerciseTypes = res.data.data.map(type => ({
          ...type,
          // 确保 met 值存在，如果后端返回 metMin 和 metMax，则计算平均值
          met: type.met || (type.metMin && type.metMax ? (type.metMin + type.metMax) / 2 : 
               // 如果都不存在，根据名称设置默认值
               this.getDefaultMetByName(type.name))
        }))
        
        console.log('处理后的运动类型:', exerciseTypes)
        
        this.setData({ 
          exerciseTypes,
          selectedExerciseIndex: -1,
          selectedExercise: null
        })
      }
    } catch (error) {
      console.error('加载运动类型失败:', error)
      wx.showToast({
        title: '加载运动类型失败',
        icon: 'none'
      })
    }
  },

  // 根据运动名称获取默认MET值
  getDefaultMetByName(name) {
    const metValues = {
      '步行': 3.5,
      '慢跑': 7,
      '跑步': 9,
      '游泳': 8,
      '骑行': 6.5,
      '中速骑行': 8,
      '快速骑行': 10,
      '健身': 5,
      '瑜伽': 3,
      '跳绳': 10,
      '篮球': 8,
      '足球': 7,
      '网球': 7,
      '羽毛球': 5.5,
      '乒乓球': 4
    };
    
    for (const [type, value] of Object.entries(metValues)) {
      if (name.includes(type)) {
        return value;
      }
    }
    
    return 5; // 默认值
  },

  // 性别选择
  selectGender(e) {
    const gender = e.currentTarget.dataset.gender
    this.setData({ gender })
    this.calculateCalories()
  },

  // 体重选择
  onWeightChange(e) {
    const weightIndex = e.detail.value
    const weight = this.data.weightRange[weightIndex]
    
    this.setData({
      weightIndex,
      weight
    }, () => {
      // 更新卡路里计算
      this.calculateCalories()
    })
  },

  // 运动类型选择
  onExerciseTypeChange(e) {
    const selectedExerciseIndex = e.detail.value
    const selectedExercise = this.data.exerciseTypes[selectedExerciseIndex]
    
    this.setData({
      selectedExerciseIndex,
      selectedExercise
    }, () => {
      // 更新卡路里计算
      this.calculateCalories()
    })
  },

  // 运动时长选择
  onDurationChange(e) {
    const durationIndex = e.detail.value
    const duration = this.data.durationRange[durationIndex]
    
    this.setData({
      durationIndex,
      duration
    }, () => {
      // 更新卡路里计算
      this.calculateCalories()
    })
  },

  // 计算卡路里消耗
  calculateCalories() {
    const { gender, weight, selectedExercise, duration } = this.data
    
    if (!weight || !selectedExercise || !duration) {
      this.setData({ calories: 0 })
      return
    }
    
    console.log('计算卡路里消耗:', { gender, weight, selectedExercise, duration })
    
    // 检查 selectedExercise 的数据结构
    let metValue = 5; // 默认MET值
    
    // 如果有 metMin 和 metMax 属性，使用它们的平均值
    if (selectedExercise.metMin !== undefined && selectedExercise.metMax !== undefined) {
      metValue = (selectedExercise.metMin + selectedExercise.metMax) / 2;
    } 
    // 如果有 met 属性，直接使用，但确保不为0
    else if (selectedExercise.met !== undefined) {
      metValue = selectedExercise.met || 5; // 如果met为0，使用默认值5
    }
    
    // 根据运动类型名称设置默认MET值
    if (metValue <= 0) {
      // 为常见运动类型设置合理的MET值
      const metValues = {
        '步行': 3.5,
        '慢跑': 7,
        '跑步': 9,
        '游泳': 8,
        '骑行': 6.5,
        '中速骑行': 8,
        '快速骑行': 10,
        '健身': 5,
        '瑜伽': 3,
        '跳绳': 10,
        '篮球': 8,
        '足球': 7,
        '网球': 7,
        '羽毛球': 5.5,
        '乒乓球': 4
      };
      
      // 尝试根据名称匹配
      for (const [type, value] of Object.entries(metValues)) {
        if (selectedExercise.name.includes(type)) {
          metValue = value;
          break;
        }
      }
    }
    
    console.log('使用的MET值:', metValue)
    
    const durationHours = duration / 60 // 转换为小时
    const genderFactor = gender === 'male' ? 1 : 0.9 // 女性消耗略低
    
    // 卡路里计算公式: MET * 体重(kg) * 时长(小时)
    const calories = Math.round(metValue * weight * durationHours * genderFactor)
    console.log('计算结果:', calories)
    
    this.setData({ calories })
  },

  // 加载历史记录
  async loadHistory() {
    try {
      wx.showLoading({ title: '加载中...' })
      console.log('调用API:(GET) exercise-records')
      const res = await getApp().request({
        url: `${getApp().globalData.baseUrl}/exercise-records`,
        method: 'GET'
      })
     

      // 检查数据结构
      if (res.data && res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        // 格式化时间并排序
        const records = res.data.data.map(record => ({
          id: record.id,
          type: record.type,
          duration: record.duration,
          calories: record.calories,
          createdAt: record.createdAt
        }))

        console.log('格式化后的记录:', records)
        this.setData({ 
          historyRecords: records 
        }, () => {
          console.log('更新后的 historyRecords:', this.data.historyRecords)
        })
      } else {
        this.setData({ historyRecords: [] })
      }
    } catch (error) {
      console.error('加载历史记录失败：', error)
      wx.showToast({
        title: '加载历史记录失败',
        icon: 'none'
      })
      this.setData({ historyRecords: [] })
    } finally {
      wx.hideLoading()
    }
  },

  // 保存运动记录
  async saveExercise() {
    try {
      // 表单验证
      if (!this.validateForm()) {
        return
      }
      
      wx.showLoading({ title: '保存中...' })
      
      console.log('准备保存运动记录:', {
        type: this.data.selectedExercise.name,
        duration: this.data.duration,
        calories: this.data.calories
      })
      console.log('调用API:(POST) exercise-records')
      const res = await getApp().request({
        url: `${getApp().globalData.baseUrl}/exercise-records`,
        method: 'POST',
        data: {
          type: this.data.selectedExercise.name,
          duration: this.data.duration,
          calories: this.data.calories
        }
      })
      
      console.log('保存运动记录响应:', res)
      
      if (res.data && res.data.success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        
        // 重置表单
        this.setData({
          selectedExerciseIndex: -1,
          selectedExercise: null,
          durationIndex: -1,
          duration: '',
          calories: 0
        })
        
        wx.hideLoading()
        // 通知首页刷新数据
        console.log('通知首页刷新数据')

        // 触发事件，调用主页的函数
        app.eventBus.emit('callIndexFunction', {type:"exercise"});
      } else {
        throw new Error('保存失败')
      }
        // 重新加载历史记录
        this.loadHistory()
        
    } catch (error) {
      console.error('保存运动记录失败:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  validateForm() {
    if (!this.data.weight) {
      wx.showToast({
        title: '请输入体重',
        icon: 'none'
      })
      return false
    }
    if (!this.data.selectedExercise) {
      wx.showToast({
        title: '请选择运动类型',
        icon: 'none'
      })
      return false
    }
    if (!this.data.duration) {
      wx.showToast({
        title: '请输入运动时长',
        icon: 'none'
      })
      return false
    }
    return true
  },

  // 添加 pickerTap 方法
  pickerTap(e) {
    console.log('picker外层view被点击:', {
      currentTarget: e.currentTarget.dataset,
      type: e.type,
      timeStamp: e.timeStamp
    })
  }
}) 