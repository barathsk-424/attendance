import { useState } from 'react'
import { MessageCircle, Send, X, Bot } from 'lucide-react'
import './Chatbot.css'

const SAMPLE_RESPONSES = [
  "I can help you analyze student performance trends. Try asking about a specific class or subject!",
  "Based on current data, 5 students are at risk of failing this semester. Would you like to see details?",
  "The overall attendance rate is 85%. Classes with below-average attendance include 10th Grade B.",
  "Mathematics has the highest average score (78%), while Chemistry needs improvement (62%).",
  "I recommend focusing on students with attendance below 70% — they show a 3x higher fail rate.",
]

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I\'m the GrowthIQ AI Assistant. Ask me about student performance, predictions, or attendance insights.' }
  ])
  const [input, setInput] = useState('')

  function handleSend() {
    if (!input.trim()) return
    const userMsg = { role: 'user', text: input.trim() }
    const botMsg = { role: 'bot', text: SAMPLE_RESPONSES[Math.floor(Math.random() * SAMPLE_RESPONSES.length)] }
    setMessages(prev => [...prev, userMsg, botMsg])
    setInput('')
  }

  return (
    <>
      {!open && (
        <button className="chatbot-fab" onClick={() => setOpen(true)}>
          <MessageCircle size={24} />
          <span className="fab-pulse" />
        </button>
      )}
      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div className="chatbot-title"><Bot size={18} /> GrowthIQ AI</div>
            <button className="chatbot-close" onClick={() => setOpen(false)}><X size={16} /></button>
          </div>
          <div className="chatbot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                {m.role === 'bot' && <div className="bot-avatar"><Bot size={14} /></div>}
                <div className="msg-bubble">{m.text}</div>
              </div>
            ))}
          </div>
          <div className="chatbot-input">
            <input placeholder="Ask about performance, predictions..." value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()} />
            <button onClick={handleSend}><Send size={16} /></button>
          </div>
        </div>
      )}
    </>
  )
}
