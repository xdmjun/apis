const Koa = require('koa')
const app = new Koa()
const Router = require('koa-router')
const router = new Router()
const rp = require('request-promise')
const cors = require('koa2-cors')

app.use(cors())

// 全局异常处理
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    ctx.body = {
      code: -1,
      data: ctx.data,
      message: ctx.msg || err.message || '服务开小差了，请稍后再试',
      etime: Date.now(),
    }
  }
})

// pretty json result
app.use(async (ctx, next) => {
  await next()
  ctx.set('Content-Type', 'application/json')
  ctx.body = {
    code: ctx.code || 0,
    data: ctx.data,
    message: ctx.msg || 'success',
    etime: Date.now(),
  }
})

router.get('/', async (ctx, next) => {
  ctx.data = 'apis'
  await next()
})

router.get('/wxnews', async (ctx, next) => {
  let options = {
    method: 'post',
    uri: 'https://www.newrank.cn/xdnphb/index/getMedia',
    formData: {
      keyword: 'tag:微信',
      pageNumber: 1,
      pageSize: 10,
      nonce: 'e538309c7',
      xyz: '1b267f372534d205dd941b0f4c1938a4',
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    json: true,
  }
  let result = await rp(options)
  ctx.data = result.value
  await next()
})

app.use(router.routes())
app.use(router.allowedMethods())

let server = app.listen(2333, () => {
  let port = server.address().port
  console.log('start at http://localhost:%s', port)
})
