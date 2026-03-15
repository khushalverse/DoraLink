import { useState } from 'react'
import { ArrowLeft, Delete } from 'lucide-react'

export default function CalculatorPage() {
  const [expression, setExpression] = useState('')
  const [display, setDisplay] = useState('0')
  const [calculated, setCalculated] = useState(false)
  const [history, setHistory] = useState([])
  const [activeMode, setActiveMode] = useState('basic')
  const [error, setError] = useState('')

  const handleButton = (value) => {
    setError('')

    if(value === 'C') {
      setDisplay('0')
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

    if(value === '=') {
      calculate()
      return
    }

    if(value === '±') {
      setDisplay(prev => 
        prev.startsWith('-') 
          ? prev.slice(1) 
          : '-' + prev
      )
      return
    }

    const operators = ['+','-','×','÷','%']
    
    if(operators.includes(value)) {
      setExpression(display + ' ' + value + ' ')
      setCalculated(false)
      return
    }

    if(value === '.') {
      if(display.includes('.')) return
      setDisplay(prev => prev + '.')
      return
    }

    if(calculated) {
      setDisplay(value)
      setCalculated(false)
      return
    }

    if(display === '0') {
      setDisplay(value)
    } else {
      if(display.length >= 15) return
      setDisplay(prev => prev + value)
    }
  }

  const calculate = () => {
    try {
      if(!expression) return
      
      const parts = expression.trim().split(' ')
      const num1 = parseFloat(parts[0])
      const operator = parts[1]
      const num2 = parseFloat(display)

      if(isNaN(num1) || isNaN(num2)) {
        setError('Galat input hai! 😅')
        return
      }

      let result
      switch(operator) {
        case '+': result = num1 + num2; break
        case '-': result = num1 - num2; break
        case '×': result = num1 * num2; break
        case '÷':
          if(num2 === 0) {
            setError('Zero se divide? Nahi bhai! 😅')
            return
          }
          result = num1 / num2
          break
        case '%': result = num1 * num2 / 100; break
        default: return
      }

      // Handle floating point precision
      result = parseFloat(result.toFixed(10))
      if(result > 1e15 || result < -1e15) {
        result = result.toExponential(4)
      }

      const historyItem = {
        expression: expression + display,
        result: result.toString()
      }
      setHistory(prev => [historyItem, ...prev.slice(0,4)])
      setDisplay(result.toString())
      setExpression(expression + display + ' =')
      setCalculated(true)
    } catch(err) {
      setError('Kuch gadbad ho gayi! 😅')
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
        return { ...base, background: 'white', color: '#1a1a1a',
          boxShadow: '0 2px 8px rgba(0,168,214,0.08)' }
      case 'operator':
        return { ...base, background: '#E0F4FB', color: '#00A8D6',
          boxShadow: '0 2px 8px rgba(0,168,214,0.12)' }
      case 'equals':
        return { ...base, background: '#00A8D6', color: 'white',
          boxShadow: '0 4px 16px rgba(0,168,214,0.3)',
          fontSize: '24px' }
      case 'clear':
        return { ...base, background: '#FFE0E0', color: '#FF4444',
          boxShadow: '0 2px 8px rgba(255,68,68,0.12)' }
      case 'special':
        return { ...base, background: '#F0F9FF', color: '#00A8D6',
          fontSize: '16px' }
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

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0F9FF',
      fontFamily: "'Nunito', sans-serif",
      position: 'relative',
      overflow: 'hidden'
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
        padding: '20px 24px',
        boxShadow: '0 4px 16px rgba(0,168,214,0.1)',
        position: 'relative', zIndex: 1,
        animation: 'fadeUp 0.3s ease'
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
          margin: '8px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          position: 'relative', zIndex: 1,
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

      {/* Coming Soon for other modes */}
      {activeMode !== 'basic' && (
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
