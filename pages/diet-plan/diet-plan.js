Page({
  data: {
    selectedPlan: null,
    plans: [
      {
        id: 'light',
        name: '轻度用户',
        price: '¥9.9',
        period: '月',
        count: '10次/月',
        description: '适合偶尔需要分析饮食的用户'
      },
      {
        id: 'unlimited',
        name: '高频用户',
        price: '¥29',
        period: '月',
        count: '无限次/月',
        description: '适合经常需要分析饮食的用户'
      },
      {
        id: 'yearly',
        name: '年度会员',
        price: '¥199',
        period: '年',
        count: '无限次/年',
        description: '适合长期使用的用户，超值优惠',
        discount: '7折优惠'
      }
    ],
    openid: null
  },
  
  onLoad: function() {
    // 获取用户openid
    this.getUserOpenId();
  },

  getUserOpenId: function() {
    const openid = wx.getStorageSync('openid');
    if (openid) {
      this.setData({ openid });
    } else {
      // 如果本地没有存储openid，需要从后端获取
      wx.login({
        success: (res) => {
          if (res.code) {
            getApp().request({
              url: `${getApp().globalData.baseUrl}/get-openid`,
              method: 'GET',
              success: (result) => {
                if (result.data && result.data.openid) {
                  wx.setStorageSync('openid', result.data.openid);
                  this.setData({ openid: result.data.openid });
                }
              }
            });
          }
        }
      });
    }
  },
  
  selectPlan: function(e) {
    const planId = e.currentTarget.dataset.id;
    this.setData({
      selectedPlan: planId
    });
  },
  
  handlePurchase: function() {
    if (!this.data.selectedPlan) {
      wx.showToast({
        title: '请选择一个套餐',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '正在创建订单...'
    });
    
    // 获取选中的套餐信息
    const selectedPlan = this.data.plans.find(plan => plan.id === this.data.selectedPlan);
    
    // 提取count中的数字部分
    let countValue = 0;
    if (selectedPlan.count.includes('无限')) {
      countValue = -1; // 表示无限次
    } else {
      // 从"10次/月"中提取数字10
      const match = selectedPlan.count.match(/(\d+)/);
      if (match && match[1]) {
        countValue = parseInt(match[1]);
      }
    }
    
    // 调用后端接口创建订单
    getApp().request({
      url: `${getApp().globalData.baseUrl}/create-order`,
      method: 'POST',
      data: {
        planId: this.data.selectedPlan,
        planName: selectedPlan.name,
        price: parseFloat(selectedPlan.price.replace('¥', '')),
        count: countValue,
        countDisplay: selectedPlan.count,
        period: selectedPlan.period,
        openid: this.data.openid
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data && res.data.success) {
          const payParams = res.data.data;
          
          // 调用微信支付
          wx.requestPayment({
            appId:payParams.appId,
            timeStamp: payParams.timeStamp,
            nonceStr: payParams.nonceStr,
            package: payParams.package,
            signType: payParams.signType,
            paySign: payParams.paySign,
            success: (result) => {
              wx.showToast({
                title: '支付成功！',
                icon: 'success'
              });
              
              // 支付成功后查询订单状态
              this.queryOrderStatus(payParams.orderId);
            },
            fail: (errCode, errMsg) => {
              console.error('支付失败:', errCode, errMsg);
              wx.showToast({
                title: '支付已取消',
                icon: 'none'
              });
            }
          });
        } else {
          wx.showToast({
            title: res.data.error,
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('创建订单失败:', error);
        wx.showToast({
          title: '创建订单失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 查询订单状态
  queryOrderStatus: function(orderId) {
    wx.showLoading({
      title: '正在确认订单...'
    });
    
    getApp().request({
      url: `${getApp().globalData.baseUrl}/query-order?orderId=${orderId}`,
      method: 'GET',
      success: (res) => {
        wx.hideLoading();
        if (res.data && res.data.success && res.data.data.status === 'PAID') {
          // 更新用户的套餐信息
          this.updateUserPlan(res.data.data.planId);
        } else {
          wx.showToast({
            title: '订单状态异常',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('查询订单失败:', error);
      }
    });
  },
  
  // 更新用户套餐信息
  updateUserPlan: function(planId) {
    wx.showLoading({
      title: '正在更新套餐...'
    });
    
    getApp().request({
      url: `${getApp().globalData.baseUrl}/update-user-plan`,
      method: 'POST',
      data: {
        planId: planId
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data && res.data.success) {
          wx.showToast({
            title: '套餐更新成功',
            icon: 'success'
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: '套餐更新失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('更新套餐失败:', error);
        wx.showToast({
          title: '更新套餐失败',
          icon: 'none'
        });
      }
    });
  }
}); 