const app = getApp()
const db = wx.cloud.database()
const _ = db.command;
const todo2=db.collection("zan")
const todo=db.collection("forum")
var that = null;
Page({
  data:{
myid:{},
img:null,
btn:true
 },
 pageData:{

},
praise:function(){
  if(that.data.btn){
  todo2.where({
    tiezi:that.data.item._id,//保证是这个帖子
    _openid:this.data.myid//用户openid和帖主openid
  }).get().then(
    res=>{
      if(res.data[0]){//如果存在 不存在就建立一个记录
        //console.log(res.data[0]._id)
        if(res.data[0].state==false){//未点赞
          todo.doc(that.data.item._id).update({
            data: {
              praise: _.inc(1),
            },
          })
          todo2.doc(res.data[0]._id).update({
            data: {
              state:true,
            },
          })
          that.setData({
            img: "../../images/线性爱心点赞图标.svg"
          })
          setTimeout(function () {
            that.setData({
              img: "../../images/线性斜领子图标.svg"
            })
            }, 1000)
        }
        if(res.data[0].state==true){
          todo.doc(that.data.item._id).update({
            data: {
              praise: _.inc(-1),
            },
          })
          todo2.doc(res.data[0]._id).update({
            data: {
              state:false,
            },
          })

          that.setData({
            img: "../../images/爆炸.gif"
          })
          setTimeout(function () {
            that.setData({
              img: "../../images/线性点赞图标2.svg"
            })
            }, 1000)
        }
      }
      else{//如果数据库里还没这个人的赞
        todo2.add({
          data:{
              state:true,
              tiezi:that.data.item._id
          }
          
        })
        todo.doc(that.data.item._id).update({
          data: {
            praise: _.inc(1),
          },
        })
        that.setData({
          img: "../../images/线性爱心点赞图标.svg"
        })
        setTimeout(function () {
          that.setData({
            img: "../../images/线性斜领子图标.svg"
          })
          }, 1000)
      }
      });
      that.setData({
        btn:false
      })
      setTimeout(function () {
        todo.doc(that.data.item._id).get().then(res=>{
          that.data.item.praise=res.data.praise;
          that.setData({
            item:that.data.item,
        btn:true
          })
        })
       }, 1000)
      }
},

  onLoad(){
    that = this;
    wx.cloud.callFunction({
      name: 'login1',
      data: {},
      success: res2 => {
        //console.log('[云函数] [login] user openid: ', res2.result.openid)
        this.setData({
          myid:res2.result.openid
        })
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
        }
    });
    that.setData({
      item:app.globalData.item,
     
    });
    todo2.where({
      tiezi:that.data.item._id,//保证是这个帖子
      _openid:this.data.myid//用户openid和帖主openid
    }).get().then(res=>{
      if(res.data[0]){
        if(res.data[0].state==false){
          that.setData({
            img: "../../images/线性点赞图标2.svg"
          })
        }
        else{
          that.setData({
            img: "../../images/线性斜领子图标.svg"
          })
        }
      }
      else{
        that.setData({
          img: "../../images/线性点赞图标2.svg"
        })
      }
    })
  },
  onShow(){
    that.init();
    wx.getSetting({
      success(res){
       
      }
    })
  },
  init(){
    //加载帖子的评论
    db.collection('comment').where({
      pid:that.data.item._id
    }).get()
    .then(result => {
      let items = result.data.map(item =>{
        item.date = app.nowdate(item.date);
        return item;
      })
      that.setData({
        comment:items,
        text:''
      })
      wx.hideLoading();
      wx.hideNavigationBarLoading();
    })
  },
  gettext(e){
    that.setData({
      text: e.detail.value
    })
  },
  comment(e){
    //提交评论
    if(e.detail.userInfo){
      
      that.authorname = e.detail.userInfo.nickName;
      that.authorimg = e.detail.userInfo.avatarUrl;
      if(that.data.text.length>3){
        wx.showLoading({
          title: '评论中',
          mask:true
        })
        //文字安全检查
        wx.cloud.callFunction({
          name:'textsec',//云函数名称
          data:{
            text:that.data.text//检测的文字
          },
          success(){//文字安全
            //TODO 评论帖子
            db.collection('comment').add({
              data: {
                pid:that.data.item._id,
                content:that.data.text,
                date:new Date(),
                authorname:that.authorname,
                authorimg:that.authorimg
              }
            }).then(result => {
              that.init();
              wx.cloud.callFunction({
                name: 'msgMe1',
                data:{
                  commentId:result._id,
                  openid:that.data.item._openid

                }
              })
            })
            //TODO 评论帖子
          },
          fail(e){//文字不安全
            wx.hideLoading();
            wx.showModal({
              title:'提示',
              content:'你的评论中有不安全内容，请修整后重试',
              showCancel:false
            })
          }
        })
      }
      else{
        wx.showModal({
          title:'提示',
          content:'需要写5个字以上才能发表评论',
          showCancel:false
        })
      }
    }
    else{
      wx.showModal({
        title:'提示',
        content:'为了实名安全考虑，你需要授权信息才可以发表评论',
        showCancel:false
      })
    }
  },
  removeitem(e){
    //删除自己的评论
    wx.showLoading({
      title: '删除中',
      mask:true
    })
    console.log(e);
    db.collection('comment').doc(e.currentTarget.dataset.item._id).remove()
    .then(res => {
        that.init();
    }).catch(err=>console.log(err))
  },
  previewimg(e) {
    //浏览图片
    wx.previewImage({
      urls: that.data.item.image,
      current: e.currentTarget.dataset.url
    })
  },
  removemain(e){
    wx.showModal({
      title: '提示',
      content: '是否要删除该帖子',
      success(res) {
        if(res.confirm){
          wx.showLoading({
            title: '删除中',
            mask:true
          })
          console.log(e);
          db.collection('forum').doc(that.data.item._id).remove()
          .then(res => {
            wx.cloud.deleteFile({
              fileList:that.data.item.image
            }).then(result => {
              wx.navigateBack({
                delta:1
              })
            });
          }).catch(err=>{
            wx.navigateBack({
              delta:1
            })
          })
        }
      }
    });

  },
  viewLocation:function(){
    wx.openLocation({
      latitude: that.data.item.latitude,
      longitude: that.data.item.longitude,
      name:that.data.item.name,
      address:that.data.item.address,

    })
  },
  getRight:function(e){
    wx.requestSubscribeMessage({
      tmplIds: ['9ykXNArFlm8e_M2ZJkXS5GiRYKW6P31NjmVxkErZKmQ'],
     success (res) { 
     }
    })

 },
})
