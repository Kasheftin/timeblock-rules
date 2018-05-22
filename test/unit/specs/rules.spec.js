import {rulesOverlap, processNewRule} from '@/fn/rules'

describe('rulesOverlap', () => {
  it('should work for finite rules', () => {
    expect(rulesOverlap({from: 201810, to: 201820}, {from: 201815, to: 201815})).to.be.true
    expect(rulesOverlap({from: 201810, to: 201810}, {from: 201811, to: 201815})).to.be.false
    expect(rulesOverlap({from: 201810, to: 201810}, {from: 201810, to: 201810})).to.be.true
    expect(rulesOverlap({from: 201809, to: 201810}, {from: 201810, to: 201810})).to.be.true
  })
  it('should work for infinite `to`', () => {
    expect(rulesOverlap({from: 201810, to: null}, {from: 201815, to: 201815})).to.be.true
    expect(rulesOverlap({from: 201810, to: null}, {from: 201805, to: 201806})).to.be.false
    expect(rulesOverlap({from: 201810, to: null}, {from: 201805, to: null})).to.be.true
    expect(rulesOverlap({from: 201810, to: 201820}, {from: 201820, to: null})).to.be.true
    expect(rulesOverlap({from: 201810, to: 201820}, {from: 201821, to: null})).to.be.false
  })
  it('should work for infinite `from`', () => {
    expect(rulesOverlap({from: null, to: 201810}, {from: 201810, to: 201810})).to.be.true
    expect(rulesOverlap({from: null, to: 201810}, {from: 201805, to: 201806})).to.be.true
    expect(rulesOverlap({from: null, to: 201810}, {from: 201811, to: 201812})).to.be.false
    expect(rulesOverlap({from: null, to: 1}, {from: null, to: 201800})).to.be.true
  })
  it('should work for infinite rules', () => {
    expect(rulesOverlap({from: null, to: null}, {from: 1, to: 1})).to.be.true
    expect(rulesOverlap({from: null, to: null}, {from: null, to: 1})).to.be.true
    expect(rulesOverlap({from: null, to: null}, {from: 1, to: null})).to.be.true
    expect(rulesOverlap({from: null, to: null}, {from: null, to: null})).to.be.true
    expect(rulesOverlap({from: 1, to: 1}, {from: null, to: null})).to.be.true
  })
})

describe('processNewRule', () => {
  it('should return new rule insert if there\'re no initialRules', () => {
    expect(processNewRule({from: 201810, to: 201820, value: 1}, [])).to.deep.equal([{type: 'insert', data: {from: 201810, to: 201820, value: 1}}])
    expect(processNewRule({from: 201810, to: null, value: 2}, [])).to.deep.equal([{type: 'insert', data: {from: 201810, to: null, value: 2}}])
  })
  const someInitialRules = [{id: 1, from: 201801, to: 201805, value: 2}, {id: 2, from: 201806, to: 201821, value: 1}, {id: 3, from: 201822, to: null, value: 2}]
  it('should return empty if new rule is strictly inside some initialRule with the same value', () => {
    expect(processNewRule({from: 201810, to: 201820, value: 1}, someInitialRules)).to.deep.equal([])
  })
  it('should return 1 update and 2 inserts if the new rule is strictly inside some initialRule with the different value', () => {
    expect(processNewRule({from: 201810, to: 201820, value: 2}, someInitialRules)).to.deep.equal([{type: 'update', id: 2, data: {to: 201809}}, {type: 'insert', data: {from: 201810, to: 201820, value: 2}}, {type: 'insert', data: {from: 201821, to: 201821, value: 1}}])
  })
  it('should extend newRule start if the value equals to overlapping startRule', () => {
    expect(processNewRule({from: 201820, to: 201830, value: 1}, someInitialRules)).to.deep.equal([{type: 'delete', id: 2}, {type: 'update', id: 3, data: {from: 201831}}, {type: 'insert', data: {from: 201806, to: 201830, value: 1}}])
  })
  it('should extend newRule end if the value equals to overlapping endRule', () => {
    expect(processNewRule({from: 201805, to: 201810, value: 1}, someInitialRules)).to.deep.equal([{type: 'delete', id: 2}, {type: 'update', id: 1, data: {to: 201804}}, {type: 'insert', data: {from: 201805, to: 201821, value: 1}}])
  })
  it('should remove firstRule if newValue start equals to firstRule start', () => {
    expect(processNewRule({from: 201801, to: 201810, value: 1}, someInitialRules)).to.deep.equal([{type: 'delete', id: 1}, {type: 'delete', id: 2}, {type: 'insert', data: {from: 201801, to: 201821, value: 1}}])
  })
  it('should delete all rules and add one big rule if newRule strictly covers the middleRule with value equals to first and second rule values', () => {
    expect(processNewRule({from: 201804, to: 201830, value: 2}, someInitialRules)).to.deep.equal([{type: 'delete', id: 1}, {type: 'delete', id: 2}, {type: 'delete', id: 3}, {type: 'insert', data: {from: 201801, to: null, value: 2}}])
  })
  it('should delete all rules and add one big rule if newRule exact covers the middleRule with value equals to first and second rule values', () => {
    expect(processNewRule({from: 201806, to: 201821, value: 2}, someInitialRules)).to.deep.equal([{type: 'delete', id: 1}, {type: 'delete', id: 2}, {type: 'delete', id: 3}, {type: 'insert', data: {from: 201801, to: null, value: 2}}])
  })
  it('should delete 2 and 3 rule if newRule to=null and from equals to second rule from', () => {
    expect(processNewRule({from: 201806, to: null, value: 1}, someInitialRules)).to.deep.equal([{type: 'delete', id: 2}, {type: 'delete', id: 3}, {type: 'insert', data: {from: 201806, to: null, value: 1}}])
  })
  it('should delete all rules and start from firstRule.from if newRule.to=null and from equals to second rule from, and the value equals to firstRule value', () => {
    expect(processNewRule({from: 201806, to: null, value: 2}, someInitialRules)).to.deep.equal([{type: 'delete', id: 1}, {type: 'delete', id: 2}, {type: 'delete', id: 3}, {type: 'insert', data: {from: 201801, to: null, value: 2}}])
  })
  it('should just work 1', () => {
    expect(processNewRule({from: 201804, to: 201806, value: 3}, someInitialRules)).to.deep.equal([{type: 'update', id: 1, data: {to: 201803}}, {type: 'update', id: 2, data: {from: 201807}}, {type: 'insert', data: {from: 201804, to: 201806, value: 3}}])
  })
  it('should just work 2', () => {
    expect(processNewRule({from: 201801, to: 201806, value: 3}, someInitialRules)).to.deep.equal([{type: 'delete', id: 1}, {type: 'update', id: 2, data: {from: 201807}}, {type: 'insert', data: {from: 201801, to: 201806, value: 3}}])
  })
  it('should not do anything if the new rule is exact the old one', () => {
    expect(processNewRule({from: 201806, to: 201821, value: 1}, someInitialRules)).to.deep.equal([])
  })
  it('should delete all and add one big rule if it covers the middle rule, and before and after values match newRule value', () => {
    expect(processNewRule({from: 201806, to: 201821, value: 2}, someInitialRules)).to.deep.equal([{type: 'delete', id: 1}, {type: 'delete', id: 2}, {type: 'delete', id: 3}, {type: 'insert', data: {from: 201801, to: null, value: 2}}])
  })
})
