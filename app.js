App({
  globalData: {
    baseUrl: 'https://symmetrical-palm-tree-pjrj9vj74vqpf9rr4-8000.app.github.dev/api',
    userInfo: null,
    selectedMealType: null,
    token: null,
    networkConfig: {
      timeout: 180000,
      retryTimes: 1,
      retryDelay: 1000
    }
  },
 eventBus: {
    events: {},

    // 监听事件
    on(eventName, callback) {
      if (!this.events[eventName]) {
        this.events[eventName] = [];
      }
      this.events[eventName].push(callback);
    },

    // 触发事件
    emit(eventName, data) {
      if (this.events[eventName]) {
        this.events[eventName].forEach(callback => {
          callback(data);
        });
      }
    },

    // 移除事件
    off(eventName, callback) {
      if (this.events[eventName]) {
        this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
      }
    },
  },
  // 自定义日志函数
  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}`
    
    switch(type.toLowerCase()) {
      case 'error':
        console.error(logMessage)
        break
      case 'warn':
        console.warn(logMessage)
        break
      case 'info':
      default:
        console.log(logMessage)
    }
  },

  onLaunch() {
    this.initApp()
  },

  async initApp() {
    try {
      // 基础初始化
      await this.initBasicSetup()
      
      // 检查登录状态
      const token = wx.getStorageSync('token')
      const userInfo = wx.getStorageSync('userInfo')
      
      if (token && userInfo) {
        this.globalData.token = token
        this.globalData.userInfo = userInfo
      }
    } catch (error) {
      console.error('初始化失败：', error)
    }
  },

  async initBasicSetup() {
    return new Promise((resolve) => {
      // 确保基础库初始化完成
      wx.getSystemInfo({
        success: () => resolve(),
        fail: () => resolve()
      })
    })
  },

  async getAiApiStatus() {
    try {
      const res = await this.request({
        url: `${this.globalData.baseUrl}/user/ai-api-status`,
        method: 'GET'
      })
      if (res.data.success) {
        return res.data.data
      }
      throw new Error('获取API状态失败')
    } catch (error) {
      console.error('获取API状态失败：', error)
      throw error
    }
  },

  request(options) {
    const token = wx.getStorageSync('token')
    console.log(`请求: ${options.url} - 有token: ${!!token}`)
    if (token) {
        console.log('Token前10个字符:', token.substring(0, 10))
    }
    
    const requestOptions = {
        url: options.url.startsWith('http') ? options.url : `${this.globalData.baseUrl}${options.url}`,
        method: options.method || 'GET',
        data: options.data,
        header: {
            'Content-Type': 'application/json',
            ...options.header
        },
        success: options.success,
        fail: options.fail
    }
    
    if (token) {
        requestOptions.header['Authorization'] = `Bearer ${token}`
        console.log('已添加Authorization头')
    }
    // 返回一个 Promise
  return new Promise((resolve, reject) => {
    wx.request({
      ...requestOptions,
      success(res) {
        if (typeof options.success === "function") {
          options.success(res);
        }
        resolve(res); // 返回实际的响应数据
      },
      fail(err) {
        if (typeof options.fail === "function") {
          options.fail(err);
        }
        reject(err);
      }
    });
  });
}, 
async silentLogin() {
  try {
      console.log('开始静默登录流程')
      // 清除旧的登录信息
      wx.removeStorageSync('token')
      wx.removeStorageSync('userInfo')
      
      // 获取登录code - 添加这部分代码
      const loginResult = await new Promise((resolve, reject) => {
          wx.login({
              success: res => {
                  console.log('获取code成功:', res.code)
                  resolve(res)
              },
              fail: err => {
                  console.error('获取code失败:', err)
                  reject(err)
              }
          })
      })
      
      // 检查是否成功获取code
      if (!loginResult || !loginResult.code) {
          console.error('未能获取有效的登录code')
          return false
      }
      
      // 发送登录请求
      const res = await new Promise((resolve, reject) => {
          wx.request({
              url: `${this.globalData.baseUrl}/login`,
              method: 'POST',
              data: { code: loginResult.code, nickName: this.globalData.userInfo.nickName }, // 现在loginResult已定义
              header: {
                  'Content-Type': 'application/json'
              },
              success: (res) => {
                  console.log('登录响应:', res)
                  if (res.data && res.data.success) {
                      const { token, userId } = res.data.data
                      // 保存token并打印日志
                      wx.setStorageSync('token', token)
                      wx.setStorageSync('userId', userId)
                      this.globalData.token = token
                      console.log('成功保存token:', token.substring(0, 10) + '...')
                      resolve(true)
                  } else {
                      console.error('登录响应不成功:', res.data)
                      resolve(false)
                  }
              },
              fail: (err) => {
                  console.error('登录请求失败:', err)
                  resolve(false)
              }
          })
      })
      
      console.log('silentLogin结果:', res)
      return !!res // 确保返回布尔值
  } catch (error) {
      console.error('静默登录失败:', error)
      return false
  }
},

  async checkServerAvailability() {
    try {
      const res = await wx.request({
        url: `${this.globalData.baseUrl}/health-check`,
        method: 'GET',
        timeout: 5000
      })
      return res.statusCode === 200
    } catch (error) {
      console.error('服务器检查失败：', error)
      return false
    }
  },

  async autoLogin() {
    try {
      const token = wx.getStorageSync('token')
      const userInfo = wx.getStorageSync('userInfo')
      
      if (token && userInfo) {
        const isValid = await this.validateToken(token)
        if (isValid) {
          this.globalData.userInfo = userInfo
          this.globalData.token = token
          return true
        }
      }
      return false
    } catch (error) {
      console.error('自动登录失败：', error)
      return false
    }
  },

  async validateToken(token) {
    try {
      const res = await this.request({
        url: `${this.globalData.baseUrl}/validate-token`,
        method: 'POST',
      })
      return res.data.success
    } catch (error) {
      console.error('验证token失败：', error)
      return false
    }
  }
}) 