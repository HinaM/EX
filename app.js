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
    likeorder: [],
    page: 1,
      pageSize: 10,     // 你要 10 / 20 都行
      totalRows: 0,

      // 顯示資料（當頁）
      pageItems: [],

      // 排序：'new' = 最新 / 'hot' = 熱門(按讚數)
      sortType: 'new',

      // UI 狀態
      loading: false,
      errorMsg: ''
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
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.totalRows / this.pageSize));
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

    await this.loadPage(1);
    
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

    // 日期格式：YYYY-M-D
    fmtDate(iso) {
      if (!iso) return '';
      const d = new Date(iso);
      const Y = d.getFullYear();
      const M = d.getMonth() + 1;
      const D = d.getDate();
      return `${Y}-${M}-${D}`;
    },

    // 載入指定頁
    async loadPage(p = 1) {
      this.loading = true;
      this.errorMsg = '';

      // 邊界處理
      if (p < 1) p = 1;

      const from = (p - 1) * this.pageSize;
      const to   = from + this.pageSize - 1;

      // 基本查詢（帶 count）
      let query = supabase
        .from('articles')
        .select('*', { count: 'exact' });

      // 排序（熱門 = 先 like 後 created_at；如果你的欄位叫 "like"，v2 其實可直接用）
      if (this.sortType === 'hot') {
        query = query
          .order('like', { ascending: false })
          .order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // 只拿當頁資料
      const { data, error, count } = await query.range(from, to);

      if (error) {
        this.errorMsg = error.message || '載入失敗';
        this.loading = false;
        return;
      }

      // 轉日期
      this.pageItems = (data || []).map(item => ({
        ...item,
        created_at: this.fmtDate(item.created_at)
      }));

      this.totalRows = count || 0;
      this.page = p;
      this.loading = false;
    },

    // 前/後一頁或跳頁
    async goPage(p) {
      if (p < 1 || p > this.totalPages) return;
      await this.loadPage(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // 切換每頁數量
    async setPageSize(n) {
      // 轉數字、防呆
      const size = Number(n) || 10;
      this.pageSize = size;
      await this.loadPage(1);
    },

    // 切換排序
    async setSort(type) {
      if (!['new', 'hot'].includes(type)) return;
      this.sortType = type;
      await this.loadPage(1);
    }
  },

  
})
