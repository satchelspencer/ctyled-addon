import React, { useState, useRef, useEffect, useMemo } from 'react'
import addons, { types } from '@storybook/addons'
import ctyled, { core, inline, Color, getPositions } from 'ctyled'

import _ from 'lodash'
import { SketchPicker } from 'react-color'
import { Manager, Reference, Popper } from 'react-popper'
import Draggable from 'react-draggable'
import Measure from 'react-measure'

import { serialize, unserialize } from './serial'

const Wrapper = ctyled.div.styles({
  padd: 2,
  column: true,
  gutter: true,
  align: 'stretch',
  size: 12,
}).extend`
  width:100%;
`

const Property = ctyled.div.styles({
  gutter: 2,
  align: 'center',
})

const PropName = ctyled.div.styles({
  size: s => s * 1.25,
})

interface EditorProps {
  value: any
  onChange: (value: any) => void
  palette: any
}

const Arrow = ctyled.div.extend`
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 5px solid #cacaca;
  position: absolute;
  top: -6px;
`

interface GradStopProps {
  stop: any
  width: number
  onChange: (value: any) => void
}

function GradStop(props: GradStopProps) {
  const [open, setOpen] = useState(false),
    update = useRef(null)

  return (
    <Manager>
      <Reference>
        {({ ref }) => (
          <Draggable
            axis="x"
            bounds="parent"
            position={{ y: 0, x: props.width * props.stop.pos }}
            onDrag={(e, data) => {
              setOpen(false)
              update.current && update.current()
              props.onChange({
                ...props.stop,
                pos: data.x / props.width,
              })
            }}
          >
            <GradStopLine
              inRef={ref}
              onContextMenu={e => {
                e.preventDefault()
                setOpen(true)
              }}
            />
          </Draggable>
        )}
      </Reference>
      <Popper placement="bottom">
        {({ ref, style, scheduleUpdate, arrowProps }) => {
          update.current = scheduleUpdate
          return (
            open && (
              <div
                onMouseLeave={() => setOpen(false)}
                ref={ref}
                style={{ ...style, zIndex: 2, marginTop: 5 }}
              >
                <Arrow inRef={arrowProps.ref} style={arrowProps.style} />
                <SketchPicker
                  color={props.stop.color}
                  onChange={color =>
                    props.onChange({
                      ...props.stop,
                      color: color.hex,
                    })
                  }
                />
              </div>
            )
          )
        }}
      </Popper>
    </Manager>
  )
}

const ColorEditorWrapper = ctyled.div.styles({
  flex: '1',
  column: true,
  gutter: true,
  size: s => s * 0.75,
})

const ColorGrad = ctyled.div
  .attrs({
    stops: [],
  })
  .styles({
    flex: '1',
    rounded: true,
    border: true,
    height: 1.5,
  }).extend`
  background:linear-gradient(to right, ${(_, { stops }) =>
    getPositions(stops)
      .map(stop => stop.color + ' ' + stop.pos * 100 + '%')
      .join(',')});
`

const GradWrapper = ctyled.div.styles({
  flex: '1',
})

const GradStopLine = ctyled.div.styles({
  bg: true,
}).extend`
  position:absolute;
  top:0;
  bottom:0;
  width:${({ size }) => size / 2.5}px;
  background: black;
  border: 1px solid white;
`

const GradEditor = ({ stops, width, onChange }) => (
  <GradWrapper>
    <ColorGrad stops={stops} />
    {getPositions(stops).map((stop, i) => (
      <GradStop
        key={i}
        width={width}
        stop={stop}
        onChange={newStop => {
          const newStops = [...stops]
          newStops[i] = newStop
          onChange(newStops)
        }}
      />
    ))}
  </GradWrapper>
)

const ColorSelectionWrapper = ctyled.div.styles({
  //flex: '1',
}).extend`
  height: ${({ size }) => Math.ceil(size * 2)}px;
`

const ColorSelection = ctyled.div.class(inline).styles({
  align: 'center',
  justify: 'center',
  border: true,
  bg: true,
  rounded: true,
}).extendSheet`
  position:absolute;
  width:${({ size }) => size * 2}px;
  height:${({ size }) => size * 2}px;
  margin-left:-${({ size }) => size}px;


  :after, :before {
    top: 100%;
    left: 50%;
    border: solid transparent;
    content: " ";
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;
  }
  
  :after {
    border-color: transparent;
    border-top-color: ${({ color }) => color.bg};
    border-width: 5px;
    margin-left: -5px;
  }
  :before {
    border-color: transparent;
    border-top-color: ${({ borderColor }) => borderColor.fg};
    border-width: 6px;
    margin-left: -6px;
  }
`

const ColorTableWrapper = ctyled.div.styles({
  column: true,
  alignSelf: 'flex-start',
  rounded: 2,
}).extend`
  overflow:hidden;
`
const ColorTableRow = ctyled.div.styles({
  gutter: false,
})
const ColorCell = ctyled.div.styles({
  bg: true,
  align: 'center',
  justify: 'center',
  noselect: true,
}).extend`
  width:${({ size }) => size * 2}px;
  height:${({ size }) => size * 2}px;
`

const XYIndicator = ctyled.div.styles({
  rounded: 3,
}).extend`
  position:absolute;
  z-index:1;
  width:${({ size }) => Math.ceil(size)}px;
  height:${({ size }) => Math.ceil(size)}px;
  border: 1px solid black;
  background: #ffffff8c;
  cursor: move;
`

const ColorPalleteShower = ctyled.div
  .attrs({
    stops: [],
    selected: false,
  })
  .styles({
    width: (_, { selected }) => (selected ? 3 : 2),
    height: (_, { selected }) => (selected ? 3 : 2),
    rounded: 1,
  }).extend`
    cursor:pointer;
    border-color:#848484;
    background:linear-gradient(to bottom, ${(_, { stops }) =>
      getPositions(stops)
        .map(stop => stop.color + ' ' + stop.pos * 100 + '%')
        .join(',')});
`

const PickerWrapper = ctyled.div.styles({
  gutter: true,
  align: 'center',
})

interface ColorPalletePickerProps {
  stops: any[]
  onChange: (stops: any) => void
  palette: any
}

function ColorPalletePicker(props: ColorPalletePickerProps) {
  return (
    <PickerWrapper>
      {Object.values(props.palette).map((color: any, i) => (
        <ColorPalleteShower
          key={i}
          selected={_.isEqual(color, props.stops)}
          stops={color}
          onClick={() => props.onChange(color)}
        />
      ))}
    </PickerWrapper>
  )
}

function ColorEditor(props: EditorProps) {
  const [width, setWidth] = useState(0)

  const range = props.value.contrast * 2
  const normLum = (props.value.lum + 1) / 2
  const base = (2 - range) * normLum
  let fgLum = (-1 + base + 1) / 2
  let bgLum = (-1 + base + range + 1) / 2

  if (props.value.inverted) {
    let t = fgLum
    fgLum = bgLum
    bgLum = t
  }

  const thisColor = new Color().unserial(props.value)

  return (
    <Measure bounds onResize={contentRect => setWidth(contentRect.bounds.width - 2)}>
      {({ measureRef }) => (
        <ColorEditorWrapper inRef={measureRef}>
          <ColorSelectionWrapper>
            <ColorSelection style={{ left: bgLum * width }}>BG</ColorSelection>
            <ColorSelection style={{ left: fgLum * width }}>FG</ColorSelection>
          </ColorSelectionWrapper>
          <GradEditor
            width={width}
            stops={props.value.primary}
            onChange={newStops =>
              props.onChange({ ...props.value, primary: newStops, secondary: newStops })
            }
          />
          <Property styles={{ align: 'center' }}>
            <PropName>color</PropName>
            <ColorPalletePicker
              palette={props.palette}
              stops={props.value.primary}
              onChange={newStops =>
                props.onChange({ ...props.value, primary: newStops, secondary: newStops })
              }
            />
          </Property>
          <Property>
            <PropName>lum</PropName>
            <NumberEditor
              palette={props.palette}
              range={[-1, 1]}
              value={props.value.lum}
              onChange={lum => props.onChange({ ...props.value, lum })}
            />
          </Property>
          <Property>
            <PropName>contrast</PropName>
            <NumberEditor
              palette={props.palette}
              range={[0, 1]}
              value={props.value.contrast}
              onChange={contrast => props.onChange({ ...props.value, contrast })}
            />
          </Property>
          <Property>
            <PropName>inverted</PropName>
            <BooleanEditor
              palette={props.palette}
              value={props.value.inverted}
              onChange={inverted => props.onChange({ ...props.value, inverted })}
            />
          </Property>
          <ColorTableWrapper>
            <Draggable
              bounds="parent"
              position={{
                y: ((props.value.lum + 1) / 2) * 10.5 * 20 - 5,
                x: props.value.contrast * 10.5 * 20 - 5,
              }}
              onDrag={(e, data) => {
                props.onChange({
                  ...props.value,
                  lum: (data.y / 10.5 / 20) * 2 - 1,
                  contrast: data.x / 10.5 / 20,
                })
              }}
            >
              <XYIndicator />
            </Draggable>
            {_.range(-1, 1, 0.2).map(lum => (
              <ColorTableRow key={lum}>
                {_.range(0.01, 1, 0.1).map((contrast, i) => (
                  <ColorCell
                    key={i}
                    styles={{
                      color: thisColor.absLum(lum).absContrast(contrast),
                    }}
                  >
                    aA
                  </ColorCell>
                ))}
              </ColorTableRow>
            ))}
          </ColorTableWrapper>
        </ColorEditorWrapper>
      )}
    </Measure>
  )
}

const NInput = ctyled.input.styles({
  flex: '1',
})
const NWrapper = ctyled.div.styles({
  gutter: true,
  flex: '1',
})

const NValue = ctyled.div.styles({
  align: 'center',
  justify: 'center',
}).extend`
  width:${({ size }) => size * 2}px;
`

function NumberEditor(props: EditorProps & { range?: number[] }) {
  const range = props.range || [0, 50]
  return (
    <NWrapper>
      <NValue>{Math.round(props.value * 100) / 100}</NValue>
      <NInput
        min={range[0]}
        max={range[1]}
        step={(range[1] - range[0]) / 100}
        value={props.value}
        type="range"
        onChange={e => props.onChange(parseFloat(e.target.value))}
      />
    </NWrapper>
  )
}

function BooleanEditor(props: EditorProps) {
  return (
    <NInput
      styles={{
        size: s => s * 2,
      }}
      checked={props.value || false}
      type="checkbox"
      onChange={e => props.onChange(e.target.checked)}
    />
  )
}

const editors = {
  color: ColorEditor,
  size: NumberEditor,
  disabled: BooleanEditor,
}

interface ThemeControllerProps {
  api: any
}

function ThemeController(props: ThemeControllerProps) {
  const [themeState, setThemeState] = useState<any>({
      showbg: true,
    }),
    [defTheme, setDefTheme] = useState<any>({}),
    [palette, setPalette] = useState<any>({})

  useEffect(() => {
    props.api.on('ctyled/connect', () => {
      const { id } = props.api.getCurrentStoryData(),
        params = props.api.getParameters(id, 'ctyled'),
        theme = unserialize(params.theme, core)
      setDefTheme({ ...serialize(theme, core) })
      setPalette(params.palette)
    })
  }, [])

  const both = useMemo(() => ({ ...defTheme, ...themeState }), [defTheme, themeState])

  useEffect(() => {
    props.api.emit('ctyled/set', both)
  }, [both])

  const inheritedProps = _.pickBy(core.props, prop => prop.inherit)
  return (
    <Wrapper>
      {Object.keys(inheritedProps).map(propName => {
        const Editor = editors[propName] || (() => <div>No Editor</div>)
        return (
          <Property key={propName}>
            <PropName>{propName}</PropName>
            <Editor
              palette={palette}
              value={both[propName] || core.props[propName].default}
              onChange={value => setThemeState({ ...both, [propName]: value })}
            />
          </Property>
        )
      })}
      <Property>
        <PropName>background</PropName>
        <BooleanEditor
          palette={palette}
          value={both['showbg']}
          onChange={show => setThemeState({ ...both, showbg: show })}
        />
      </Property>
    </Wrapper>
  )
}

addons.register('ctyled', api => {
  addons.addPanel('ctyled/panel', {
    title: 'Theme',
    type: types.PANEL,
    render: () => <ThemeController api={api} />,
  })
})
