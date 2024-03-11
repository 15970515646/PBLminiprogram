Page({

  /**
   * 页面的初始数据
   */
  data: {
    number: '',
    password: '',
    errorMessage: {
      number: '', // 存放工号输入框的错误消息
      password: '', // 存放密码输入框的错误消息
    },
  },

  onNumberInput(event) {
    // 输入工号时触发的事件
    console.log(event.detail.value);
    this.setData({
      number: event.detail.value,
    });
  },

  onPasswordInput(event) {
    // 输入密码时触发的事件
    console.log(event.detail.value);
    this.setData({
      password: event.detail.value,
    });
  },

  studentLogin() {
    // 在这里处理登录逻辑，可以调用云函数或发送请求等
    const number = this.data.number;
    const inputPassword = this.data.password;
    // 老师登录逻辑
    if (number == "" ) {
      this.setData({
        "errorMessage.number": "工号不能为空",
        "errorMessage.password": ""
      });
      return;
    }
    if (inputPassword == "") {
      this.setData({
        "errorMessage.number": "",
        "errorMessage.password": "密码不能为空"
      });
      return;
    }
    const db = wx.cloud.database();
    
    //数据库查询工号
    db.collection("admin").where({
      number: parseInt(number,10)
    }).get({
      success: (res) => {
        console.log(res.data);
        //如果用户存在
        if (res.data.length > 0) {
          const admin = res.data[0];
          const password = admin["password"];
          //密码正确
          if (inputPassword == password) {
            this.setData({
              "errorMessage.number": "",
              "errorMessage.password": ""
            })
            wx.showToast({
              title: '登录成功',
              icon: 'success',
              duration: 3000,
              success: function () {
                wx.navigateTo({
                  url: '../teacher/index/index?number=' + number,
                })
              }
            })
          }
          //密码错误
          else {
            this.setData({
              "errorMessage.number": "",
              "errorMessage.password": "密码错误"
            })

          }
        }
        else {
          this.setData({
            "errorMessage.number": "工号不存在",
            "errorMessage.password": ""
          })
        }
      }
    })



  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})