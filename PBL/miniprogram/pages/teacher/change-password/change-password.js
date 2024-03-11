// pages/teacher/change-password/change-password.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    number: "",
    oldPassword: '',
    newPassword: '',
    confirmPassword: "",
    errorMessage: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: "",
    },
  },
  onOldPasswordChange(e) {
    this.setData({
      oldPassword: e.detail.value,
    })
  },
  onNewPasswordChange(e) {
    this.setData({
      newPassword: e.detail.value,
    })
  },
  onConfirmPasswordChange(e) {
    this.setData({
      confirmPassword: e.detail.value,
    })
  },
  // 确认修改密码
  confirmChange() {
    // 在这里处理确认修改密码的逻辑
    const number = this.data.number;
    const oldPassword = this.data.oldPassword;
    const newPassword = this.data.newPassword;
    const confirmPassword = this.data.confirmPassword;
    if (oldPassword == "") {
      this.setData({
        "errorMessage.oldPassword": "旧密码不能为空",
        "errorMessage.newPassword": "",
        "errorMessage.confirmPassword": "",
      })
      return;
    }
    if (newPassword == "") {
      this.setData({
        "errorMessage.oldPassword": "",
        "errorMessage.newPassword": "新密码不能为空",
        "errorMessage.confirmPassword": "",
      });
      return;
    }
    if (confirmPassword == "") {
      this.setData({
        "errorMessage.oldPassword": "",
        "errorMessage.newPassword": "",
        "errorMessage.confirmPassword": "确认密码不能为空",
      });
      return;
    }
    if (newPassword != confirmPassword) {
      this.setData({
        "errorMessage.oldPassword": "",
        "errorMessage.newPassword": "新密码和确认密码不一致",
        "errorMessage.confirmPassword": "新密码和确认密码不一致",
      });
      return;
    }
    const db = wx.cloud.database();
    db.collection("admin").where({
      "number": parseInt(number,10)
    }).get({
      success: (res) => {
        if (res.data.length > 0) {
          const teacher = res.data[0];
          const password = teacher["password"];
          if (oldPassword == password) {
            this.updatePassword(number, newPassword);
          }

          else {
            this.setData({
              "errorMessage.oldPassword": "密码错误",
              "errorMessage.newPassword": "",
              "errorMessage.confirmPassword": "",
            });
          }
        }
      }
    })
  },

  updatePassword(number, newPassword) {
    this.setData({
      "errorMessage.oldPassword": "",
      "errorMessage.newPassword": "",
      "errorMessage.confirmPassword": "",
    });
    const db = wx.cloud.database();
    db.collection("admin").where({
      "number":  parseInt(number,10)
    }).update({
      data: {
        "password": newPassword
      },
      success: (res) => {
        wx.showToast({
          title: '修改成功',
          icon: "success",
          duration: 3000,
          success:  ()=>{
            wx.reLaunch({
              url: '../../index/index',
            })
          }
        })
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      number: options.number
    })

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})