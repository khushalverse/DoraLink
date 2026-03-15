import { useState } from 'react'
import { ArrowLeft, Delete, X, Send } from 'lucide-react'
import { callAI } from '../services/aiService'

export default function CalculatorPage() {
  const [firstNum, setFirstNum] = useState('')
  const [operator, setOperator] = useState('')
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [calculated, setCalculated] = useState(false)
  const [history, setHistory] = useState([])

  const [showAI, setShowAI] = useState(false)
  const [aiMessages, setAiMessages] = useState([])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [activeMode, setActiveMode] = useState('basic')
  const [error, setError] = useState('')
  const [openSections, setOpenSections] = useState([])

  // Commerce States
  const [commerceSection, setCommerceSection] = useState(null)
  const [gst, setGst] = useState({ amount: '', rate: '18', type: 'add' })
  const [gstResult, setGstResult] = useState(null)
  const [pl, setPl] = useState({ cost: '', selling: '' })
  const [plResult, setPlResult] = useState(null)
  const [si, setSi] = useState({ principal: '', rate: '', time: '' })
  const [siResult, setSiResult] = useState(null)
  const [ci, setCi] = useState({ principal: '', rate: '', time: '', frequency: '12' })
  const [ciResult, setCiResult] = useState(null)
  const [discount, setDiscount] = useState({ price: '', percent: '' })
  const [discountResult, setDiscountResult] = useState(null)
  const [emi, setEmi] = useState({ loan: '', rate: '', tenure: '' })
  const [emiResult, setEmiResult] = useState(null)

  const toggleSection = (id) => {
    setOpenSections(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...prev, id]
    )
  }

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

  const calcGST = () => {
    const amt = parseFloat(gst.amount)
    const rate = parseFloat(gst.rate)
    if(isNaN(amt) || amt <= 0) return
    
    if(gst.type === 'add') {
      const gstAmt = (amt * rate) / 100
      const total = amt + gstAmt
      setGstResult({
        original: amt.toFixed(2),
        gstAmount: gstAmt.toFixed(2),
        total: total.toFixed(2),
        cgst: (gstAmt/2).toFixed(2),
        sgst: (gstAmt/2).toFixed(2)
      })
    } else {
      const original = (amt * 100) / (100 + rate)
      const gstAmt = amt - original
      setGstResult({
        original: original.toFixed(2),
        gstAmount: gstAmt.toFixed(2),
        total: amt.toFixed(2),
        cgst: (gstAmt/2).toFixed(2),
        sgst: (gstAmt/2).toFixed(2)
      })
    }
  }

  const calcPL = () => {
    const cost = parseFloat(pl.cost)
    const selling = parseFloat(pl.selling)
    if(isNaN(cost) || isNaN(selling) || cost <= 0) return
    
    const diff = selling - cost
    const percent = (Math.abs(diff) / cost) * 100
    setPlResult({
      type: diff >= 0 ? 'Profit' : 'Loss',
      amount: Math.abs(diff).toFixed(2),
      percent: percent.toFixed(2),
      cost: cost.toFixed(2),
      selling: selling.toFixed(2)
    })
  }

  const calcSI = () => {
    const p = parseFloat(si.principal)
    const r = parseFloat(si.rate)
    const t = parseFloat(si.time)
    if(isNaN(p) || isNaN(r) || isNaN(t)) return
    
    const interest = (p * r * t) / 100
    const total = p + interest
    setSiResult({
      interest: interest.toFixed(2),
      total: total.toFixed(2),
      principal: p.toFixed(2)
    })
  }

  const calcCI = () => {
    const p = parseFloat(ci.principal)
    const r = parseFloat(ci.rate)
    const t = parseFloat(ci.time)
    const n = parseFloat(ci.frequency)
    if(isNaN(p)||isNaN(r)||isNaN(t)||isNaN(n)) return
    
    const amount = p * Math.pow(
      (1 + r/(n*100)), n*t
    )
    const interest = amount - p
    setCiResult({
      total: amount.toFixed(2),
      interest: interest.toFixed(2),
      principal: p.toFixed(2)
    })
  }

  const calcDiscount = () => {
    const price = parseFloat(discount.price)
    const pct = parseFloat(discount.percent)
    if(isNaN(price) || isNaN(pct)) return
    
    const saved = (price * pct) / 100
    const final = price - saved
    setDiscountResult({
      original: price.toFixed(2),
      saved: saved.toFixed(2),
      final: final.toFixed(2),
      percent: pct.toFixed(1)
    })
  }

  const calcEMI = () => {
    const p = parseFloat(emi.loan)
    const r = parseFloat(emi.rate) / (12 * 100)
    const n = parseFloat(emi.tenure)
    if(isNaN(p) || isNaN(r) || isNaN(n)) return
    
    const emiAmt = p * r * Math.pow(1+r,n) / 
      (Math.pow(1+r,n) - 1)
    const total = emiAmt * n
    const interest = total - p
    setEmiResult({
      emi: emiAmt.toFixed(2),
      total: total.toFixed(2),
      interest: interest.toFixed(2),
      principal: p.toFixed(2)
    })
  }
  const askCalculatorAI = async (question) => {
    if(!question.trim() || aiLoading) return
    
    const userMsg = { role: 'user', content: question }
    setAiMessages(prev => [...prev, userMsg])
    setAiInput('')
    setAiLoading(true)

    const historyText = history.slice(0,3).map(h =>
      `${h.expression} = ${h.result}`
    ).join('\n')

    const currentCalc = display !== '0' 
      ? `Current display: ${display}` 
      : ''
    
    const systemPrompt = `You are DoraLink Calculator AI — 
a smart, witty math assistant!

Current calculator state:
- Mode: ${activeMode} calculator
- ${currentCalc}
- Expression: ${expression || 'none'}
- Recent calculations:
${historyText || 'none yet'}

YOUR JOB:
- Explain calculations clearly
- Help with word problems
- Give formulas and concepts
- Real life examples
- Exam tips for students

PERSONALITY:
- Hinglish naturally
- Fun + educational
- Short clear answers
- Use emojis occasionally
- Reference actual numbers from calculations
- Never be boring!

NO markdown bold/italic in responses.`

    try {
      const response = await callAI(
        question,
        systemPrompt,
        aiMessages,
        400
      )
      const aiMsg = { role: 'ai', content: response }
      setAiMessages(prev => [...prev, aiMsg])
    } catch(err) {
      const errMsg = { 
        role: 'ai', 
        content: 'Oops! Network issue 😅 Try again!' 
      }
      setAiMessages(prev => [...prev, errMsg])
    }
    setAiLoading(false)
  }
  const quickButtons = {
    basic: [
      { label: '📖 Explain result', 
        q: `Explain this calculation: ${expression} ${display}` },
      { label: '🌍 Real life example',
        q: `Give a real life example for: ${expression} ${display}` },
      { label: '✏️ Word problem',
        q: `Create a word problem using the number ${display}` }
    ],
    science: [
      { label: '📐 Formula explain',
        q: `Explain the formula used in: ${expression} = ${display}` },
      { label: '🔬 Concept samjhao',
        q: `Explain the math concept behind: ${expression} = ${display}` },
      { label: '📝 Exam tip do',
        q: `Give an exam tip for: ${expression} = ${display}` }
    ],
    commerce: [
      { label: '💼 Matlab batao',
        q: `Explain what this commerce calculation means: ${expression} = ${display}` },
      { label: '📊 Better option',
        q: `Suggest a better financial option based on: ${display}` },
      { label: '🏦 Real example',
        q: `Give a real world business example for: ${display}` }
    ]
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
        .science-scroll::-webkit-scrollbar { display: none; }
        .science-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideInUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes typingDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
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
          {id:'commerce', label:'📊 Commerce'},
          {id:'science', label:'🔬 Science'}
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
        <div 
          className="science-scroll"
          style={{
            margin: '4px 16px',
            position: 'relative',
            zIndex: 1,
            animation: 'popIn 0.3s ease',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 190px)',
            paddingBottom: '8px'
          }}
        >

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
                onClick={() => toggleSection(section.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: openSections.includes(section.id)
                    ? section.color : 'white',
                  border: `1.5px solid ${section.color}`,
                  borderRadius: openSections.includes(section.id)
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
                    transform: openSections.includes(section.id)
                      ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {/* Section Content */}
              {openSections.includes(section.id) && (
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
                        setOpenSections(prev => prev.filter(id => id !== section.id))
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
                  border: 'none',
                  cursor: 'pointer',
                  gridColumn: btn.label === '0' ? 'span 2' : 'span 1',
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

      {activeMode === 'commerce' && (
        <div style={{
          margin: '4px 16px',
          position: 'relative',
          zIndex: 1,
          animation: 'popIn 0.3s ease',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 200px)',
          paddingBottom: '16px'
        }}>

          {/* Input style helper */}
          {(() => {
            const inputStyle = {
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1.5px solid #E0F4FB',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: '600',
              fontSize: '14px',
              color: '#1a1a1a',
              outline: 'none',
              background: '#F8FDFF',
              boxSizing: 'border-box'
            }

            const resultBox = (content) => (
              <div style={{
                background: 'linear-gradient(135deg, #E0F4FB, #F0F9FF)',
                borderRadius: '12px',
                padding: '12px',
                marginTop: '10px',
                border: '1px solid #B8E4F5'
              }}>
                {content}
              </div>
            )

            const resultRow = (label, value, highlight) => (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <span style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  fontWeight: '600',
                  fontFamily: "'Nunito', sans-serif"
                }}>{label}</span>
                <span style={{
                  fontSize: highlight ? '16px' : '14px',
                  color: highlight ? '#00A8D6' : '#1a1a1a',
                  fontWeight: '800',
                  fontFamily: "'Nunito', sans-serif"
                }}>₹{value}</span>
              </div>
            )

            const calcBtn = (onClick) => (
              <button
                onClick={onClick}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#00A8D6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >Calculate</button>
            )

            const sections = [
              {
                id: 'gst',
                label: '🧾 GST Calculator',
                color: '#E8F5E9',
                textColor: '#00B894',
                content: (
                  <div>
                    <div style={{
                      display:'flex', gap:'6px',
                      marginBottom:'8px'
                    }}>
                      {['5','12','18','28'].map(r => (
                        <button key={r}
                          onClick={() => setGst(
                            p => ({...p, rate:r})
                          )}
                          style={{
                            flex:1, padding:'8px 0',
                            borderRadius:'8px',
                            border:'1.5px solid',
                            borderColor: gst.rate===r
                              ? '#00B894':'#E0F4FB',
                            background: gst.rate===r
                              ? '#00B894':'white',
                            color: gst.rate===r
                              ? 'white':'#9ca3af',
                            fontFamily:"'Nunito', sans-serif",
                            fontWeight:'700',
                            fontSize:'13px',
                            cursor:'pointer'
                          }}
                        >{r}%</button>
                      ))}
                    </div>
                    <div style={{
                      display:'flex', gap:'6px',
                      marginBottom:'8px'
                    }}>
                      {[
                        {v:'add',l:'Add GST'},
                        {v:'remove',l:'Remove GST'}
                      ].map(t => (
                        <button key={t.v}
                          onClick={() => setGst(
                            p => ({...p, type:t.v})
                          )}
                          style={{
                            flex:1, padding:'8px 0',
                            borderRadius:'8px',
                            border:'1.5px solid',
                            borderColor: gst.type===t.v
                              ? '#00A8D6':'#E0F4FB',
                            background: gst.type===t.v
                              ? '#00A8D6':'white',
                            color: gst.type===t.v
                              ? 'white':'#9ca3af',
                            fontFamily:"'Nunito', sans-serif",
                            fontWeight:'700',
                            fontSize:'12px',
                            cursor:'pointer'
                          }}
                        >{t.l}</button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={gst.amount}
                      onChange={e => setGst(
                        p => ({...p, amount:e.target.value})
                      )}
                      placeholder="Enter amount (₹)"
                      style={inputStyle}
                    />
                    {calcBtn(calcGST)}
                    {gstResult && resultBox(
                      <>
                        {resultRow('Original', gstResult.original)}
                        {resultRow('CGST', gstResult.cgst)}
                        {resultRow('SGST', gstResult.sgst)}
                        {resultRow('GST Amount', gstResult.gstAmount)}
                        {resultRow('Total', gstResult.total, true)}
                      </>
                    )}
                  </div>
                )
              },
              {
                id: 'pl',
                label: '📈 Profit & Loss',
                color: '#FFF3E0',
                textColor: '#E17055',
                content: (
                  <div>
                    <div style={{
                      display:'grid',
                      gridTemplateColumns:'1fr 1fr',
                      gap:'8px', marginBottom:'0'
                    }}>
                      <input type="number"
                        value={pl.cost}
                        onChange={e => setPl(
                          p => ({...p, cost:e.target.value})
                        )}
                        placeholder="Cost Price ₹"
                        style={inputStyle}
                      />
                      <input type="number"
                        value={pl.selling}
                        onChange={e => setPl(
                          p => ({...p, selling:e.target.value})
                        )}
                        placeholder="Selling Price ₹"
                        style={inputStyle}
                      />
                    </div>
                    {calcBtn(calcPL)}
                    {plResult && resultBox(
                      <>
                        {resultRow('Cost Price', plResult.cost)}
                        {resultRow('Selling Price', plResult.selling)}
                        <div style={{
                          display:'flex',
                          justifyContent:'space-between',
                          marginBottom:'4px'
                        }}>
                          <span style={{
                            fontSize:'12px', color:'#9ca3af',
                            fontWeight:'600',
                            fontFamily:"'Nunito', sans-serif"
                          }}>{plResult.type}</span>
                          <span style={{
                            fontSize:'16px', fontWeight:'800',
                            fontFamily:"'Nunito', sans-serif",
                            color: plResult.type === 'Profit'
                              ? '#00B894' : '#FF4444'
                          }}>₹{plResult.amount} ({plResult.percent}%)</span>
                        </div>
                      </>
                    )}
                  </div>
                )
              },
              {
                id: 'si',
                label: '💰 Simple Interest',
                color: '#E8EAF6',
                textColor: '#6C5CE7',
                content: (
                  <div>
                    <div style={{
                      display:'grid',
                      gridTemplateColumns:'1fr 1fr 1fr',
                      gap:'6px'
                    }}>
                      <input type="number"
                        value={si.principal}
                        onChange={e => setSi(
                          p => ({...p, principal:e.target.value})
                        )}
                        placeholder="Principal ₹"
                        style={{...inputStyle, fontSize:'12px'}}
                      />
                      <input type="number"
                        value={si.rate}
                        onChange={e => setSi(
                          p => ({...p, rate:e.target.value})
                        )}
                        placeholder="Rate %"
                        style={{...inputStyle, fontSize:'12px'}}
                      />
                      <input type="number"
                        value={si.time}
                        onChange={e => setSi(
                          p => ({...p, time:e.target.value})
                        )}
                        placeholder="Time (yr)"
                        style={{...inputStyle, fontSize:'12px'}}
                      />
                    </div>
                    {calcBtn(calcSI)}
                    {siResult && resultBox(
                      <>
                        {resultRow('Principal', siResult.principal)}
                        {resultRow('Interest', siResult.interest)}
                        {resultRow('Total Amount', siResult.total, true)}
                      </>
                    )}
                  </div>
                )
              },
              {
                id: 'ci',
                label: '🏦 Compound Interest',
                color: '#E3F2FD',
                textColor: '#0078B8',
                content: (
                  <div>
                    <div style={{
                      display:'grid',
                      gridTemplateColumns:'1fr 1fr',
                      gap:'6px', marginBottom:'6px'
                    }}>
                      <input type="number"
                        value={ci.principal}
                        onChange={e => setCi(
                          p => ({...p, principal:e.target.value})
                        )}
                        placeholder="Principal ₹"
                        style={inputStyle}
                      />
                      <input type="number"
                        value={ci.rate}
                        onChange={e => setCi(
                          p => ({...p, rate:e.target.value})
                        )}
                        placeholder="Rate %"
                        style={inputStyle}
                      />
                      <input type="number"
                        value={ci.time}
                        onChange={e => setCi(
                          p => ({...p, time:e.target.value})
                        )}
                        placeholder="Time (years)"
                        style={inputStyle}
                      />
                      <select
                        value={ci.frequency}
                        onChange={e => setCi(
                          p => ({...p, frequency:e.target.value})
                        )}
                        style={{...inputStyle}}
                      >
                        <option value="1">Yearly</option>
                        <option value="2">Half Yearly</option>
                        <option value="4">Quarterly</option>
                        <option value="12">Monthly</option>
                      </select>
                    </div>
                    {calcBtn(calcCI)}
                    {ciResult && resultBox(
                      <>
                        {resultRow('Principal', ciResult.principal)}
                        {resultRow('Interest Earned', ciResult.interest)}
                        {resultRow('Total Amount', ciResult.total, true)}
                      </>
                    )}
                  </div>
                )
              },
              {
                id: 'discount',
                label: '🏷️ Discount Calculator',
                color: '#FCE4EC',
                textColor: '#E91E8C',
                content: (
                  <div>
                    <div style={{
                      display:'grid',
                      gridTemplateColumns:'1fr 1fr',
                      gap:'6px'
                    }}>
                      <input type="number"
                        value={discount.price}
                        onChange={e => setDiscount(
                          p => ({...p, price:e.target.value})
                        )}
                        placeholder="Original Price ₹"
                        style={inputStyle}
                      />
                      <input type="number"
                        value={discount.percent}
                        onChange={e => setDiscount(
                          p => ({...p, percent:e.target.value})
                        )}
                        placeholder="Discount %"
                        style={inputStyle}
                      />
                    </div>
                    {calcBtn(calcDiscount)}
                    {discountResult && resultBox(
                      <>
                        {resultRow('Original', discountResult.original)}
                        {resultRow('You Save', discountResult.saved)}
                        {resultRow('Final Price', discountResult.final, true)}
                      </>
                    )}
                  </div>
                )
              },
              {
                id: 'emi',
                label: '🏠 EMI Calculator',
                color: '#F3E5F5',
                textColor: '#9C27B0',
                content: (
                  <div>
                    <div style={{
                      display:'grid',
                      gridTemplateColumns:'1fr 1fr 1fr',
                      gap:'6px'
                    }}>
                      <input type="number"
                        value={emi.loan}
                        onChange={e => setEmi(
                          p => ({...p, loan:e.target.value})
                        )}
                        placeholder="Loan ₹"
                        style={{...inputStyle, fontSize:'12px'}}
                      />
                      <input type="number"
                        value={emi.rate}
                        onChange={e => setEmi(
                          p => ({...p, rate:e.target.value})
                        )}
                        placeholder="Rate %"
                        style={{...inputStyle, fontSize:'12px'}}
                      />
                      <input type="number"
                        value={emi.tenure}
                        onChange={e => setEmi(
                          p => ({...p, tenure:e.target.value})
                        )}
                        placeholder="Months"
                        style={{...inputStyle, fontSize:'12px'}}
                      />
                    </div>
                    {calcBtn(calcEMI)}
                    {emiResult && resultBox(
                      <>
                        {resultRow('Loan Amount', emiResult.principal)}
                        {resultRow('Total Interest', emiResult.interest)}
                        {resultRow('Total Payment', emiResult.total)}
                        {resultRow('Monthly EMI', emiResult.emi, true)}
                      </>
                    )}
                  </div>
                )
              }
            ]

            return sections.map(section => (
              <div key={section.id}
                style={{marginBottom:'6px'}}
              >
                <button
                  onClick={() => setCommerceSection(
                    commerceSection === section.id
                      ? null : section.id
                  )}
                  style={{
                    width:'100%',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'space-between',
                    padding:'10px 12px',
                    background: commerceSection===section.id
                      ? section.color : 'white',
                    border:`1.5px solid ${section.color}`,
                    borderRadius: commerceSection===section.id
                      ? '12px 12px 0 0' : '12px',
                    cursor:'pointer',
                    transition:'all 0.2s ease'
                  }}
                >
                  <span style={{
                    fontFamily:"'Nunito', sans-serif",
                    fontWeight:'700',
                    fontSize:'13px',
                    color: section.textColor
                  }}>{section.label}</span>
                  <svg width="14" height="14"
                    viewBox="0 0 24 24" fill="none"
                    stroke={section.textColor}
                    strokeWidth="2.5"
                    style={{
                      transform: commerceSection===section.id
                        ? 'rotate(180deg)':'rotate(0)',
                      transition:'transform 0.2s ease'
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {commerceSection === section.id && (
                  <div style={{
                    padding:'12px',
                    background: section.color,
                    borderRadius:'0 0 12px 12px',
                    border:`1.5px solid ${section.color}`,
                    borderTop:'none',
                    animation:'fadeUp 0.2s ease'
                  }}>
                    {section.content}
                  </div>
                )}
              </div>
            ))
          })()}
        </div>
      )}

      {/* Floating AI Button */}
      <button
        onClick={() => setShowAI(true)}
        style={{
          position: 'fixed',
          top: '12px',
          right: '16px',
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00A8D6 0%, #0078B8 100%)',
          border: '2.5px solid white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,168,214,0.5), 0 0 0 3px rgba(0,168,214,0.15)',
          zIndex: 20,
          fontSize: '20px',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = 
            '0 6px 20px rgba(0,168,214,0.6), 0 0 0 4px rgba(0,168,214,0.2)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = 
            '0 4px 16px rgba(0,168,214,0.5), 0 0 0 3px rgba(0,168,214,0.15)'
        }}
      >
        🤖
      </button>

      {showAI && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setShowAI(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              zIndex: 40
            }}
          />

          {/* Bottom Sheet */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'white',
            borderRadius: '28px 28px 0 0',
            zIndex: 50,
            maxHeight: '75vh',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInUp 0.3s ease',
            boxShadow: '0 -8px 32px rgba(0,168,214,0.12)'
          }}>
            {/* Handle */}
            <div style={{
              width: '36px',
              height: '4px',
              background: '#E0F4FB',
              borderRadius: '2px',
              margin: '12px auto 0 auto'
            }}/>

            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{fontSize: '20px'}}>🤖</span>
                <span style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: '800',
                  fontSize: '16px',
                  color: '#00A8D6'
                }}>DoraLink Calculator AI</span>
              </div>
              <button
                onClick={() => {
                  setShowAI(false)
                  setAiMessages([])
                  setAiInput('')
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#F0F9FF',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}
              >✕</button>
            </div>

            {/* Chat Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              minHeight: '120px',
              maxHeight: '250px'
            }}>
              {/* Welcome */}
              {aiMessages.length === 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #E8F8FF, #D0F0FF)',
                  border: '1px solid #B8E4F5',
                  borderRadius: '18px 18px 18px 4px',
                  padding: '12px 16px',
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '14px',
                  color: '#1a1a1a',
                  lineHeight: '1.5'
                }}>
                  🤖 Main hun tera Calculator AI! 
                  Koi bhi calculation explain 
                  karwao ya word problem solve 
                  karwao — sab ho jaayega! 😄
                </div>
              )}

              {/* Messages */}
              {aiMessages.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user'
                    ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user'
                      ? '18px 18px 4px 18px'
                      : '18px 18px 18px 4px',
                    background: msg.role === 'user'
                      ? '#00A8D6'
                      : 'linear-gradient(135deg, #E8F8FF, #D0F0FF)',
                    border: msg.role === 'ai'
                      ? '1px solid #B8E4F5' : 'none',
                    color: msg.role === 'user'
                      ? 'white' : '#1a1a1a',
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Loading dots */}
              {aiLoading && (
                <div style={{display:'flex', justifyContent:'flex-start'}}>
                  <div style={{
                    padding: '10px 14px',
                    background: 'linear-gradient(135deg, #E8F8FF, #D0F0FF)',
                    borderRadius: '18px 18px 18px 4px',
                    border: '1px solid #B8E4F5',
                    display: 'flex',
                    gap: '4px'
                  }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{
                        width: '6px', height: '6px',
                        borderRadius: '50%',
                        background: '#00A8D6',
                        animation: 'typingDot 1.2s infinite',
                        animationDelay: `${i * 0.15}s`
                      }}/>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Buttons */}
            <div style={{
              padding: '8px 16px',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              scrollbarWidth: 'none'
            }}>
              {(quickButtons[activeMode] || quickButtons.basic)
                .map((btn, i) => (
                <button
                  key={i}
                  onClick={() => askCalculatorAI(btn.q)}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '8px 12px',
                    background: '#F0F9FF',
                    border: '1.5px solid #E0F4FB',
                    borderRadius: '20px',
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: '700',
                    fontSize: '12px',
                    color: '#00A8D6',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >{btn.label}</button>
              ))}
            </div>

            {/* Input */}
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '8px 16px 24px 16px',
              alignItems: 'center'
            }}>
              <input
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => {
                  if(e.key === 'Enter' && aiInput.trim()) {
                    askCalculatorAI(aiInput)
                  }
                }}
                placeholder="Kuch bhi poochho..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '20px',
                  border: '1.5px solid #E0F4FB',
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '14px',
                  outline: 'none',
                  background: '#F8FDFF'
                }}
              />
              <button
                onClick={() => {
                  if(aiInput.trim()) 
                    askCalculatorAI(aiInput)
                }}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: aiInput.trim()
                    ? '#00A8D6' : '#E0F4FB',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <svg width="16" height="16"
                  viewBox="0 0 24 24" fill="none"
                  stroke={aiInput.trim() 
                    ? "white" : "#00A8D6"
                  }
                  strokeWidth="2.5"
                >
                  <line x1="12" y1="19" x2="12" y2="5"/>
                  <polyline points="5 12 12 5 19 12"/>
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
