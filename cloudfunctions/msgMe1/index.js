const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const todos = db.collection('comment')
//const todoss = db.collection('forum')

exports.main = async (event, context) => {
  
  let comment = await todos.doc(event.commentId).get();
  //let item = await todoss.doc(event.openid).get();

  try {
    const result = await cloud.openapi.subscribeMessage.send({
      touser: event.openid,
      lang: 'zh_CN',
      page:'pages/index/index',
      data: {
        name1: {
          value: "您的帖子已被评论"
        },
        thing2: {
          value: comment.data.content
        },
        name3: {
          value: comment.data.authorname
        }
      },
      templateId: '9ykXNArFlm8e_M2ZJkXS5GiRYKW6P31NjmVxkErZKmQ',
       //formId: 'event.formId',
      miniprogramState: 'developer'
      
    })
    console.log(touser)
    // result 结构
    // { errCode: 0, errMsg: 'openapi.templateMessage.send:ok' }
    return result
  } catch (err) {
    // 错误处理
    // err.errCode !== 0
    return err
  }
}