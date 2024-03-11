// pages/student/questionnaire-teacher/questionnaire-teacher.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    formData:[],
    questions: [],
    type: [],
    teacher: '',
    studentNumber: '',
    caseNumber: '',
    group: '',
  },
  onChange: function (event) {
    const index1 = event.currentTarget.dataset.index1; // 获取问题索引
    const value = event.detail; // 获取用户选择的值
    console.log(value);
    // 更新formData中对应问题的数据
    this.setData({
      [`formData[${index1}]`]: value,
    });
  },

  // 文本输入框输入事件处理函数
  onTextareaInput: function (event) {
    const index1 = event.currentTarget.dataset.index1; // 获取问题索引
    const value = event.detail.value; // 获取用户输入的文本

    // 更新formData中对应问题的数据
    this.setData({
      [`formData[${index1}]`]: value,
    });
  },
// 提交问卷事件处理函数
submitForm: function () {
  // 在这里可以将formData发送到后端服务器或云数据库进行存储
  if (this.data.questions.length == this.data.formData.length) {
    for (let i = 0; i < this.data.formData.length; i++) {
      if (this.data.formData[i] == null) {
        wx.showToast({
          title: '未填写完整',
          icon: 'error',
          duration: 3000
        });
        return;
      }
    }

  }
  else {
    wx.showToast({
      title: '未填写完整',
      icon: 'error',
      duration: 3000
    });
    return;
  }
  const db = wx.cloud.database();
  db.collection("student_teacher").where({
    case_number: parseInt(this.data.caseNumber, 10),
    student_number: parseInt(this.data.studentNumber, 10)
  }).get({
    success: (res) => {
      if (res.data.length == 0) {
        db.collection("student_teacher").add({
          data: {
            teacher:this.data.teacher,
            case_number: parseInt(this.data.caseNumber, 10),
            student_number: parseInt(this.data.studentNumber, 10),
            content: this.data.formData,
          },
          success: (res) => {
            wx.showToast({
              title: '提交成功',
              icon: 'success',
              duration: 3000,
              success:()=>{
                wx.navigateBack({
                  url:'../index/index'
                })
              }
            })
          }
        })
      }
      else {
        wx.showToast({
          title: '已填写',
          icon: 'error',
          duration: 3000
        })
      }
    }
  })

},
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      studentNumber: options.studentNumber,
      caseNumber: options.caseNumber,
    });
    const db = wx.cloud.database();
    db.collection("student").where({
      number: parseInt(options.studentNumber, 10)
    }).get({
      success: (res) => {
        console.log(res.data[0].group);
        this.setData({
          group: res.data[0].group,
        });
        db.collection("case").where({
          number: parseInt(options.caseNumber, 10)
        }).get({
          success: (res) => {
            const Case = res.data[0];
            console.log(Case);
            this.setData({
              questions: Case.questions.teacher.title,
              type: Case.questions.teacher.type,
              teacher: Case.teacher[parseInt(this.data.group, 10) - 1],
            })
          }
        });
      }
    });

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