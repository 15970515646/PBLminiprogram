// pages/student/questionnaire-student/questionnaire-student.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    studentNumber: "",
    caseNumber: "",
    group: "",
    max_mark: [],
    questions: [],
    students: [],
    currentQuestionIndex: null,
    currentStudentIndex: null,
    scores: [],
  },


  onRateChange(event) {
    // 监听星级评分变化
    const value = event.detail;
    const index1 = event.currentTarget.dataset.index1; // 问题的索引
    const index2 = event.currentTarget.dataset.index2; // 学生的索引

    // 更新得分的二维数组
    this.data.scores[index1] = this.data.scores[index1] || [];
    this.data.scores[index1][index2] = value;
  },

  submitForm() {
    // 在这里处理提交问卷的逻辑
    for (let i = 0; i < this.data.questions.length; i++) {
      // 遍历每一列
      if(this.data.scores[i]=== undefined || this.data.scores[i] === null) {
        wx.showToast({
          title: '未填写完整',
          icon: 'none',
          duration: 3000,
        });
        return;
      }
      for (let j = 0; j < this.data.students.length; j++) {
        // 判断当前元素是否为空值（undefined 或 null）
        
        if (this.data.scores[i][j] === undefined || this.data.scores[i][j] === null) {
          wx.showToast({
            title: '未填写完整',
            icon: 'none',
            duration: 3000,
          });
          return;
        }
      }
    }
    console.log('提交问卷');
    console.log(this.data.scores);
    
    let data = {
      rater_number:parseInt(this.data.studentNumber,10) ,
      case_number:parseInt(this.data.caseNumber,10) ,
      rate: [],
      group:parseInt(this.data.group,10),
    }
    const students = this.data.students;
    const questions = this.data.questions;
    for (let i = 0; i < students.length; i++) {
      const ratee_number = students[i].number;
      const ratee_name = students[i].name;
      let temp = []
      for (let j = 0; j < questions.length; j++) {
        const element = this.data.scores[j][i];
        temp.push(element);
      }
      data.rate.push({
        ratee_number: ratee_number,
        ratee_name:ratee_name,
        scores: temp
      });
    }
    const db = wx.cloud.database();
    db.collection("student_student").where({
      "case_number": this.data.caseNumber,
      "rater_number": this.data.studentNumber,
    }).get({
      success: (res) => {
        if (res.data.length == 0) {
          db.collection("student_student").add({
            data: data
          });
          wx.showToast({
            title: '填写成功',
            icon: 'success',
            duration: 3000,
            success: () => {
              wx.navigateBack({
                url: '../index/index'
              })
            }
          });
        }
        else {
          wx.showToast({
            title: '已填写',
            icon: 'none',
            duration: 3000,
          });
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
    console.log("casenumber:", options.caseNumber);
    db.collection("student").where({
      number: parseInt(options.studentNumber, 10)
    }).get({
      success: (res) => {
        const student = res.data[0];
        this.setData({
          "group": student["group"],
        });
        this.qureyStudent();
      },
      fail: (error) => {
        console.error('查询失败，错误信息:', error);
      }
    });
    db.collection("case").where({
      number: parseInt(options.caseNumber, 10)
    }).get({
      success: (res) => {
        const Case = res.data[0];
        this.setData({
          questions: Case.questions.student.title,
          max_mark: Case.questions.student.max_mark,
        });
      }
    });
  },
  qureyStudent() {
    const db = wx.cloud.database();
    db.collection("student").where({
      "group": this.data.group
    }).get({
      success: (res) => {
        console.log(res.data);
        this.setData({
          students: res.data
        })
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