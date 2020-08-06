const Koa = require('koa')
const app = new Koa()
const Router = require('koa-router')
const router = new Router()
const rp = require('request-promise')
const cors = require('koa2-cors')
const puppeteer = require('puppeteer')

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

router.get('/siteonline', async (ctx, next) => {
  ctx.data = await getStatistic()
  await next()
})

app.use(router.routes())
app.use(router.allowedMethods())

let server = app.listen(2333, () => {
  let port = server.address().port
  console.log('start at http://localhost:%s', port)
})

function getStatistic() {
  return new Promise((resolve, reject) => {
    try {
      puppeteer
        .launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          dumpio: false,
        })
        .then(async (browser) => {
          const page = await browser.newPage()
          await page.goto('https://web.51.la/report/main?comId=19828725', {
            waitUntil: 'networkidle2',
          })
          let onlineNum = await page.$eval('#online-num', (el) => el.innerText)
          let totalNum = await page.$eval(
            '.main-expand .col-9 > div:nth-child(2) .border-right p:last-child',
            (el) => el.innerText
          )

          let params = { onlineNum: onlineNum, totalNum: totalNum }
          browser.close()
          resolve(params)
        })
    } catch (err) {
      reject(err)
    }
  })
}
