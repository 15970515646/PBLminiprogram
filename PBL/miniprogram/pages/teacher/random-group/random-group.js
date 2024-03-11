// pages/teacher/random-group/random-group.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    students: [],
    numberOfGroups: '', // 存储用户输入的数字
    groupedStudents: [],
  },
  //将分好组的学生归类到对应group
  groupStudentsByGroup: function () {
    console.log("111");
    const students = this.data.students;
    students.forEach(element => {
      console.log(element.group);
      if(element.group=='') return;
    });
    console.log("111");
    const groupedStudents = students.reduce((groups, student) => {
      const groupNumber = student.group;
      // 如果该组号不存在，则创建一个新的组
      if (!groups[groupNumber]) {
        groups[groupNumber] = [];
      }
      // 将学生添加到相应组中
      groups[groupNumber].push(student);
      return groups;
    }, {});
    this.setData({
      groupedStudents: groupedStudents,
    });
  },
  //分组
  randomGrouping: function () {
    const students = [...this.data.students];
    const groupCount = this.data.numberOfGroups;
    const shuffledStudents = this.shuffleArray(students);
    let currentGroup = 0;

    shuffledStudents.forEach((student) => {
      student.group = currentGroup + 1;
      currentGroup = (currentGroup + 1) % groupCount;
    });
    console.log(shuffledStudents);
    this.setData({
      students: shuffledStudents,
    });
    this.groupStudentsByGroup();
  },

  // 打乱数组顺序的辅助函数
  shuffleArray: function (array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },
  //输入组号
  onInput: function (event) {
    console.log('Input event:', event);
    const value = event.detail;
    this.setData({
      numberOfGroups: value,
    });
    console.log('用户输入的数字:', value);
  },
  //点击分组
  onConfirm: function () {
    const numberOfGroups = this.data.numberOfGroups;
    const numericValue = parseFloat(numberOfGroups);
    if (!numberOfGroups || numericValue<1) {
      wx.showToast({
        title: '请输入大于零的整数',
        icon: 'none',
      });
      return;
    }

    // 处理用户输入的数字
    wx.showModal({
      title: '再次确认',
      content: `您确认要创建 ${numberOfGroups} 个组吗？`,
      success: (res) => {
        if (res.confirm) {
          // 用户点击了确认按钮
          this.randomGrouping();
          const students = this.data.students;
          for (let i = 0; i < students.length; i++) {
            const element = students[i];
            const db = wx.cloud.database();
            db.collection("student").where({
              number: element.number,
            }).update({
              data: {
                group: element.group,
              },
            })
          }
        }
      }
    });

    // 在这里可以进行其他逻辑处理

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.queryStudents(0);
    
   
  },
  queryStudents: function (skip) {
    const db = wx.cloud.database();
    const collection = db.collection('student'); // 替换为实际的集合名称

    // 每页显示的条数
    const pageSize = 20;

    // 查询数据
    collection.skip(skip).limit(pageSize).get({
      success: (res) => {
        const data = res.data;

        if (data.length > 0) {
          console.log(`第 ${skip / pageSize + 1} 页数据:`, data);
          // 处理当前页的数据
          // 将当前页的数据追加到数组中
          this.setData({
            students: this.data.students.concat(data),
          });
          // 继续查询下一页数据
          this.queryStudents(skip + pageSize);
        } else {
          this.groupStudentsByGroup();
          console.log('所有数据查询完毕');
        }
      },
      fail: (err) => {
        console.error('查询失败', err);
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