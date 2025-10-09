import { courseList, classList } from '../src/course.js';

new Vue({
  el: '#app',
  data: {
    isFixed: false,
    now: '',
    start: '2000-10-8',
    nowDay: new Date()
  },
  computed:{
    elapsed(){
      const s = this.onlyDate(new Date(this.start));
      const e = this.onlyDate(new Date(this.nowDay));
      return this.diffYMD(s, e);
    }
  },
  mounted() {
    this.$nextTick(() => {
      const menuTop = this.$refs.menubar.offsetTop; 
  
      window.addEventListener('scroll', () => {
        this.isFixed = window.scrollY >= menuTop;
      });
    });

    const updateTime = () => {
      const t = new Date();
      const Y = t.getFullYear();
      const M = String(t.getMonth() + 1).padStart(2, '0');
      const D = String(t.getDate()).padStart(2, '0');

      const A = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      const AA = A[t.getDay()-1];
      /*
      const h = String(t.getHours()).padStart(2, '0');
      const m = String(t.getMinutes()).padStart(2, '0');
      const s = String(t.getSeconds()).padStart(2, '0');
      */
      this.now = `${Y}-${M}-${D} ${AA}`;
    };

    updateTime();          // 先更新一次
    setInterval(updateTime, 1000);
  },
  methods:{
    onlyDate(d){
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    },
    diffYMD(s, e){
      // 年
      let years = e.getFullYear() - s.getFullYear();
      let yAnniv = new Date(s);
      yAnniv.setFullYear(s.getFullYear() + years);
      if (yAnniv > e) {
        years--;
        yAnniv.setFullYear(s.getFullYear() + years);
      }

      // 月
      let months = (e.getFullYear() - yAnniv.getFullYear()) * 12 + (e.getMonth() - yAnniv.getMonth());
      let mAnniv = new Date(yAnniv);
      mAnniv.setMonth(yAnniv.getMonth() + months);
      if (mAnniv > e) {
        months--;
        mAnniv = new Date(yAnniv);
        mAnniv.setMonth(yAnniv.getMonth() + months);
      }

      // 日
      const msPerDay = 24*60*60*1000;
      const days = Math.round((e - mAnniv) / msPerDay);

      return { y: years, m: months, d: days };
    }
  }
});
