Page({

  /**
   * 页面的初始数据
   */
  data: {
    number: "",//从页面跳转中带来的参数
    active: 0,//底部标签页显示的参数
    cases: [],
    showPopup: false,
    currentCaseIndex: null,
  },

  onShowPopupFromPanel(event) {
    const index = event.currentTarget.dataset.index;

    // 设置对应案例的 showPanel 为 true，显示对应的 van-panel
    const cases = this.data.cases;
    cases[index].showPanel = true;

    this.setData({
      showPopup: true,
      currentCaseIndex: index,
      cases,
    });
  },

  onClosePopup() {
    // 关闭 van-panel 时将 showPanel 设置为 false
    const cases = this.data.cases;
    cases[this.data.currentCaseIndex].showPanel = false;

    this.setData({
      showPopup: false,
      currentCaseIndex: null,
      cases,
    });
  },
  onChange(event) {
    // event.detail 的值为当前选中项的索引
    this.setData({
      active: event.detail
    });
    if (this.data.active) {
      this.setData({ active: 0 });
      wx.navigateTo({
        url: '../personal-center/personal-center?number=' + this.data.number,
      })
    }
  },
  goToStudentQuestion() {
    const currentCase = this.data.cases[this.data.currentCaseIndex]
    const caseNumber = currentCase.number;
    const studentNumber = this.data.number;
    wx.navigateTo({
      url: '../questionnaire-student/questionnaire-student?studentNumber=' + studentNumber + '&caseNumber=' + caseNumber,
    })
  },
  goToTeacherQuestion() {
    const currentCase = this.data.cases[this.data.currentCaseIndex]
    const caseNumber = currentCase.number;
    const studentNumber = this.data.number;
    wx.navigateTo({
      url: '../questionnaire-teacher/questionnaire-teacher?studentNumber=' + studentNumber + '&caseNumber=' + caseNumber,
    })
  },
  goToCaseQuestion() {
    const currentCase = this.data.cases[this.data.currentCaseIndex]
    const caseNumber = currentCase.number;
    const studentNumber = this.data.number;
    wx.navigateTo({
      url: '../questionnaire-case/questionnaire-case?studentNumber=' + studentNumber + '&caseNumber=' + caseNumber,
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      number: options.number,
    });
    const db = wx.cloud.database();
    db.collection("case").get({
      success: (res) => {
        const caseList = res.data;
        db.collection("admin").get({
          success: (res) => {
            const admin=res.data[0];
            caseList.forEach(c => {
              if (admin.current_case_number == c.number) {
                let temp = [];
                const oneCase =
                  { title: c.title, number: c.number, desc: c.introduction, showPanel: false };
                temp.push(oneCase);
                this.setData({
                  cases: temp,
                });
              }
            });
          }
        })
      }
    })
  },

  /*s*
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