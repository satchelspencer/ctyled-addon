import _ from 'lodash'

export function serialize(theme, styleClass) {
  return _.mapValues(theme, (value, prop) => {
    const propDef = styleClass.props[prop]
    if (!propDef || !propDef.default || !propDef.default.serial) return value
    else return value.serial()
  })
}

export function unserialize(serial, styleClass) {
  return _.mapValues(serial, (value, prop) => {
    const propDef = styleClass.props[prop]
    if (!propDef || !propDef.default || !propDef.default.unserial) return value
    else return propDef.default.unserial(value)
  })
}
