<template>
  <div class="container">
    <h3 class="my-3">Timeblock Rules Test</h3>
    <div class="card mb-3">
      <div class="card-body">
        <h5 class="card-title">Day Of Week</h5>
        <div class="bar">
          <div class="bar-grid">
            <div v-for="i in total_weeks"></div>
          </div>
          <transition-group class="bar-content" name="slide" mode="out-in">
            <div v-for="rule in rules" class="bar-rule" :style="getRuleStyle(rule)" :key="rule.id">
              <div class="bar-rule-inner">{{rule.value}}</div>
            </div>
          </transition-group>
          <transition name="slide">
            <div v-if="showPreliminary" class="bar-rule -preliminary" :style="getRuleStyle(form)">
              <div class="bar-rule-inner"></div>
            </div>
          </transition>
        </div>
      </div>
    </div>
    <h3 class="my-3">Add New Rule</h3>
    <div class="alert alert-danger mb-3" v-if="error">{{error}}</div>
    <div class="card mb-3">
      <div class="card-body">
        <form @submit.prevent="submit">
          <div class="row">
            <div class="col">
              <div class="form-group">
                <label for="formStartWeek">Start Week</label>
                <input type="number" class="form-control" id="formStartWeek" min="0" :max="total_weeks" v-model="form.from" :readonly="loading">
                <small class="form-text text-muted">The number between 0 and 50, 0 counts as -infinity</small>
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label for="formEndWeek">End Week</label>
                <input type="number" class="form-control" id="formEndWeek" min="0" :max="total_weeks" v-model="form.to" :readonly="loading">
                <small class="form-text text-muted">The number between 0 and 50, 0 counts as +infinity</small>
              </div>
            </div>
            <div class="w-100"></div>
            <div class="col">
              <div class="form-group">
                <label for="formDay">Day of week</label>
                <select class="form-control" id="formDay" v-model="form.value" :readonly="loading">
                  <option value="MON">MON</option>
                  <option value="TUE">TUE</option>
                  <option value="WED">WED</option>
                  <option value="THU">THU</option>
                  <option value="FRI">FRI</option>
                </select>
              </div>
            </div>
          </div>
          <div class="text-center">
            <button type="submit" class="btn btn-primary" :disabled="loading">Add</button>
            <button type="button" class="btn btn-secondary" @click="reset" :disabled="loading">Reset Form</button>
          </div>
        </form>
      </div>
    </div>
    <transition-group tag="div" name="slide-rev">
      <div class="alert alert-info mb-1" v-for="(note, index) in notes" :key="index">{{note}}</div>
    </transition-group>
  </div>
</template>

<script>
import {processNewRule} from '@/fn/rules'

const formDefaultValues = {
  from: 0,
  to: 0,
  value: 'MON'
}

export default {
  data () {
    return {
      total_weeks: 50,
      rules: [
        { id: 1, from: 20, to: 39, value: 'FRI' },
        { id: 2, from: 40, to: null, value: 'WED' }
      ],
      autoincrementIndex: 0,
      form: Object.assign({}, formDefaultValues),
      loading: false,
      error: null,
      showPreliminary: true,
      notes: []
    }
  },
  methods: {
    getNextIndex () {
      if (this.autoincrementIndex === 0) {
        this.autoincrementIndex = this.rules.reduce((max, rule) => Math.max(max, rule.id), 0)
      }
      return ++this.autoincrementIndex
    },
    getRuleStyle (rule) {
      const from = isNaN(rule.from) ? 0 : Math.floor(rule.from) || 0
      const to = isNaN(rule.to) ? 0 : Math.floor(rule.to) || 0
      return {
        left: Math.round((from ? from - 1 : 0) / this.total_weeks * 100) + '%',
        width: Math.round(Math.max(0, (to || this.total_weeks) - (from ? from - 1 : 0)) / this.total_weeks * 100) + '%'
      }
    },
    submit () {
      this.error = null
      const from = isNaN(this.form.from) ? null : Math.floor(this.form.from) || null
      const to = isNaN(this.form.to) ? null : Math.floor(this.form.to) || null
      return Promise.resolve()
        .then(() => {
          if (from < 0 || from > this.total_weeks) throw new Error('Start week field is incorrect')
          if (to < 0 || to > this.total_weeks) throw new Error('End week field is incorrect')
          if (from > to) throw new Error('End week must be greater than the start week')
        })
        .then(() => this.processNewRule({
          from,
          to,
          value: this.form.value
        }))
        .catch(error => {
          this.error = error.message
        })
    },
    reset () {
      this.error = null
      this.form = {...formDefaultValues}
    },
    processNewRule (rule) {
      const newRule = {
        from: rule.from || null,
        to: rule.to || null,
        value: rule.value
      }
      const initialRules = this.rules.map(rule => ({
        id: rule.id,
        from: rule.from || null,
        to: rule.to || null,
        value: rule.value
      }))
      const result = processNewRule(newRule, initialRules)
      const delay = (n) => () => new Promise((resolve, reject) => setTimeout(resolve, n || 1000))
      return Promise.resolve()
        .then(() => {
          this.loading = true
          this.notes = []
        })
        .then(delay())
        .then(() => {
          const deleteRules = result.filter(rule => rule.type === 'delete')
          this.notes.push('1. Delete rules count: ' + deleteRules.length)
          deleteRules.forEach(action => {
            const index = this.rules.findIndex(rule => rule.id === action.id)
            if (index === 0 || index > 0) {
              this.rules.splice(index, 1)
            }
          })
        })
        .then(delay())
        .then(() => {
          const updateRules = result.filter(rule => rule.type === 'update')
          this.notes.push('2. Update rules count: ' + updateRules.length)
          updateRules.forEach(action => {
            const rule = this.rules.find(rule => rule.id === action.id)
            if (rule) {
              Object.assign(rule, action.data)
            }
          })
        })
        .then(delay())
        .then(() => {
          const insertRules = result.filter(rule => rule.type === 'insert')
          this.notes.push('3. Insert rules count: ' + insertRules.length)
          insertRules.forEach(action => {
            this.rules.push({
              id: this.getNextIndex(),
              ...action.data
            })
          })
        })
        .then(() => {
          this.loading = false
        })
    }
  }
}
</script>

<style lang="stylus">
.card-body
  padding 0.5rem
.bar
  height 40px
  position relative
  overflow hidden
  &-grid
    position absolute
    top 10px
    right 0
    bottom 0
    left 0
    display flex
    > div
      border 1px solid #dedede
      border-left-width 0
      flex-grow 1
      &:first-child
        border-left-width 1px
  &-content
    position absolute
    top 10px
    right 0
    bottom 0
    left 0
    z-index 2
  &-rule
    position absolute
    top 0
    bottom 0
    transition all 0.5s
    &-inner
      margin 4px
      background-color #336699
      height 22px
      border-radius 5px
      color #ffffff
      text-align center
      transition all 0.5s
  &-rule.-preliminary
    top 0
    bottom auto
    .bar-rule-inner
      height 4px
      border-radius 2px
      opacity 0.5
  &-rule.-highlighted
    .bar-rule-inner
      background-color #33ded6

.slide-enter-active, .slide-leave-active
  transition all 0.5s
.slide-enter, .slide-leave-to
  opacity 0
  transform translateY(-30px)

.alert
  transition all 0.5s

.slide-rev-enter-active, .slide-rev-leave-active
  transition all 0.5s
.slide-rev-enter, .slide-rev-leave-to
  opacity 0
  transform translateY(30px)

</style>
