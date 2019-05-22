import React, { useState, useEffect } from 'react'
import addons, { makeDecorator } from '@storybook/addons'
import _ from 'lodash'
import ctyled, { ThemeProvider, core } from 'ctyled'

import './register'
import { serialize, unserialize } from './serial'
let lastTheme = {}

const BGWrapper = ctyled.div.styles({
  width: '100%',
  height: '100%',
}).extend`
  position:absolute;
  background-image: linear-gradient(45deg, #e2e2e2 25%, transparent 25%), linear-gradient(-45deg, #e2e2e2 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e2e2 75%), linear-gradient(-45deg, transparent 75%, #e2e2e2 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  opacity:1;
`

const Wrapper = ctyled.div.styles({
  width: '100%',
  height: '100%',
}).extendSheet`
  display:block;
  position:absolute;
  padding:20px;
  opacity:1;
  overflow: scroll;
  > div{
    flex:1;
  }
`

export function WithTheme(props: any) {
  const [themeState, setTheme] = useState<any>(lastTheme)

  useEffect(() => {
    props.channel.emit('ctyled/connect')
    props.channel.on('ctyled/set', theme => {
      setTheme(theme)
      lastTheme = theme
    })
  }, [])
  return (
    <ThemeProvider theme={unserialize(_.omit(themeState, 'showbg') || lastTheme, core)}>
      <BGWrapper>
        <Wrapper styles={{ bg: themeState.showbg }}>
          {themeState && props.children}
        </Wrapper>
      </BGWrapper>
    </ThemeProvider>
  )
}

export const withTheme = makeDecorator({
  name: 'withTheme',
  parameterName: 'ctyled',
  wrapper: (getStory, context) => {
    return <WithTheme channel={addons.getChannel()} children={getStory(context)} />
  },
})

export { serialize, unserialize } from './serial'
