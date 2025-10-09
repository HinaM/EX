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
    likeorder: []
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
      const menuTop = this.$refs.menubar?.offsetTop || 0
      window.addEventListener('scroll', () => {
        this.isFixed = window.scrollY >= menuTop
      })
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
    }
  }
})
