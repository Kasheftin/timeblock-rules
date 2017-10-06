<template>
  <div class="container">
    <h3>Timeblock Rules Test</h3>
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

const formDefaultValues = {
  start_week: 0,
  end_week: undefined,
  value: 'MON'
}

export default {
  data () {
    return {
      total_weeks: 50,
      rules: [
        { id: 1, start_week: 20, end_week: 39, value: 'FRI' },
        { id: 2, start_week: 40, value: 'WED' }
      ],
      autoincrementIndex: 0,
      form: Object.assign({}, formDefaultValues),
      error: undefined,
      loading: false,
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
      return {
        left: Math.floor(rule.start_week / this.total_weeks * 100) + '%',
        width: Math.floor(((rule.end_week === undefined ? (this.total_weeks - 1) : rule.end_week) - rule.start_week + 1) / this.total_weeks * 100) + '%'
      }
    },
    submit () {
      this.error = undefined
      let startWeek, endWeek
      try {
        startWeek = Math.floor(this.form.start_week)
        if (isNaN(startWeek) || startWeek < 0 || startWeek > this.total_weeks) throw new Error('Start week field is incorrect')
        if (this.form.end_week !== '' && this.form.end_week !== undefined) {
          endWeek = Math.floor(this.form.end_week)
          if (isNaN(endWeek) || endWeek < 0 || endWeek > this.total_weeks) throw new Error('End week field is incorrect')
        }
        if (startWeek !== undefined && endWeek !== undefined && endWeek < startWeek) throw new Error('End week must be greater than the start week')
        this.processNewRule({
          start_week: startWeek,
          end_week: endWeek,
          value: this.form.value
        })
      } catch (e) {
        this.error = e.message
      }
    },
    reset () {
      this.form = Object.assign({}, formDefaultValues)
      this.error = undefined
    },
    processNewRule (rule) {
      const delay = (n) => () => new Promise((resolve, reject) => setTimeout(resolve, n || 1000))
      Promise.resolve()
        .then(() => {
          this.loading = true
          this.notes = []
        })
        .then(delay())
        .then(() => {
          const events = []
          this.rules.forEach(r => {
            events.push({
              type: 'up',
              week: r.start_week,
              id: r.id,
              value: r.value
            })
            if (r.end_week) {
              events.push({
                type: 'down',
                week: r.end_week,
                id: r.id,
                value: r.value
              })
            }
          })
          events.push({
            type: 'up',
            week: rule.start_week,
            new: true,
            value: rule.value,
            unlimited: !rule.end_week
          })
          if (rule.end_week) {
            events.push({
              type: 'down',
              week: rule.end_week,
              new: true,
              value: rule.value
            })
          }
          events.sort((e1, e2) => e1.week - e2.week)
          return events
        })
        .then(events => {
          const out = []
          const levels = []
          let newRule
          for (let i = 0; i < events.length; i++) {
            const event = events[i]
            if (event.type === 'up') {
              if (event.new) {
                newRule = event
                if (levels.length > 0) {
                  const e = levels[levels.length - 1]
                  if (e.week <= event.week - 1) {
                    out.push({
                      id: e.id,
                      start_week: e.week,
                      value: e.value,
                      end_week: event.week - 1
                    })
                  }
                }
                if (event.unlimited) break
              } else {
                levels.push(event)
              }
            } else {
              if (event.new) {
                out.push({
                  id: this.getNextIndex(),
                  start_week: newRule.week,
                  end_week: event.week,
                  value: event.value
                })
                if (levels.length > 0) {
                  levels[levels.length - 1].week = event.week + 1
                  levels[levels.length - 1].id = this.getNextIndex()
                }
                newRule = undefined
              } else {
                if (levels.length > 0) {
                  const e = levels.pop()
                  if (!newRule && e.week <= event.week) {
                    out.push({
                      id: e.id,
                      start_week: e.week,
                      value: e.value,
                      end_week: event.week
                    })
                  }
                }
              }
            }
          }
          if (newRule) {
            out.push({
              id: this.getNextIndex(),
              start_week: newRule.week,
              value: newRule.value
            })
          } else if (levels.length > 0) {
            const e = levels.pop()
            out.push({
              id: e.id,
              start_week: e.week,
              value: e.value
            })
          }
          return out
        })
        .then(out => {
          console.log('out', out)
          const outById = {}
          out.forEach(r => {
            outById[r.id] = r
          })
          for (let i = 0; i < this.rules.length; i++) {
            const r1 = this.rules[i]
            const r2 = outById[r1.id]
            if (r2) {
              if (r1.start_week !== r2.start_week || r1.end_week !== r2.end_week || r1.value !== r2.value) {
                console.log('Rule #' + r1.id + ' changed')
                r1.start_week = r2.start_week
                r1.end_week = r2.end_week
                r1.value = r2.value
              } else {
                console.log('Rule #' + r1.id + ' - no changes')
              }
              delete outById[r1.id]
            } else {
              console.log('Rule #' + r1.id + ' removed')
              this.rules.splice(i, 1)
              i--
            }
          }
          Object.keys(outById).forEach(key => {
            console.log('New rule #' + key + ' added')
            this.rules.push(outById[key])
          })
          this.notes.push('1. Up/Down process finished')
        })
        .then(delay())
        .then(() => {
          this.rules.sort((r1, r2) => r1.start_week - r2.start_week)
          for (let i = 1; i < this.rules.length; i++) {
            const prev = this.rules[i - 1]
            const curr = this.rules[i]
            if (prev.end_week === curr.start_week - 1 && prev.value === curr.value) {
              prev.end_week = curr.end_week
              this.rules.splice(i, 1)
              i--
            }
          }
          this.notes.push('2. Merge consistent rules finished')
        })
        .then(() => {
          this.loading = false
        })
    }
    /*
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
    }
    */
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
