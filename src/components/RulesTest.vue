<template>
  <div class="container">
    <h3>Timeblock Rules Test</h3>
    <div v-for="type in rows" class="card mb-3">
      <div class="card-body">
        <h5 class="card-title">{{type.id}}</h5>
        <div class="bar">
          <div class="bar-grid">
            <div v-for="i in total_weeks"></div>
          </div>
          <transition-group class="bar-content" name="slide" mode="out-in">
            <div v-for="rule in type.rules" class="bar-rule" :style="getRuleStyle(rule)" :key="rule.id" :class="{'-highlighted': rule.highlighted}">
              <div class="bar-rule-inner">{{rule.note}}</div>
            </div>
          </transition-group>
          <transition name="slide">
            <div v-if="showPreliminary && form.type === type.id" class="bar-rule -preliminary" :style="getRuleStyle(form)">
              <div class="bar-rule-inner"></div>
            </div>
          </transition>
        </div>
      </div>
    </div>
    <h3>Add New Rule</h3>
    <div class="alert alert-danger mb-3" v-if="error">{{error}}</div>
    <div class="card mb-3">
      <div class="card-body">
        <form @submit.prevent="submit">
          <div class="row">
            <div class="col">
              <div class="form-group">
                <label for="formStartWeek">Start Date</label>
                <input type="number" class="form-control" id="formStartWeek" min="0" :max="total_weeks" v-model="form.start_week" :readonly="loading">
                <small class="form-text text-muted">The week of the year only (0 - 50)</small>
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label for="formEndWeek">End Date</label>
                <input type="number" class="form-control" id="formEndWeek" min="0" :max="total_weeks" v-model="form.end_week" :readonly="loading">
                <small class="form-text text-muted">Leave zero for unlimited length, the week number (0 - 50)</small>
              </div>
            </div>
            <div class="w-100"></div>
            <div class="col">
              <div class="form-group">
                <label for="formRuleType">Rule Type</label>
                <select class="form-control" id="formRuleType" v-model="form.type" :readonly="loading">
                  <option v-for="type in types" :value="type.id">{{type.id}}</option>
                </select>
              </div>
            </div>
            <div class="col" v-if="form.type == 'day_of_week'">
              <div class="form-group">
                <label for="formDay">Day of week</label>
                <select class="form-control" id="formDay" v-model="form.value.day" :readonly="loading">
                  <option value="MON">MON</option>
                  <option value="TUE">TUE</option>
                  <option value="WED">WED</option>
                  <option value="THU">THU</option>
                  <option value="FRI">FRI</option>
                </select>
              </div>
            </div>
            <div class="col" v-if="form.type === 'time_of_day'">
              <div class="form-group">
                <label for="formTime">Start Time</label>
                <input type="text" class="form-control" id="formTime" v-model="form.value.time" :readonly="loading">
              </div>
            </div>
            <div class="col" v-if="form.type === 'time_of_day'">
              <div class="form-group">
                <label for="formDuration">Duration</label>
                <input type="text" class="form-control" id="formDuration" v-model="form.value.duration" :readonly="loading">
              </div>
            </div>
            <div class="col" v-if="form.type === 'status'">
              <div class="form-group">
                <label for="formStatus">Status</label>
                <select class="form-control" id="formStatus" v-model="form.value.status_id" :readonly="loading">
                  <option v-for="status in statuses" :value="status.id">{{status.name}}</option>
                </select>
              </div>
            </div>
            <div class="col" v-if="form.type === 'location'">
              <div class="form-group">
                <label for="formStatus">Location</label>
                <select class="form-control" id="formLocation" v-model="form.value.location_id" :readonly="loading">
                  <option v-for="location in locations" :value="location.id">{{location.name}}</option>
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
// import moment from 'moment'

const formDefaultValues = {
  start_week: 0,
  end_week: undefined,
  type: undefined,
  value: {
    day: undefined,
    time: undefined,
    duration: undefined,
    status_id: undefined,
    location_id: undefined
  },
  highlighted: false
}

export default {
  data () {
    return {
      total_weeks: 50,
      types: [
        { id: 'day_of_week' },
        { id: 'time_of_day' },
        { id: 'status' },
        { id: 'location' }
      ],
      statuses: [
        { id: 1, name: 'Active' },
        { id: 2, name: 'Passive' },
        { id: 3, name: 'One More' }
      ],
      locations: [
        { id: 1, name: 'Room 1' },
        { id: 2, name: 'Room 2' },
        { id: 3, name: 'Room 3' }
      ],
      rules: [
        { id: 1, type: 'day_of_week', start_week: 20, end_week: 39, value: { day: 'FRI' }, highlighted: false },
        { id: 2, type: 'day_of_week', start_week: 40, value: { day: 'WED' }, highlighted: false },
        { id: 3, type: 'time_of_day', start_week: 10, value: { time: '10:00', duration: 60 }, highlighted: false },
        { id: 4, type: 'status', start_week: 10, value: { status_id: 1 }, highlighted: false },
        { id: 5, type: 'location', start_week: 10, value: { location_id: 1 }, highlighted: false }
      ],
      autoincrementIndex: 0,
      form: Object.assign({}, formDefaultValues),
      error: undefined,
      loading: false,
      showPreliminary: true,
      notes: []
    }
  },
  computed: {
    rulesByType () {
      const rulesByType = {}
      this.rules.forEach(rule => {
        rule = Object.assign({}, rule)
        if (!rulesByType.hasOwnProperty(rule.type)) {
          rulesByType[rule.type] = []
        }
        if (rule.type === 'day_of_week') {
          rule.note = rule.value.day
        } else if (rule.type === 'time_of_day') {
          rule.note = rule.value.time + ' ' + rule.value.duration + 'min'
        } else if (rule.type === 'status') {
          rule.note = (this.statuses.find(status => status.id === rule.value.status_id) || {}).name
        } else if (rule.type === 'location') {
          rule.note = (this.locations.find(location => location.id === rule.value.location_id) || {}).name
        } else {
          rule.note = ''
        }
        rulesByType[rule.type].push(rule)
      })
      return rulesByType
    },
    rows () {
      const out = []
      this.types.forEach(type => {
        out.push(Object.assign({}, type, {rules: this.rulesByType[type.id]}))
      })
      return out
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
      return {
        left: Math.floor(rule.start_week / this.total_weeks * 100) + '%',
        width: Math.floor(((rule.end_week === undefined ? (this.total_weeks - 1) : rule.end_week) - rule.start_week + 1) / this.total_weeks * 100) + '%'
      }
    },
    valuesEqual (rule1, rule2) {
      if (rule1.type !== rule2.type) return false
        // Dirty
      return JSON.stringify(rule1.value) === JSON.stringify(rule2.value)
    },
    submit () {
      // Validate
      this.error = undefined
      let startWeek, endWeek, type
      try {
        startWeek = Math.floor(this.form.start_week)
        if (isNaN(startWeek) || startWeek < 0 || startWeek > this.total_weeks) throw new Error('Start week field is incorrect')
        if (this.form.end_week !== '' && this.form.end_week !== undefined) {
          endWeek = Math.floor(this.form.end_week)
          console.log(this.form.end_week)
          if (isNaN(endWeek) || endWeek < 0 || endWeek > this.total_weeks) throw new Error('End week field is incorrect')
        }
        if (startWeek !== undefined && endWeek !== undefined && endWeek < startWeek) throw new Error('End week must be greater than the start week')
        type = this.form.type
        if (!this.types.find(t => t.id === type)) throw new Error('Rule type is not supported')
      } catch (e) {
        this.error = e.message
        return
      }
      const value = {}
      if (type === 'day_of_week') {
        value.day = this.form.value.day
      } else if (type === 'time_of_day') {
        value.time = this.form.value.time
        value.duration = this.form.value.duration
      } else if (type === 'status') {
        value.status_id = this.form.value.status_id
      } else if (type === 'location') {
        value.location_id = this.form.value.location_id
      }
      const newRule = {
        type,
        start_week: startWeek,
        end_week: endWeek,
        value
      }
      this.processNewRule(newRule)
    },
    reset () {
      this.form = Object.assign({}, formDefaultValues)
      this.error = undefined
    },
    processNewRule (rule) {
      let rule1, rule2
      const delay = (n) => () => new Promise((resolve, reject) => setTimeout(resolve, n || 1000))
      Promise.resolve()
        .then(() => {
          this.loading = true
          this.notes = []
        })
        .then(delay())
        .then(() => {
          let cnt = 0
          for (let i = 0; i < this.rules.length; i++) {
            const r = this.rules[i]
            if (r.type === rule.type && r.start_week >= rule.start_week && (rule.end_week === undefined || (rule.end_week !== undefined && r.end_week !== undefined && r.end_week <= rule.end_week))) {
              r.highlighted = true
              cnt++
            }
          }
          this.notes.push('1. Select all rules that are covered by the new rule - ' + cnt + ' rules selected')
        })
        .then(delay())
        .then(() => {
          let cnt = 0
          for (let i = this.rules.length - 1; i >= 0; i--) {
            const r = this.rules[i]
            if (r.highlighted) {
              this.rules.splice(i, 1)
              cnt++
            }
          }
          this.notes.push('2. Delete covered rules - ' + cnt + ' rules deleted')
        })
        .then(delay())
        .then(() => {
          rule1 = this.rules.find(r => r.type === rule.type && r.start_week <= rule.start_week && (r.end_week === undefined || r.end_week >= rule.start_week))
          if (rule1) {
            rule1.highlighted = true
          }
          this.notes.push('3. Select the rule1 that covers new rule start_week - ' + (rule1 ? 'found #' + rule1.id + ' [' + rule1.start_week + ',' + rule1.end_week + ']' : 'not found'))
        })
        .then(delay())
        .then(() => {
          if (rule.end_week === undefined) {
            rule2 = this.rules.find(r => r.type === rule.type && r.end_week === undefined)
          } else {
            rule2 = this.rules.find(r => r.type === rule.type && r.start_week <= rule.end_week && (r.end_week === undefined || r.end_week >= rule.end_week))
          }
          if (rule2) {
            rule2.highlighted = true
          }
          this.notes.push('4. Select the rule2 that covers new rule end_week - ' + (rule2 ? 'found #' + rule2.id + ' [' + rule2.start_week + ',' + rule2.end_week + ']' : 'not found'))
        })
        .then(delay())
        .then(() => {
          let clonedRule1
          if (rule1 && rule.end_week !== undefined) {
            if (rule1.end_week === undefined || rule1.end_week > rule.end_week) {
              clonedRule1 = Object.assign({}, rule1)
              clonedRule1.id = this.getNextIndex()
              clonedRule1.start_week = rule.end_week + 1
              this.rules.push(clonedRule1)
            }
          }
          this.notes.push('5. Check if rule1.end_week is after the rule.end_week and clone it after rule.end_week - ' + (clonedRule1 ? 'cloned #' + clonedRule1.id + ' [' + clonedRule1.start_week + ',' + clonedRule1.end_week + ']' : 'no cloned rule'))
        })
        .then(delay())
        .then(() => {
          let result = 'rule1 does not exist'
          if (rule1) {
            if (rule1.start_week < rule.start_week) {
              rule1.end_week = rule.start_week - 1
              result = ' end_week set to ' + rule1.end_week
            } else if (rule1.start_week === rule.start_week) {
              const index = this.rules.findIndex(rule => rule.id === rule1.id)
              if (index === 0 || index > 0) {
                this.rules.splice(index, 1)
                result = 'rule1 deleted'
              }
            }
          }
          this.notes.push('6. Move the end of the rule1 to be before the rule.start_week - ' + result)
        })
        .then(delay())
        .then(() => {
          let result = 'rule2 does not exist'
          if (rule2) {
            result = 'rule2 is equal to rule1, no change'
            if (!rule1 || rule2 !== rule1) {
              result = 'no change in rule2'
              if (rule.end_week !== undefined && rule2.start_week <= rule.end_week) {
                rule2.start_week = rule.end_week + 1
                result = 'start_week set to ' + rule2.start_week
                if (rule2.start_week > rule2.end_week) {
                  const index = this.rules.findIndex(rule => rule.id === rule2.id)
                  if (index === 0 || index > 0) {
                    this.rules.splice(index, 1)
                    result = 'rule2 deleted'
                  }
                }
              }
            }
          }
          this.notes.push('7. Move the begining of rule2 to be after rule.end_week - ' + result)
        })
        .then(delay())
        .then(() => {
          rule.id = this.getNextIndex()
          this.rules.push(rule)
          this.notes.push('8. Create new rule - #' + rule.id + ' [' + rule.start_week + ',' + rule.end_week + ']')
        })
        .then(delay())
        .then(() => {
          this.notes.push('9. Merge consistent rules')
          this.rules.sort((r1, r2) => r1.start_week - r2.start_week)
          this.types.forEach(type => {
            const rules = this.rules.filter(rule => rule.type === type.id)
            for (let i = 1; i < rules.length; i++) {
              const prev = rules[i - 1]
              const curr = rules[i]
              if (prev.end_week === curr.start_week - 1 && this.valuesEqual(prev, curr)) {
                prev.end_week = curr.end_week
                const index = this.rules.findIndex(rule => rule.id === curr.id)
                if (index === 0 || index > 0) {
                  this.rules.splice(index, 1)
                  rules.splice(i, 1)
                  i--
                }
              }
            }
          })
        })
        .then(delay())
        .then(() => {
          this.notes.push('10. Complete')
        })
        .then(delay())
        .then(() => {
          this.rules.forEach(rule => {
            rule.highlighted = false
          })
          this.loading = false
        })

      /*
      console.log('Adding rule', Object.assign({}, rule))
      // 1. Select all weeks that are covered by the rule and destroy them
      for (let i = this.rules.length - 1; i >= 0; i--) {
        const r = this.rules[i]
        if (r.type === rule.type && r.start_week >= rule.start_week && (rule.end_week === undefined || (rule.end_week !== undefined && r.end_week !== undefined && r.end_week <= rule.end_week))) {
          console.log('Delete rule = ', Object.assign({}, r))
          this.rules.splice(i, 1)
        }
      }
      // 2. Select the week that covers rule.start_week
      let rule1 = this.rules.find(r => r.type === rule.type && r.start_week <= rule.start_week && (r.end_week === undefined || r.end_week >= rule.start_week))
      // 3. Select the week that covers rule.end_week
      let rule2
      if (rule.end_week === undefined) {
        rule2 = this.rules.find(r => r.type === rule.type && r.end_week === undefined)
      } else {
        rule2 = this.rules.find(r => r.type === rule.type && r.start_week <= rule.end_week && (r.end_week === undefined || r.end_week >= rule.end_week))
      }
      console.log('found rule1 = ', Object.assign({}, rule1), 'found rule2 = ', Object.assign({}, rule2))
      // 4. Continue rule1 after the rule
      if (rule1 && rule.end_week !== undefined) {
        if (rule1.end_week === undefined || rule1.end_week > rule.end_week) {
          const clonedRule1 = Object.assign({}, rule1)
          clonedRule1.id = this.getNextIndex()
          clonedRule1.start_week = rule.end_week + 1
          console.log('Clone rule1 to continue after, clonedRule1 = ', Object.assign({}, clonedRule1))
          this.rules.push(clonedRule1)
        }
      }
      // 5. restrict rule1 to finish before the rule
      if (rule1) {
        if (rule1.start_week < rule.start_week) {
          rule1.end_week = rule.start_week - 1
          console.log('Restrict rule1 to finish before, set rule1 = ', Object.assign({}, rule1))
        }
      }
      // 6. restrict rule2 to start after the rule
      if (rule2) {
        if (!rule1 || rule2 !== rule1) {
          if (rule.end_week !== undefined && rule2.start_week <= rule.end_week) {
            rule2.start_week = rule.end_week + 1
            console.log('Restrict rule2 to start after, rule2 = ', Object.assign({}, rule2))
          }
        }
      }
      // 7. Create new rule
      rule.id = this.getNextIndex()
      this.rules.push(rule)
      console.log('New rule inserted = ', Object.assign({}, rule))
      this.$nextTick(() => {
        console.log('Result rules: ', Object.assign([], this.rules))
      })
      // 8. Merge consistent rules
      this.rules.sort((r1, r2) => r1.start_week - r2.start_week)
      this.types.forEach(type => {
        const rules = this.rules.filter(rule => rule.type === type.id)
        for (let i = 1; i < rules.length; i++) {
          const prev = rules[i - 1]
          const curr = rules[i]
          console.log('Compare', Object.assign({}, prev), Object.assign({}, curr))
          if (prev.end_week === curr.start_week - 1 && this.valuesEqual(prev, curr)) {
            prev.end_week = curr.end_week
            const index = this.rules.findIndex(rule => rule.id === curr.id)
            if (index === 0 || index > 0) {
              this.rules.splice(index, 1)
              rules.splice(i, 1)
              i--
            }
          }
        }
      })
      */
    }
  }
}
</script>

<style lang="stylus">
.card-body
  padding 0.5rem
.bar
  height 30px
  position relative
  &-grid
    position absolute
    top 0
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
    top 0
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
    top -10px
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
