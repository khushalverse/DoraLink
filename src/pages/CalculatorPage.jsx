import { useState } from 'react'
import { ArrowLeft, Delete } from 'lucide-react'

export default function CalculatorPage() {
  const [firstNum, setFirstNum] = useState('')
  const [operator, setOperator] = useState('')
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [calculated, setCalculated] = useState(false)
  const [history, setHistory] = useState([])
  const [activeMode, setActiveMode] = useState('basic')
  const [error, setError] = useState('')
  const [openSection, setOpenSection] = useState(null)

  const handleButton = (value) => {
    setError('')

    if(value === 'C') {
      setDisplay('0')
      setFirstNum('')
      setOperator('')
      setExpression('')
      setCalculated(false)
      return
    }

    if(value === '⌫') {
      if(display.length > 1) {
        setDisplay(prev => prev.slice(0,-1))
      } else {
        setDisplay('0')
      }
      return
    }

    if(value === '±') {
      setDisplay(prev =>
        prev.startsWith('-')
          ? prev.slice(1)
          : prev === '0' ? '0' : '-' + prev
      )
      return
    }

    const operators = ['+','-','×','÷','%']

    if(operators.includes(value)) {
      setFirstNum(display)
      setOperator(value)
      setExpression(display + ' ' + value)
      setDisplay('0')
      setCalculated(false)
      return
    }

    if(value === '=') {
      if(!firstNum || !operator) return
      try {
        const num1 = parseFloat(firstNum)
        const num2 = parseFloat(display)

        if(isNaN(num1) || isNaN(num2)) {
          setError('Galat input! 😅')
          return
        }

        let result
        switch(operator) {
          case '+': result = num1 + num2; break
          case '-': result = num1 - num2; break
          case '×': result = num1 * num2; break
          case '÷':
            if(num2 === 0) {
              setError('Zero se divide nahi! 😅')
              return
            }
            result = num1 / num2
            break
          case '%': result = num1 * num2 / 100; break
          default: return
        }

        result = parseFloat(result.toFixed(10))
        if(Math.abs(result) > 1e15) {
          result = result.toExponential(4)
        }

        const historyItem = {
          expression: firstNum + ' ' + operator + ' ' + display,
          result: result.toString()
        }
        setHistory(prev => 
          [historyItem, ...prev.slice(0,4)]
        )
        setExpression(
          firstNum + ' ' + operator + 
          ' ' + display + ' ='
        )
        setDisplay(result.toString())
        setFirstNum('')
        setOperator('')
        setCalculated(true)
      } catch(err) {
        setError('Kuch gadbad! 😅')
      }
      return
    }

    if(value === '.') {
      if(display.includes('.')) return
      setDisplay(prev => prev + '.')
      return
    }

    // Number input
    if(calculated) {
      setDisplay(value)
      setCalculated(false)
      return
    }

    if(display === '0') {
      setDisplay(value)
    } else {
      if(display.length >= 12) return
      setDisplay(prev => prev + value)
    }
  }

  const buttonStyle = (type) => {
    const base = {
      width: '100%',
      aspectRatio: '1',
      borderRadius: '20px',
      border: 'none',
      cursor: 'pointer',
      fontFamily: "'Nunito', sans-serif",
      fontWeight: '800',
      fontSize: '20px',
      transition: 'all 0.1s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
    switch(type) {
      case 'number':
        return { ...base, 
          background: 'white', 
          color: '#1a1a1a',
          fontSize: '24px',
          boxShadow: '0 2px 8px rgba(0,168,214,0.08)' 
        }
      case 'operator':
        return { ...base, 
          background: '#E0F4FB', 
          color: '#00A8D6',
          fontSize: '26px',
          boxShadow: '0 2px 8px rgba(0,168,214,0.12)' 
        }
      case 'equals':
        return { ...base, 
          background: '#00A8D6', 
          color: 'white',
          fontSize: '28px',
          boxShadow: '0 4px 16px rgba(0,168,214,0.3)' 
        }
      case 'clear':
        return { ...base, 
          background: '#FFE0E0', 
          color: '#FF4444',
          fontSize: '22px',
          boxShadow: '0 2px 8px rgba(255,68,68,0.12)' 
        }
      case 'special':
        return { ...base, 
          background: '#F0F9FF', 
          color: '#00A8D6',
          fontSize: '20px'
        }
      case 'science':
        return { ...base,
          background: '#EEF4FF',
          color: '#6C5CE7',
          fontSize: '13px',
          padding: '14px 4px',
          boxShadow: '0 2px 8px rgba(108,92,231,0.1)'
        }
      default:
        return base
    }
  }

  const buttons = [
    { label:'C', type:'clear' },
    { label:'±', type:'special' },
    { label:'⌫', type:'special' },
    { label:'÷', type:'operator' },
    { label:'7', type:'number' },
    { label:'8', type:'number' },
    { label:'9', type:'number' },
    { label:'×', type:'operator' },
    { label:'4', type:'number' },
    { label:'5', type:'number' },
    { label:'6', type:'number' },
    { label:'-', type:'operator' },
    { label:'1', type:'number' },
    { label:'2', type:'number' },
    { label:'3', type:'number' },
    { label:'+', type:'operator' },
    { label:'0', type:'number', wide: true },
    { label:'.', type:'number' },
    { label:'=', type:'equals' },
  ]

  const scienceButtons = [
    { label:'C', type:'clear' },
    { label:'±', type:'special' },
    { label:'⌫', type:'special' },
    { label:'÷', type:'operator' },
    { label:'7', type:'number' },
    { label:'8', type:'number' },
    { label:'9', type:'number' },
    { label:'×', type:'operator' },
    { label:'4', type:'number' },
    { label:'5', type:'number' },
    { label:'6', type:'number' },
    { label:'-', type:'operator' },
    { label:'1', type:'number' },
    { label:'2', type:'number' },
    { label:'3', type:'number' },
    { label:'+', type:'operator' },
    { label:'0', type:'number' },
    { label:'.', type:'number' },
    { label:'=', type:'equals' },
    { label:'', type:'empty' },
  ]

  const handleScience = (func) => {
    setError('')
    const num = parseFloat(display)
    if(isNaN(num)) {
      setError('Galat input! 😅')
      return
    }

    let result
    try {
      switch(func) {
        case 'sin':
          result = Math.sin(num * Math.PI / 180)
          break
        case 'cos':
          result = Math.cos(num * Math.PI / 180)
          break
        case 'tan':
          if(num % 180 === 90) {
            setError('Undefined! 😅')
            return
          }
          result = Math.tan(num * Math.PI / 180)
          break
        case 'sin⁻¹':
          if(num < -1 || num > 1) {
            setError('Range -1 to 1! 😅')
            return
          }
          result = Math.asin(num) * 180 / Math.PI
          break
        case 'cos⁻¹':
          if(num < -1 || num > 1) {
            setError('Range -1 to 1! 😅')
            return
          }
          result = Math.acos(num) * 180 / Math.PI
          break
        case 'tan⁻¹':
          result = Math.atan(num) * 180 / Math.PI
          break
        case 'log':
          if(num <= 0) {
            setError('Positive number chahiye! 😅')
            return
          }
          result = Math.log10(num)
          break
        case 'ln':
          if(num <= 0) {
            setError('Positive number chahiye! 😅')
            return
          }
          result = Math.log(num)
          break
        case '√':
          if(num < 0) {
            setError('Negative ka root nahi! 😅')
            return
          }
          result = Math.sqrt(num)
          break
        case 'x²':
          result = num * num
          break
        case 'x³':
          result = num * num * num
          break
        case '1/x':
          if(num === 0) {
            setError('Zero se divide nahi! 😅')
            return
          }
          result = 1 / num
          break
        case 'n!':
          if(num < 0 || !Number.isInteger(num)) {
            setError('Positive integer chahiye! 😅')
            return
          }
          if(num > 20) {
            setError('Too large! Max 20 😅')
            return
          }
          result = factorial(num)
          break
        case 'π':
          setDisplay(Math.PI.toString())
          return
        case 'e':
          setDisplay(Math.E.toString())
          return
        case '(':
          setExpression(prev => prev + '(')
          return
        case ')':
          setExpression(prev => prev + ')')
          return
        default:
          return
      }

      result = parseFloat(result.toFixed(10))
      const historyItem = {
        expression: func + '(' + num + ')',
        result: result.toString()
      }
      setHistory(prev => 
        [historyItem, ...prev.slice(0,4)]
      )
      setDisplay(result.toString())
      setExpression(func + '(' + num + ') =')
      setCalculated(true)
    } catch(err) {
      setError('Error! 😅')
    }
  }

  const factorial = (n) => {
    if(n === 0 || n === 1) return 1
    return n * factorial(n - 1)
  }

  return (
    <div style={{
      height: '100vh',
      background: '#F0F9FF',
      fontFamily: "'Nunito', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <style>{`
        @keyframes popIn {
          from { opacity:0; transform:scale(0.95) }
          to { opacity:1; transform:scale(1) }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px) }
          to { opacity:1; transform:translateY(0) }
        }
        .calc-btn:active {
          transform: scale(0.92) !important;
        }
      `}</style>

      {/* Background blobs */}
      <div style={{
        position:'absolute', top:'-80px',
        right:'-80px', width:'220px',
        height:'220px', borderRadius:'50%',
        background:'#00A8D6', opacity:0.1, zIndex:0
      }}/>
      <div style={{
        position:'absolute', bottom:'100px',
        left:'-100px', width:'250px',
        height:'250px', borderRadius:'50%',
        background:'#00A8D6', opacity:0.08, zIndex:0
      }}/>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 16px 8px 16px',
        position: 'relative', zIndex: 1
      }}>
        <button
          onClick={() => window.history.back()}
          style={{
            width:'42px', height:'42px',
            borderRadius:'50%',
            background:'#E0F4FB',
            border:'1.5px solid #B8E4F5',
            cursor:'pointer', display:'flex',
            alignItems:'center',
            justifyContent:'center'
          }}
        >
          <ArrowLeft size={20} color="#00A8D6"/>
        </button>
        <span style={{
          fontWeight:'800', fontSize:'18px',
          color:'#00A8D6'
        }}>Calculator 🧮</span>
        <div style={{width:'42px'}}/>
      </div>

      {/* Mode Tabs */}
      <div style={{
        display: 'flex',
        margin: '8px 16px',
        background: 'white',
        borderRadius: '16px',
        padding: '4px',
        boxShadow: '0 2px 8px rgba(0,168,214,0.08)',
        position: 'relative', zIndex: 1
      }}>
        {[
          {id:'basic', label:'🧮 Basic'},
          {id:'science', label:'🔬 Science'},
          {id:'commerce', label:'📊 Commerce'}
        ].map(mode => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            style={{
              flex: 1,
              padding: '10px 4px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: '700',
              fontSize: '13px',
              background: activeMode === mode.id
                ? '#00A8D6' : 'transparent',
              color: activeMode === mode.id
                ? 'white' : '#9ca3af',
              transition: 'all 0.2s ease'
            }}
          >{mode.label}</button>
        ))}
      </div>

      {/* Display */}
      <div style={{
        margin: '8px 16px',
        background: 'white',
        borderRadius: '24px',
        padding: '28px 24px',
        minHeight: '120px',
        boxShadow: '0 4px 16px rgba(0,168,214,0.1)',
        position: 'relative',
        zIndex: 1,
        flex: activeMode === 'basic' ? '1' : '0 0 auto',
        animation: 'fadeUp 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        {/* Expression */}
        <div style={{
          fontSize: '14px',
          color: '#9ca3af',
          fontWeight: '600',
          minHeight: '20px',
          textAlign: 'right',
          marginBottom: '4px'
        }}>
          {expression || ' '}
        </div>

        {/* Main Display */}
        <div style={{
          fontSize: display.length > 10 ? '28px' : '42px',
          fontWeight: '800',
          color: error ? '#FF4444' : '#1a1a1a',
          textAlign: 'right',
          lineHeight: '1.1',
          wordBreak: 'break-all',
          transition: 'font-size 0.2s'
        }}>
          {error || display}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #F0F9FF'
          }}>
            <p style={{
              fontSize: '11px',
              color: '#9ca3af',
              fontWeight: '700',
              marginBottom: '4px'
            }}>LAST</p>
            <p style={{
              fontSize: '13px',
              color: '#9ca3af',
              fontWeight: '600'
            }}>
              {history[0].expression} = {history[0].result}
            </p>
          </div>
        )}
      </div>

      {/* Basic Buttons */}
      {activeMode === 'basic' && (
        <div style={{
          margin: '0 16px 16px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          position: 'relative',
          zIndex: 1,
          animation: 'popIn 0.3s ease'
        }}>
          {buttons.map((btn, i) => (
            <button
              key={i}
              className="calc-btn"
              onClick={() => handleButton(btn.label)}
              style={{
                ...buttonStyle(btn.type),
                gridColumn: btn.wide ? 'span 2' : 'span 1',
                aspectRatio: btn.wide ? 'auto' : '1',
                padding: btn.wide ? '20px' : undefined,
                fontSize: btn.label === '⌫' ? '18px' : undefined
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {activeMode === 'science' && (
        <div style={{
          margin: '4px 16px',
          position: 'relative',
          zIndex: 1,
          animation: 'popIn 0.3s ease'
        }}>

          {/* Collapsible Sections */}
          {[
            {
              id: 'trig',
              label: '📐 Trigonometry',
              color: '#EEF4FF',
              textColor: '#6C5CE7',
              functions: [
                'sin','cos','tan',
                'sin⁻¹','cos⁻¹','tan⁻¹'
              ]
            },
            {
              id: 'func',
              label: '🔢 Functions',
              color: '#E8F5FF',
              textColor: '#00A8D6',
              functions: ['log','ln','√','x²','x³','1/x']
            },
            {
              id: 'const',
              label: '✨ Constants',
              color: '#FFF0FF',
              textColor: '#A29BFE',
              functions: ['π','e','n!','()']
            }
          ].map(section => (
            <div key={section.id} 
              style={{marginBottom: '3px'}}
            >
              {/* Section Header */}
              <button
                onClick={() => setOpenSection(
                  openSection === section.id 
                    ? null : section.id
                )}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: openSection === section.id
                    ? section.color : 'white',
                  border: `1.5px solid ${section.color}`,
                  borderRadius: openSection === section.id
                    ? '12px 12px 0 0' : '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: '700',
                  fontSize: '12px',
                  color: section.textColor
                }}>{section.label}</span>
                <svg width="14" height="14"
                  viewBox="0 0 24 24" fill="none"
                  stroke={section.textColor}
                  strokeWidth="2.5"
                  style={{
                    transform: openSection === section.id
                      ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {/* Section Content */}
              {openSection === section.id && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 
                    section.functions.length === 4
                      ? 'repeat(4, 1fr)'
                      : 'repeat(6, 1fr)',
                  gap: '3px',
                  padding: '6px',
                  background: section.color,
                  borderRadius: '0 0 12px 12px',
                  border: `1.5px solid ${section.color}`,
                  borderTop: 'none',
                  animation: 'fadeUp 0.2s ease'
                }}>
                  {section.functions.map(f => (
                    <button
                      key={f}
                      className="calc-btn"
                      onClick={() => {
                        handleScience(f)
                        setOpenSection(null)
                      }}
                      style={{
                        padding: '8px 2px',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: '700',
                        fontSize: '10px',
                        background: 'white',
                        color: section.textColor,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                      }}
                    >{f}</button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Basic Calculator Buttons - science mode specific */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '4px',
            marginTop: '4px'
          }}>
            {scienceButtons.map((btn, i) => (
              <button
                key={i}
                className="calc-btn"
                onClick={() => handleButton(btn.label)}
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '10px',
                  border: btn.type === 'empty' ? 'none' : 'none',
                  cursor: btn.type === 'empty' ? 'default' : 'pointer',
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: '800',
                  fontSize: btn.type === 'number' 
                    ? '15px' : '13px',
                  background:
                    btn.type === 'empty' ? 'transparent' :
                    btn.type === 'number' ? 'white' :
                    btn.type === 'operator' ? '#E0F4FB' :
                    btn.type === 'equals' ? '#00A8D6' :
                    btn.type === 'clear' ? '#FFE0E0' :
                    '#F0F9FF',
                  color:
                    btn.type === 'number' ? '#1a1a1a' :
                    btn.type === 'operator' ? '#00A8D6' :
                    btn.type === 'equals' ? 'white' :
                    btn.type === 'clear' ? '#FF4444' :
                    '#00A8D6',
                  boxShadow: 
                    btn.type === 'empty' ? 'none' :
                    btn.type === 'equals' ? '0 3px 10px rgba(0,168,214,0.3)' :
                    '0 1px 4px rgba(0,168,214,0.08)'
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Coming Soon for other modes */}
      {activeMode !== 'basic' && activeMode !== 'science' && (
        <div style={{
          margin: '16px',
          background: 'white',
          borderRadius: '20px',
          padding: '40px 20px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,168,214,0.08)',
          position: 'relative', zIndex: 1
        }}>
          <div style={{fontSize: '48px', marginBottom: '12px'}}>
            {activeMode === 'science' ? '🔬' : '📊'}
          </div>
          <p style={{
            fontWeight: '800', fontSize: '18px',
            color: '#1a1a1a', marginBottom: '8px'
          }}>Coming Soon!</p>
          <p style={{
            fontSize: '14px', color: '#9ca3af',
            fontFamily: "'Nunito', sans-serif"
          }}>
            {activeMode === 'science' 
              ? 'Science mode - sin, cos, log aur more!'
              : 'Commerce mode - GST, Interest, EMI aur more!'
            }
          </p>
        </div>
      )}

    </div>
  )
}
