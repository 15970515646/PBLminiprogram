const XLSX = require('../../../utils/xlsx.mini.min');

Page({

  /**
   * 页面的初始数据
   */

  data: {
    cases: [],
    students: [],
    showPopup: false,
    currentCaseIndex: null,
    questions: [],
    options: ["非常符合", "比较符合", "中立", "不符合"],
    optionNumber: [0, 0, 0, 0],
    student_case: [],
    case_sheet: [],
    student_teacher: [],
    teacher_sheet: [],
    student_student: [],
    student_sheet: [],
    tempStudent: null,
    std: null,//离散度标准差
    mean: null,//离散度平均值
    unfinishedStudent: [],
    showData: false,
  },

  showUnfinishedStudent() {
    let temp = [];
    this.data.students.forEach(s => {
      let unfinshed = true;
      this.data.student_student.forEach(element => {
        if (element.case_number == this.data.cases[0].number) {
          if (s.number == element.rater_number) {
            unfinshed = false;
          }
        }
      });
      if (unfinshed == true) {
        temp.push(s);
      }
    });
    this.setData({
      unfinishedStudent: temp,
      showData: true
    });

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
  computeAverageAndDispersion() {
    this.computeAverage();
    this.computeDispersion();
    this.Z_score();
    this.turnZScoreAndFinalMark();
    this.addToDB();
    this.saveFile();
  },
  addToDB() {
    const db = wx.cloud.database();
    this.data.students.forEach(element => {
      db.collection("scores_by_case").where({
        case_number: this.data.cases[this.data.currentCaseIndex].number,
        student_number: element.number,
      }).get({
        success: (res) => {
          if (res.data.length > 0) {
            db.collection("scores_by_case").where({
              case_number: this.data.cases[this.data.currentCaseIndex].number,
              student_number: element.number,
            }).update({
              data: {
                case_number: this.data.cases[this.data.currentCaseIndex].number,
                case_name: this.data.cases[this.data.currentCaseIndex].title,
                student_number: element.number,
                student_name: element.name,
                average: element.average,
                dispersion: element.dispersion,
                dispersion_score: element.dispersion_score,
                group: element.group,
                teacher_mark: element.teacher_mark,
                final_mark: element.final_mark,
                z_score: element.z_score,
              },
              success: (res) => {
                console.log("更新成功");
              }
            })
          }
          else {
            db.collection("scores_by_case").add({
              data: {
                case_number: this.data.cases[this.data.currentCaseIndex].number,
                case_name: this.data.cases[this.data.currentCaseIndex].title,
                student_number: element.number,
                student_name: element.name,
                average: element.average,
                dispersion: element.dispersion,
                dispersion_score: element.dispersion_score,
                group: element.group,
                teacher_mark: element.teacher_mark,
                final_mark: element.final_mark,
                z_score: element.z_score,
              },
              success: (res) => {
                console.log("写入成功");
              }
            })
          }
        }
      })
    });
  },

  saveFile() {
    let sheet = [];
    let title = ['学号', '学生姓名', '案例编号', '案例名称', '组号', '教师评分', '量表得分', '离散度Sj', '标准化直接结果', '标准化后得分', '最终得分'];
    sheet.push(title);
    this.data.students.forEach(element => {
      let data = [element.number, element.name,
      this.data.cases[this.data.currentCaseIndex].number,
      this.data.cases[this.data.currentCaseIndex].title,
      element.group,
      element.teacher_mark,
      element.average,
      element.dispersion,
      element.z_score,
      element.dispersion_score,
      element.final_mark
      ];
      sheet.push(data);
    });
    
    // XLSX插件使用
    var ws = XLSX.utils.aoa_to_sheet(sheet);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this.data.cases[this.data.currentCaseIndex].title + "学生得分");
    var fileData = XLSX.write(wb, {
      bookType: "xlsx",
      type: 'base64'
    });

    let filePath = `${wx.env.USER_DATA_PATH}/` + this.data.cases[this.data.currentCaseIndex].title + '学生得分.xlsx'

    // 写文件
    const fs = wx.getFileSystemManager()
    fs.writeFile({
      filePath: filePath,
      data: fileData,
      encoding: 'base64',
      bookSST: true,
      success(res) {
        console.log(res)
        const sysInfo = wx.getSystemInfoSync()
        // 导出
        if (sysInfo.platform.toLowerCase().indexOf('windows') >= 0) {
          // 电脑PC端导出
          wx.saveFileToDisk({
            filePath: filePath,
            success(res) {
              console.log(res)
            },
            fail(res) {
              console.error(res)
              util.tips("导出失败")
            }
          })
        } else {
          // 手机端导出
          // 打开文档
          wx.openDocument({
            filePath: filePath,
            showMenu: true,
            success: function (res) {
              console.log('打开文档成功')
            }
          })
        }

      },
      fail(res) {

        console.error(res)
        if (res.errMsg.indexOf('locked')) {
          wx.showModal({
            title: '提示',
            content: '文档已打开，请先关闭',
          })
        }

      }
    });
  },

  //转换到[0,10]
  turnZScoreAndFinalMark() {
    this.data.students.forEach(element => {


      element.dispersion_score = 7.5 - 1.5 * element.z_score;
      element.final_mark = 0.9 * element.average + element.dispersion_score;
    });
  },
  getStudentByNumber(number) {
    this.data.students.forEach(element => {
      if (number == element.number) {
        this.setData({
          tempStudent: element
        });
      }
    });
  },
  //标准化
  Z_score() {
    let Xtotal = 0;
    let Xcount = 0;
    this.data.students.forEach(element => {
      Xcount = Xcount + 1;
      Xtotal = Xtotal + element.dispersion;
    });
    this.setData({
      mean: Xtotal / Xcount
    });
    console.log('this.data.mean:', this.data.mean);
    let stdTotal = 0;
    let stdTount = 0;
    this.data.students.forEach(element => {
      stdTount = stdTount + 1;
      stdTotal = stdTotal + (element.dispersion - this.data.mean) * (element.dispersion - this.data.mean);
    });
    this.setData({
      std: Math.sqrt(stdTotal / stdTount),
    });
    this.data.students.forEach(element => {
      element.z_score = (element.dispersion - this.data.mean) / this.data.std;
    });
  },
  //离散度
  computeDispersion() {
    this.data.students.forEach(student => {
      let personCount = 0;
      let Xlist = [];//存放自己对他人的评分偏差
      this.data.student_student.forEach(element => {
        if (element.rater_number == student.number && student.group == element.group && element.case_number == this.data.cases[this.data.currentCaseIndex].number) {
          element.rate.forEach(r => {
            if (r.ratee_number != student.number) {
              personCount = personCount + 1;
              let score = 0;
              r.scores.forEach(s => {
                score = score + s;
              });
              this.getStudentByNumber(r.ratee_number);
              let ratee = this.data.tempStudent;
              Xlist.push(ratee.average - score);
            }
          });
        }
      });
      let Sj = 0;
      let Xtotal = 0;
      Xlist.forEach(x => {
        Xtotal = Xtotal + x * x;
      });
      Sj = Xtotal / personCount;
      student.dispersion = Sj;
    });
  },
  // 量表评分
  computeAverage() {
    //获取基于量表的分数 同学评价30%+老师评分70%
    this.data.students.forEach(student => {
      let temp = [];//存放同学评分的数组
      this.data.student_student.forEach(element => {
        //同一个案例下，相同组，非自己的评分
        if (element.rater_number != student.number && student.group == element.group && element.case_number == this.data.cases[this.data.currentCaseIndex].number) {
          element.rate.forEach(r => {
            if (r.ratee_number == student.number) {
              let scores = 0;
              r.scores.forEach(s => {
                scores = scores + s;
              });
              temp.push(scores);
            }
          });
        }
      });
      if (temp.length != 0) {
        let average = 0;
        let total = 0;
        temp.forEach(element => {
          total = total + element;
        });
        average = student.teacher_mark * 0.7 + 0.3 * (total / temp.length);
        student.average = average;
      }
    });
  },

  goToStudentCompute() {
    const db = wx.cloud.database();
    db.collection('case').where({
      number: this.data.cases[this.data.currentCaseIndex].number,
    }).get({
      success: (res) => {
        this.setData({
          questions: res.data[0].questions.student.title
        });
        this.queryStudentStudent(0)
      }
    });
  },

  queryStudentStudent: function (skip) {
    const students = this.data.students;
    const student_student = this.data.student_student;
    let tempSheet = []
    students.forEach(student => {
      student_student.forEach(element => {
        if (student.number == element.rater_number && element.case_number == this.data.cases[this.data.currentCaseIndex].number) {
         
          element.rate.forEach(r => {
            let row = [];
            row.push(element.rater_number);
            row.push(student.name);
            row.push(element.case_number);
            row.push(this.data.cases[this.data.currentCaseIndex].title);
            row.push(r.ratee_number);
            row.push(r.ratee_name);
            row.push(student.group);
            row = row.concat(r.scores);
            tempSheet.push(row);
          });
        }
      });
    });
    this.setData({
      student_sheet: tempSheet,
    });
    this.exportStudent(this.data.student_sheet);

  },
  //88.5-81,91.1-93,90.8-85

  //应该判断是pc端还是手机端，然后手机端使用打开文件然后转发的形式保存文件
  exportStudent(data) {
    this.setData({
      student_sheet: []
    });
    let sheet = []
    //excel 行头
    let title = ['评分者学号', '评分者姓名', '案例编号', '案例名称', '被评者学号', '被评者姓名', '组号'];
    title = title.concat(this.data.questions);
    sheet.push(title);
    sheet = sheet.concat(data);

    // XLSX插件使用
    var ws = XLSX.utils.aoa_to_sheet(sheet);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this.data.cases[this.data.currentCaseIndex].title + "学生评价结果");
    var fileData = XLSX.write(wb, {
      bookType: "xlsx",
      type: 'base64'
    });

    let filePath = `${wx.env.USER_DATA_PATH}/` + this.data.cases[this.data.currentCaseIndex].title + '学生评价结果.xlsx'

    // 写文件
    const fs = wx.getFileSystemManager()
    fs.writeFile({
      filePath: filePath,
      data: fileData,
      encoding: 'base64',
      bookSST: true,
      success(res) {
        const sysInfo = wx.getSystemInfoSync()
        // 导出
        if (sysInfo.platform.toLowerCase().indexOf('windows') >= 0) {
          // 电脑PC端导出
          wx.saveFileToDisk({
            filePath: filePath,
            success(res) {
              console.log(res)
            },
            fail(res) {
              console.error(res)
              util.tips("导出失败")
            }
          })
        } else {
          // 手机端导出
          // 打开文档
          wx.openDocument({
            filePath: filePath,
            showMenu: true,
            success: function (res) {
              console.log('打开文档成功')
            }
          })
        }

      },
      fail(res) {

        console.error(res)
        if (res.errMsg.indexOf('locked')) {
          wx.showModal({
            title: '提示',
            content: '文档已打开，请先关闭',
          })
        }

      }
    });
  },


  goToTeacherCompute() {
    const db = wx.cloud.database();
    db.collection('case').where({
      number: this.data.cases[this.data.currentCaseIndex].number,
    }).get({
      success: (res) => {
        this.setData({
          questions: res.data[0].questions.teacher.title
        });
        this.queryStudentTeacher(0)
      }
    });
  },
  queryStudentTeacher: function (skip) {
    const db = wx.cloud.database();
    const collection = db.collection('student_teacher');
    //一次最多查询20条记录
    const pageSize = 20;

    collection.skip(skip).limit(pageSize).where({
      case_number: this.data.cases[this.data.currentCaseIndex].number,
    }).get({
      success: async (res) => {
        const data = res.data;
        if (data.length > 0) {
          console.log(`第 ${skip / pageSize + 1} 页数据:`, data);

          // 处理当前页的数据
          this.setData({
            student_teacher: this.data.student_teacher.concat(data),
          });

          // 使用 Promise.all 处理异步查询
          const promises = data.map(element => {
            return new Promise((resolve, reject) => {
              db.collection("student").where({
                number: element.student_number,
              }).get({
                success: (res) => {
                  let row = [];
                  row.push(element.student_number);
                  row.push(res.data[0].name);
                  row.push(element.case_number);
                  row.push(this.data.cases[this.data.currentCaseIndex].title);
                  row.push(element.teacher);
                  row.push(res.data[0].group);
                  row = row.concat(element.content);
                  resolve(row);
                },
                fail: (err) => {
                  reject(err);
                }
              });
            });
          });

          try {
            const sheet1 = await Promise.all(promises);
            this.setData({
              teacher_sheet: this.data.teacher_sheet.concat(sheet1),
            })
            // 继续查询下一页数据
            this.queryStudentTeacher(skip + pageSize);

            // 在最后一页数据的异步查询结束后调用 exportCase 函数
            if (data.length < pageSize) {
              this.exportTeacher(this.data.teacher_sheet);
            }
          } catch (err) {
            console.error('查询失败', err);
          }
        } else {
          // 全部数据查询完毕
          console.log('所有数据查询完毕');
        }
      },
      fail: (err) => {
        console.error('查询失败', err);
      }
    });
  },


  //应该判断是pc端还是手机端，然后手机端使用打开文件然后转发的形式保存文件
  exportTeacher(data) {
    let sheet = []
    //excel 行头
    let title = ['学号', '姓名', '案例编号', '案例名称', '教师', '组号'];
    title = title.concat(this.data.questions);
    sheet.push(title);
    sheet = sheet.concat(data);
    sheet.push(["教师姓名", "非常符合", "比较符合", "中立", "不符合"]);
    const teacherList = this.data.cases[this.data.currentCaseIndex].teacher;
    teacherList.forEach(t => {
      let option1 = 0, option2 = 0, option3 = 0, option4 = 0;
      let row = [];
      this.data.student_teacher.forEach(element => {
        if (element.teacher == t) {
          element.content.forEach(e => {
            if (e == '非常符合') option1++;
            if (e == '比较符合') option2++;
            if (e == '中立') option3++;
            if (e == '不符合') option4++;
          });
        }
      });
      row = [t, option1, option2, option3, option4];
      sheet.push(row);
    });
    // XLSX插件使用
    var ws = XLSX.utils.aoa_to_sheet(sheet);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this.data.cases[this.data.currentCaseIndex].title + "教师评价结果");
    var fileData = XLSX.write(wb, {
      bookType: "xlsx",
      type: 'base64'
    });

    let filePath = `${wx.env.USER_DATA_PATH}/` + this.data.cases[this.data.currentCaseIndex].title + '教师评价结果.xlsx'

    // 写文件
    const fs = wx.getFileSystemManager()
    fs.writeFile({
      filePath: filePath,
      data: fileData,
      encoding: 'base64',
      bookSST: true,
      success(res) {
        console.log(res)
        const sysInfo = wx.getSystemInfoSync()
        // 导出
        if (sysInfo.platform.toLowerCase().indexOf('windows') >= 0) {
          // 电脑PC端导出
          wx.saveFileToDisk({
            filePath: filePath,
            success(res) {
              console.log(res)
            },
            fail(res) {
              console.error(res)
              util.tips("导出失败")
            }
          })
        } else {
          // 手机端导出
          // 打开文档
          wx.openDocument({
            filePath: filePath,
            showMenu: true,
            success: function (res) {
              console.log('打开文档成功')
            },
            fail: console.error
          })
        }

      },
      fail(res) {

        console.error(res)
        if (res.errMsg.indexOf('locked')) {
          wx.showModal({
            title: '提示',
            content: '文档已打开，请先关闭',
          })
        }

      }
    });
  },
  goToCaseCompute() {
    const db = wx.cloud.database();
    db.collection('case').where({
      number: this.data.cases[this.data.currentCaseIndex].number,
    }).get({
      success: (res) => {
        this.setData({
          questions: res.data[0].questions.case.title
        });
        this.queryStudentCase(0)
      }
    });


  },
  queryStudentCase: function (skip) {
    const db = wx.cloud.database();
    const collection = db.collection('student_case');
    //一次最多查询20条记录
    const pageSize = 20;

    collection.skip(skip).limit(pageSize).where({
      case_number: this.data.cases[this.data.currentCaseIndex].number,
    }).get({
      success: async (res) => {
        const data = res.data;
        if (data.length > 0) {
          console.log(`第 ${skip / pageSize + 1} 页数据:`, data);

          // 处理当前页的数据
          this.setData({
            student_case: this.data.student_case.concat(data),
          });

          // 使用 Promise.all 处理异步查询
          const promises = data.map(element => {
            return new Promise((resolve, reject) => {
              db.collection("student").where({
                number: element.student_number,
              }).get({
                success: (res) => {
                  let row = [];
                  row.push(element.student_number);
                  row.push(res.data[0].name);
                  row.push(element.case_number);
                  row.push(this.data.cases[this.data.currentCaseIndex].title);
                  row = row.concat(element.content);
                  resolve(row);
                },
                fail: (err) => {
                  reject(err);
                }
              });
            });
          });

          try {
            const sheet1 = await Promise.all(promises);
            this.setData({
              case_sheet: this.data.case_sheet.concat(sheet1),
            })
            // 继续查询下一页数据
            this.queryStudentCase(skip + pageSize);

            // 在最后一页数据的异步查询结束后调用 exportCase 函数
            if (data.length < pageSize) {
              this.exportCase(this.data.case_sheet);
            }
          } catch (err) {
            console.error('查询失败', err);
          }
        } else {
          // 全部数据查询完毕
          console.log('所有数据查询完毕');
        }
      },
      fail: (err) => {
        console.error('查询失败', err);
      }
    });
  },


  //应该判断是pc端还是手机端，然后手机端使用打开文件然后转发的形式保存文件
  exportCase(data) {
    let sheet = []
    //excel 行头
    let title = ['学号', '姓名', '案例编号', '案例名称'];
    title = title.concat(this.data.questions);
    sheet.push(title);
    sheet = sheet.concat(data);
    //统计四种选项数量
    let option1 = 0, option2 = 0, option3 = 0, option4 = 0;
    this.data.student_case.forEach(element => {
      element.content.forEach(e => {
        if (e == '非常符合') option1++;
        if (e == '比较符合') option2++;
        if (e == '中立') option3++;
        if (e == '不符合') option4++;
      });
    });
    this.setData({
      student_case: [],
      optionNumber: [option1, option2, option3, option4],
    });
    sheet.push(this.data.options);
    sheet.push(this.data.optionNumber);
    // XLSX插件使用
    var ws = XLSX.utils.aoa_to_sheet(sheet);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this.data.cases[this.data.currentCaseIndex].title + "评价结果");
    var fileData = XLSX.write(wb, {
      bookType: "xlsx",
      type: 'base64'
    });

    let filePath = `${wx.env.USER_DATA_PATH}/` + this.data.cases[this.data.currentCaseIndex].title + '案例评价结果.xlsx'

    // 写文件
    const fs = wx.getFileSystemManager()
    fs.writeFile({
      filePath: filePath,
      data: fileData,
      encoding: 'base64',
      bookSST: true,
      success(res) {
        console.log(res)
        const sysInfo = wx.getSystemInfoSync()
        // 导出
        if (sysInfo.platform.toLowerCase().indexOf('windows') >= 0) {
          // 电脑PC端导出
          wx.saveFileToDisk({
            filePath: filePath,
            success(res) {
              console.log(res)
            },
            fail(res) {
              console.error(res)
              util.tips("导出失败")
            }
          })
        } else {
          // 手机端导出
          // 打开文档
          wx.openDocument({
            filePath: filePath,
            showMenu: true,
            success: function (res) {
              console.log('打开文档成功')
            },
            fail: console.error
          })
        }

      },
      fail(res) {

        console.error(res)
        if (res.errMsg.indexOf('locked')) {
          wx.showModal({
            title: '提示',
            content: '文档已打开，请先关闭',
          })
        }

      }
    });
  },



  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const db = wx.cloud.database();
    db.collection("case").get({
      success: (res) => {
        const caseList = res.data;
        db.collection("admin").get({
          success: (res) => {
            const admin = res.data[0];
            caseList.forEach(c => {
              if (admin.current_case_number == c.number) {
                let temp = [];
                const oneCase =
                  { title: c.title, number: c.number, desc: c.introduction, teacher: c.teacher, showPanel: false };
                temp.push(oneCase);
                this.setData({
                  cases: temp,
                });

              }
            });

          }
        })
      }
    });
    this.queryStudents(0);
    this.queryStudentStudentOnLoad(0);
  },
  queryStudentStudentOnLoad(skip) {
    const db = wx.cloud.database();
    const collection = db.collection('student_student');

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
            student_student: this.data.student_student.concat(data),
          });
          // 继续查询下一页数据
          this.queryStudentStudentOnLoad(skip + pageSize);
        } else {
          console.log('所有数据查询完毕');
        }
      },
      fail: (err) => {
        console.error('查询失败', err);
      }
    });

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