const supabaseUrl = 'https://rvntujioqkontqqjhxdb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bnR1amlvcWtvbnRxcWpoeGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MjkwNTMsImV4cCI6MjA3NTUwNTA1M30.YGPpQFss05qu3YmmHvnmfJycmhbQDTSKlzDz25Gbg6c';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

new Vue({
  el: '#app',
  data: {
    isFixed: false,
    now: '',
    start: '2000-09-18',
    nowDay: new Date(),
    articles: [],
    comments: [],
    likeorder: [],
    param: null,     // 會由網址參數帶入
    nowForum: null,
    isHoverHeart: false,
    isHoverComment: false,
  },
  computed: {
    elapsed() {
      const s = this.onlyDate(new Date(this.start))
      const e = this.onlyDate(new Date(this.nowDay))
      return this.diffYMD(s, e)
    },
    sortByLikesDesc() {
      // 按 like 數量由多到少排列
      return [...this.articles].sort((a, b) => b.like - a.like);
    }
  },
  async mounted() {
    const url = new URLSearchParams(window.location.search);
    this.param = url.get('param');

    // 型別處理：你的 id 若是數字欄位就轉數字
    const articleId = isNaN(Number(this.param)) ? this.param : Number(this.param)
    
    // === 讀取 Supabase 資料 ===
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('id', { ascending: false })

      if (error) throw error

      // ✅ 轉換日期格式
      this.articles = data.map(item => {
        const d = new Date(item.created_at)
        const Y = d.getFullYear()
        const M = d.getMonth() + 1
        const D = d.getDate()
        return { ...item, created_at: `${Y}-${M}-${D}` }
      })

    } catch (err) {
      console.error('Supabase select failed:', err)
    }

    // === 讀取該文章的留言（外鍵欄位假設為 article_id） ===
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('article_id', this.param)   // ← 多半是這個欄位，不是用 comments.id
      .order('id', { ascending: true })

    if (error) throw error

    this.comments = (data || []).map(item => {
      const d = new Date(item.created_at)
      const Y = d.getFullYear()
      const M = d.getMonth() + 1
      const D = d.getDate()
      return { ...item, created_at: `${Y}-${M}-${D}` }
    })
  } catch (err) {
    console.error('Comments select failed:', err)
    this.comments = []
  }

    // === 固定導覽列 ===
    this.$nextTick(() => {
      const updateStickyThreshold = () => {
        if (!this.$refs.topbar2) return
        const topbar2Bottom =
          this.$refs.topbar2.offsetTop + this.$refs.topbar2.offsetHeight
    
        window.addEventListener('scroll', () => {
          const scrollTop = window.scrollY || window.pageYOffset
          this.isFixed = scrollTop >= topbar2Bottom
        })
      }
    
      // 如果一開始取不到，延遲一點再執行一次
      if (this.$refs.topbar2) {
        updateStickyThreshold()
      } else {
        setTimeout(updateStickyThreshold, 300)
      }
    })

    // === 即時時間更新 ===
    const updateTime = () => {
      const t = new Date()
      const Y = t.getFullYear()
      const M = String(t.getMonth() + 1).padStart(2, '0')
      const D = String(t.getDate()).padStart(2, '0')
      const A = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      const AA = A[t.getDay()]
      this.now = `${Y}-${M}-${D} ${AA}.`
      this.nowDay = t // 讓 elapsed 即時更新
    }
    updateTime()
    setInterval(updateTime, 1000)

    const urlParam = new URLSearchParams(window.location.search)
    this.param = urlParam.get('param') // 例如 ../forum/index.html?param=3
    if (this.param) {
      this.nowFor()  // 依參數查詢單筆
    }

  },
  methods: {
    onlyDate(d) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    },
    diffYMD(s, e) {
      let years = e.getFullYear() - s.getFullYear()
      let yAnniv = new Date(s)
      yAnniv.setFullYear(s.getFullYear() + years)
      if (yAnniv > e) {
        years--
        yAnniv.setFullYear(s.getFullYear() + years)
      }
      let months = (e.getFullYear() - yAnniv.getFullYear()) * 12 + (e.getMonth() - yAnniv.getMonth())
      let mAnniv = new Date(yAnniv)
      mAnniv.setMonth(yAnniv.getMonth() + months)
      if (mAnniv > e) {
        months--
        mAnniv = new Date(yAnniv)
        mAnniv.setMonth(yAnniv.getMonth() + months)
      }
      const msPerDay = 24 * 60 * 60 * 1000
      const days = Math.round((e - mAnniv) / msPerDay)
      return { y: years, m: months, d: days }
    },
    async nowFor() {
        // 若 id 欄位是數字，轉成數字；若是文字可用原字串
        const id = isNaN(Number(this.param)) ? this.param : Number(this.param)
  
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('id', id)
          .single() // 直接回傳一個物件
  
        if (error) {
          console.error('查詢失敗：', error)
          this.nowForum = null
          return
        }
  
        this.nowForum = data || null

        // 格式化單一物件的日期
        if (data && data.created_at) {
          const d = new Date(data.created_at)
          const Y = d.getFullYear()
          const M = d.getMonth() + 1
          const D = d.getDate()
          this.nowForum = { ...data, created_at: `${Y}-${M}-${D}` }
        } else {
          this.nowForum = data // 沒有 created_at 就直接放
        }

    },

    basePath() {
      const isLocal = /localhost|127\.0\.0\.1/.test(location.host);
      if (isLocal) return '';
      const segs = window.location.pathname.split('/').filter(Boolean);
      return segs.length ? `/${segs[0]}` : '';
    },

    // 文章詳情連結（不改 URL 的分頁，但帶 query 參數讀單篇）
    forumLink(id) {
      return `${this.basePath()}/forum/index.html?param=${id}`;
    },

  }
})
