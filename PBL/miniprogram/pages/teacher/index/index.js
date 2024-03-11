const XLSX = require('../../../utils/xlsx.mini.min');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    questionnaireData: null, // 存储问卷数据
    number: "",//从页面跳转中带来的参数
    active: 0,
    mainActiveIndex: 0,
    activeId: null,
    filePath: "",
    filename: "",
  },


  onClickNav({ detail = {} }) {
    this.setData({
      mainActiveIndex: detail.index || 0,
    });
  },

  onClickItem({ detail = {} }) {
    const activeId = this.data.activeId === detail.id ? null : detail.id;

    this.setData({ activeId });
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

  //上传老师给学生的评分
  chooseTeacherFile: function () {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const filePath = res.tempFiles[0].path;
        // 使用xlsx库解析文件
        this.readTeacherFile(filePath);
      },
      fail: (err) => {
        console.error('选择文件失败', err);
      },
    });
  },

  //处理老师评分
  readTeacherFile: function (filePath) {
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'binary',
      success: (res) => {
        const data = res.data;
        // 将二进制数据解析为Workbook对象
        const workbook = XLSX.read(data, { type: 'binary' });
        // 获取第一个Sheet的数据
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // 将Sheet的数据转为array格式
        const arrayData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        // 更新数据
        for (let i = 1; i < arrayData.length; i++) {
          const element = arrayData[i];
          const db = wx.cloud.database();
          db.collection("student").where({
            number: element[1],
          }).update({
            data: {
              teacher_mark: element[2],
            },
            success: function (res) {
              console.log(res.data)
            }
          });
        }
        wx.showToast({
          title: '老师评分导入成功',
          icon:'success',
          duration:3000,
        });
      },
      fail: (err) => {
        console.error('读取文件失败', err);
      },
    });
  },
  //上传学生信息文件
  chooseStudentFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const filePath = res.tempFiles[0].path;
        // 使用xlsx库解析文件
        this.readStudentFile(filePath);
      },
      fail: (err) => {
        console.error('选择文件失败', err);
      },
    });
  },
  //处理学生信息
  readStudentFile: function (filePath) {
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'binary',
      success: (res) => {
        const data = res.data;
        // 将二进制数据解析为Workbook对象
        const workbook = XLSX.read(data, { type: 'binary' });

        // 获取第一个Sheet的数据
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // 将Sheet的数据转为array格式
        const arrayData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        // 更新数据
        for (let i = 1; i < arrayData.length; i++) {
          const element = arrayData[i];
          const db = wx.cloud.database();
          db.collection("student").where({
            number: element[1],
          }).get({
            success: (res) => {
              if (res.data.length == 0) {
                db.collection("student").add({
                  data: {
                    number: element[1],
                    name: element[0],
                    group: element[2],
                    final_mark: -1,
                    teacher_mark: -1,
                    password: "123"
                  }
                });
              }
              else {
                console.log(Element[1], "已存在");
              }
            }
          })
        }
        wx.showToast({
          title: '学生导入成功',
          icon:'success',
          duration:3000,
        });
      },
      fail: (err) => {
        console.error('读取文件失败', err);
      },
    });
  },
  //上传案例信息文件
  chooseCaseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const filePath = res.tempFiles[0].path;

        // 使用xlsx库解析文件
        this.readCaseFile(filePath);
      },
      fail: (err) => {
        console.error('选择文件失败', err);
      },
    });
  },
  readCaseFile(filePath) {
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'binary',
      success: (res) => {
        const data = res.data;

        // 将二进制数据解析为Workbook对象
        const workbook = XLSX.read(data, { type: 'binary' });

        // 获取第一个Sheet的数据
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // 将Sheet的数据转为array格式
        const arrayData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        // 更新数据
        console.log(arrayData);
        console.log(arrayData[1][0]);
       let caseData={
        title:arrayData[1][0],
        number:arrayData[1][1],
        introduction:arrayData[1][2],
        teacher:[],
        questions:{
          case:{
            title:[],
            type:[]
          },
          teacher:{
            title:[],
            type:[]
          },
          student:{
            title:[],
            max_mark:[]
          },
        },
       };
       for (let i = 1; i < arrayData.length; i++) {
         const element = arrayData[i];
         console.log(element);
         if(element[3]!=null){
           caseData.teacher.push(element[3]);
         }
         if(element[4]!=null&element[5]!=null){
          caseData.questions.student.title.push(element[4]);
          caseData.questions.student.max_mark.push(element[5]);
         }
         if(element[6]!=null&element[7]!=null){
          caseData.questions.teacher.title.push(element[6]);
          caseData.questions.teacher.type.push(element[7]);
         }
         if(element[8]!=null&element[9]!=null){
          caseData.questions.case.title.push(element[8]);
          caseData.questions.case.type.push(element[9]);
         }
       }
       const db=wx.cloud.database();
       db.collection("case").where({
         number:arrayData[1][1]
       }).get({
         success:(res)=>{
           if(res.data.length>0){
            wx.showToast({
              title: '案例编号重复',
              icon:'none',
              duration:3000,
            });
           }
           else{
             db.collection("case").add({
               data:caseData,
               success:(res)=>{
                wx.showToast({
                  title: '案例导入成功',
                  icon:'success',
                  duration:3000,
                });
               }
             })
           }
         }
       })
      },
      fail: (err) => {
        console.error('读取文件失败', err);
      },
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options.number)
    this.setData({
      number: options.number,
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