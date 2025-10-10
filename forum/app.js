const supabaseUrl = 'https://rvntujioqkontqqjhxdb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bnR1amlvcWtvbnRxcWpoeGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MjkwNTMsImV4cCI6MjA3NTUwNTA1M30.YGPpQFss05qu3YmmHvnmfJycmhbQDTSKlzDz25Gbg6c';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

new Vue({
  el: '#app',
  data: {
    isFixed: false,
    now: '',
    start: '2000-10-08',
    nowDay: new Date(),
    articles: [],
    likeorder: [],
    param: null,     // 會由網址參數帶入
    nowForum: null
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
      }
  }
})
