// pages/teacher/current-case/current-case.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    cases:[],
    number:'',
  },
  setCurrentCase(event){
    const index = event.currentTarget.dataset.index;
    const c = this.data.cases[index];
    console.log(c);
    wx.showModal({
      title: '再次确认',
      content: '确认将'+c.title+'更改为当前进行中的案例吗',
      complete: (res) => {
        if (res.cancel) {
          
        }
        if (res.confirm) {
          const db=wx.cloud.database();
          db.collection("admin").where({
            number:parseInt(this.data.number,10) ,
          }).update({
            data:{
              current_case_number:c.number
            },
            success:(res)=>{
              console.log(res.data,"222");
              wx.showToast({
                title: '案例更换成功',
                icon:'success',
                duration:3000,
              });
            }
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
      number: options.number,
    });
    console.log(this.data.number);
    const db=wx.cloud.database();
    db.collection("case").get({
      success:(res)=>{
        this.setData({
          cases:res.data,
        });
      }
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