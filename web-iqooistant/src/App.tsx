import { useState, useRef, useEffect } from 'react';
import './App.css';
import { chatWithLLM, type ChatMessage } from './llm/llmClient';
import { getOpenRouterApiKey } from './config';
import { GoogleCloudStack } from './services/googleCloud';

interface Message {
  id: string;
  type: string;
  text?: string;
  toolData?: any;
  isCompleted?: boolean;
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

function App() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [toolsConfig, setToolsConfig] = useState({
    zomato: true,
    makemytrip: true,
    redbus: true,
    blinkit: true,
    chromepe: true
  });
  const [isAFModalVisible, setAFModalVisible] = useState(false);
  const [showApkBanner, setShowApkBanner] = useState(true);
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keySavedMsg, setKeySavedMsg] = useState('');
  const [isGCPModalVisible, setGCPModalVisible] = useState(false);

  // Auto-scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSend(transcript, true);
      };
      
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [chatHistory, toolsConfig]); // depend on state

  const startListening = () => {
    if (recognitionRef.current) {
      if (isListening) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn('Speech recognition stop error:', e);
        }
        setIsListening(false);
        return;
      }
      try {
        setIsListening(true);
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Speech recognition start error:', e);
        setIsListening(false);
      }
    } else {
      alert("Speech recognition not supported in this browser.");
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/\*/g, ''); 
      const utterance = new SpeechSynthesisUtterance(cleanText);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async (overrideText?: string, fromVoice = false) => {
    const textToSend = overrideText || inputText.trim();
    if (!textToSend || isTyping) return;

    const newUserMsg: Message = { id: Date.now().toString(), type: 'user', text: textToSend };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputText('');
    setIsTyping(true);

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: textToSend }];
    setChatHistory(newHistory);

    try {
      const finalHistory = await chatWithLLM(newHistory, (toolName, toolArgs, result) => {
        if (['place_order', 'book_trip', 'book_bus', 'place_grocery_order'].includes(toolName)) {
          const txnId = Date.now().toString();
          
          setMessages((prev) => [...prev, {
            id: txnId,
            type: 'tool_chromepe',
            toolData: { amount: result?.total || toolArgs?.total || 0, qrUrl: result?.deepLink },
          }]);

          return new Promise((resolve) => {
            if (!result?.statusUrl) {
              resolve('FAILED');
              return;
            }

            const pollInterval = setInterval(async () => {
              try {
                const res = await fetch(result.statusUrl);
                const data = await res.json();
                
                if (data.status === 'SUCCESS' || data.status === 'APPROVED') {
                  clearInterval(pollInterval);
                  setMessages(prev => prev.map(m => m.type === 'tool_chromepe' && m.id === txnId ? {
                     ...m,
                     isCompleted: true,
                     toolData: { ...m.toolData, status: 'APPROVED' }
                  } : m));
                  resolve('APPROVED');
                } else if (data.status === 'FAILED' || data.status === 'DECLINED' || data.status === 'REJECTED') {
                  clearInterval(pollInterval);
                  setMessages(prev => prev.map(m => m.type === 'tool_chromepe' && m.id === txnId ? {
                     ...m,
                     isCompleted: true,
                     toolData: { ...m.toolData, status: 'DECLINED' }
                  } : m));
                  resolve('DECLINED');
                }
              } catch (e) {
                console.error(e);
              }
            }, 3000);

            setTimeout(() => {
              clearInterval(pollInterval);
              setMessages(prev => prev.map(m => m.type === 'tool_chromepe' && m.id === txnId && !m.isCompleted ? {
                 ...m,
                 isCompleted: true,
                 toolData: { ...m.toolData, status: 'TIMEOUT' }
              } : m));
              resolve('TIMEOUT');
            }, 60000);
          });
        } else if (['search_hotels', 'select_hotel'].includes(toolName)) {
          setMessages((prev) => {
            const updated = prev.map(m => m.type.startsWith('tool_') ? { ...m, isCompleted: true } : m);
            return [...updated, { id: Date.now().toString(), type: 'tool_makemytrip', toolData: { query: toolName === 'search_hotels' ? 'Searching hotels...' : 'Selecting hotel...', name: toolName } }];
          });
        } else if (['search_buses', 'select_bus'].includes(toolName)) {
          setMessages((prev) => {
            const updated = prev.map(m => m.type.startsWith('tool_') ? { ...m, isCompleted: true } : m);
            return [...updated, { id: Date.now().toString(), type: 'tool_redbus', toolData: { query: toolName === 'search_buses' ? 'Searching buses...' : 'Selecting bus...', name: toolName } }];
          });
        } else if (['browse_groceries', 'add_grocery_to_cart'].includes(toolName)) {
          setMessages((prev) => {
            const updated = prev.map(m => m.type.startsWith('tool_') ? { ...m, isCompleted: true } : m);
            return [...updated, { id: Date.now().toString(), type: 'tool_blinkit', toolData: { query: toolName === 'browse_groceries' ? 'Browsing Groceries...' : 'Adding to Cart...', name: toolName } }];
          });
        } else if (['browse_menu', 'add_to_cart', 'view_cart'].includes(toolName)) {
          setMessages((prev) => {
            const updated = prev.map(m => m.type.startsWith('tool_') ? { ...m, isCompleted: true } : m);
            return [...updated, { id: Date.now().toString(), type: 'tool_zomato', toolData: { query: toolName === 'browse_menu' ? 'Browsing menu...' : 'Adding to cart...', name: toolName } }];
          });
        } else {
          setMessages((prev) => {
            const updated = prev.map(m => m.type.startsWith('tool_') ? { ...m, isCompleted: true } : m);
            return [...updated, {
              id: Date.now().toString(),
              type: `tool_${toolName.split('_')[0]}`,
              toolData: { query: `Running ${toolName}...`, name: toolName },
            }];
          });
        }
      }, false, toolsConfig);

      setChatHistory(finalHistory);
      
      const newUIMessages: Message[] = [];
      const addedMessages = finalHistory.slice(newHistory.length);
      for (const msg of addedMessages) {
        if (msg.role === 'tool' && msg.name === 'search_hotels') {
          try {
            const result = JSON.parse(msg.content || '{}');
            if (result.success && result.hotels) {
              newUIMessages.push({
                id: (msg.tool_call_id || Date.now().toString()) + '_hotels',
                type: 'tool_makemytrip_hotels',
                toolData: { hotels: result.hotels },
                isCompleted: true,
              });
            }
          } catch(e) {}
        }
        if (msg.role === 'tool' && msg.name === 'search_buses') {
          try {
            const result = JSON.parse(msg.content || '{}');
            if (result.success && result.buses) {
              newUIMessages.push({
                id: (msg.tool_call_id || Date.now().toString()) + '_buses',
                type: 'tool_redbus_buses',
                toolData: { buses: result.buses },
                isCompleted: true,
              });
            }
          } catch(e) {}
        }
      }

      const lastMessage = finalHistory[finalHistory.length - 1];
      if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content) {
        newUIMessages.push({
          id: Date.now().toString(),
          type: 'assistant',
          text: lastMessage.content,
        });
        if (fromVoice) speakText(lastMessage.content);
      }

      if (newUIMessages.length > 0) {
        setMessages((prev) => {
          const updated = prev.map(m => m.type.startsWith('tool_') ? { ...m, isCompleted: true } : m);
          return [...updated, ...newUIMessages];
        });
      }
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.message || 'Error communicating with assistant.';
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        text: `⚠️ **API Error:** ${errMsg}`
      }]);
      if (errMsg.includes('Missing') || errMsg.includes('API key') || errMsg.includes('401') || errMsg.includes('Unauthorized')) {
        setApiKeyInput(getOpenRouterApiKey());
        setSettingsModalVisible(true);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const getBrandLogo = (toolName: string) => {
    const base = toolName.replace('tool_', '');
    if (base === 'zomato') return 'https://www.google.com/s2/favicons?domain=zomato.com&sz=128';
    if (base === 'makemytrip') return 'https://www.google.com/s2/favicons?domain=makemytrip.com&sz=128';
    if (base === 'redbus') return 'https://www.google.com/s2/favicons?domain=redbus.in&sz=128';
    if (base === 'blinkit') return 'https://www.google.com/s2/favicons?domain=blinkit.com&sz=128';
    if (base === 'chromepe') return 'https://img.icons8.com/color/144/000000/google-pay-india.png';
    return null;
  };

  const handleToggle = (appId: string) => {
    setToolsConfig(prev => ({ ...prev, [appId as keyof typeof toolsConfig]: !prev[appId as keyof typeof toolsConfig] }));
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>✨ Gemini Desktop</h2>
        </div>
        <div className="sidebar-nav">
          <button className="nav-item active">New Conversation</button>
          <button className="nav-item">Transaction History</button>
          <button className="nav-item" onClick={() => { setApiKeyInput(getOpenRouterApiKey()); setKeySavedMsg(''); setSettingsModalVisible(true); }}>⚙️ App Settings</button>
          <button className="nav-item" onClick={() => setGCPModalVisible(true)}>☁️ Google Cloud Stack</button>
        </div>
      </aside>

      <div className="main-content">
        <header className="app-header">
          <button className="header-title-btn" onClick={() => setAFModalVisible(true)}>
            Gemini 3 Fast <span>▼</span>
          </button>
        </header>
        
        {isSettingsModalVisible && (
          <div className="modal-overlay" onClick={() => setSettingsModalVisible(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
              <div className="modal-header">
                <h3 className="modal-title">⚙️ App Settings</h3>
                <button className="modal-close-text" onClick={() => setSettingsModalVisible(false)}>Done</button>
              </div>
              <div style={{ padding: '16px 0' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#1f1f1f' }}>
                  OpenRouter API Key
                </label>
                <input
                  type="password"
                  placeholder="sk-or-v1-..."
                  value={apiKeyInput}
                  onChange={(e) => { setApiKeyInput(e.target.value); setKeySavedMsg(''); }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', lineHeight: '1.4' }}>
                  Required for LLM inferences and Android App Functions. Stored securely in your browser's local storage.
                </p>
                {keySavedMsg && (
                  <p style={{ color: '#16a34a', fontSize: '13px', fontWeight: 600, marginTop: '10px' }}>
                    {keySavedMsg}
                  </p>
                )}
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    className="apk-download-btn"
                    style={{ border: 'none', cursor: 'pointer' }}
                    onClick={() => {
                      if (!apiKeyInput.trim()) {
                        setKeySavedMsg('⚠️ Please enter a valid API key.');
                        return;
                      }
                      localStorage.setItem('VITE_OPENROUTER_API_KEY', apiKeyInput.trim());
                      setKeySavedMsg('✅ Key saved! Ready to chat.');
                      setTimeout(() => setSettingsModalVisible(false), 900);
                    }}
                  >
                    Save Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isGCPModalVisible && (
          <div className="modal-overlay" onClick={() => setGCPModalVisible(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px', maxHeight: '85vh', overflowY: 'auto' }}>
              <div className="modal-header">
                <h3 className="modal-title">☁️ Google Cloud Platform Architecture</h3>
                <button className="modal-close-text" onClick={() => setGCPModalVisible(false)}>Done</button>
              </div>
              <div style={{ padding: '12px 0' }}>
                <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '16px', lineHeight: '1.5' }}>
                  Enterprise conversational commerce solution powered by 8 integrated Google Cloud technologies:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e3a8a', marginBottom: '4px' }}>
                      1. AI & Intelligent Agent
                    </div>
                    <div style={{ fontSize: '12px', color: '#334155', lineHeight: '1.4' }}>
                      • <strong>Gemini on Vertex AI:</strong> Core Agentic Brain (gemini-2.5-flash) with function calling & low-latency reasoning.<br />
                      • <strong>Vertex AI Search:</strong> Intelligent semantic catalog discovery across Zomato, MMT, RedBus, Blinkit.
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#047857', marginBottom: '4px' }}>
                      2. Application & Hosting
                    </div>
                    <div style={{ fontSize: '12px', color: '#334155', lineHeight: '1.4' }}>
                      • <strong>Cloud Run:</strong> Serverless commerce backend ({GoogleCloudStack.cloudRun.getEndpoint()}) with auto-scaling.<br />
                      • <strong>Cloud Storage (GCS):</strong> High-throughput CDN digital asset hosting for partner logos and menus.
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#b45309', marginBottom: '4px' }}>
                      3. Data & Persistence
                    </div>
                    <div style={{ fontSize: '12px', color: '#334155', lineHeight: '1.4' }}>
                      • <strong>AlloyDB / Cloud SQL:</strong> Ultra-fast relational persistence for user carts, ledgers & strict ACID transactions.<br />
                      • <strong>BigQuery:</strong> Data warehouse real-time streaming ingestion for conversational clickstreams and logs.
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#6d28d9', marginBottom: '4px' }}>
                      4. Analytics & AI Insights
                    </div>
                    <div style={{ fontSize: '12px', color: '#334155', lineHeight: '1.4' }}>
                      • <strong>BigQuery AI:</strong> In-database predictive cross-sells, ML re-order affinity, and transaction anomaly scoring.<br />
                      • <strong>Looker:</strong> Business intelligence tracking conversion rates, zero-dropoff ROI ({GoogleCloudStack.looker.getKeyMetrics().dropoffReduction} reduction).
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                    ● Stack Status: Online & Integrated
                  </span>
                  <button className="apk-download-btn" style={{ border: 'none', cursor: 'pointer' }} onClick={() => setGCPModalVisible(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isAFModalVisible && (
          <div className="modal-overlay" onClick={() => setAFModalVisible(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Android Functions (AF)</h3>
                <button className="modal-close-text" onClick={() => setAFModalVisible(false)}>Done</button>
              </div>
              <div className="af-list" style={{ overflowY: 'auto', paddingRight: '8px' }}>
                {[
                  { id: 'zomato', name: 'Zomato', logo: 'https://www.google.com/s2/favicons?domain=zomato.com&sz=64' },
                  { id: 'makemytrip', name: 'MakeMyTrip', logo: 'https://www.google.com/s2/favicons?domain=makemytrip.com&sz=64' },
                  { id: 'redbus', name: 'RedBus', logo: 'https://www.google.com/s2/favicons?domain=redbus.in&sz=64' },
                  { id: 'blinkit', name: 'Blinkit', logo: 'https://www.google.com/s2/favicons?domain=blinkit.com&sz=64' },
                  { id: 'chromepe', name: 'Google Pay', logo: 'https://img.icons8.com/color/144/000000/google-pay-india.png' }
                ].map(app => (
                  <div key={app.id} className="af-row" style={{ padding: '8px 0', borderBottom: '1px solid #f2f2f7' }}>
                    <div className="af-info">
                      <img src={app.logo} alt={app.name} className="af-logo" style={{ borderRadius: '8px' }} />
                      <span style={{ fontWeight: 600 }}>{app.name}</span>
                    </div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={toolsConfig[app.id as keyof typeof toolsConfig]} 
                        onChange={() => handleToggle(app.id)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <main className="chat-area">
          {showApkBanner && (
            <div className="apk-notice-card">
              <div className="apk-notice-icon-box">
                <img 
                  src="https://img.icons8.com/color/144/000000/google-pay-india.png" 
                  alt="GGpay App" 
                  className="apk-notice-icon" 
                />
              </div>
              <div className="apk-notice-body">
                <div className="apk-notice-header">
                  <div className="apk-notice-title-group">
                    <span className="apk-badge">Payments Companion</span>
                    <h3 className="apk-notice-title">Download GGpay (ChromePe) App to Test Flow</h3>
                  </div>
                  <button 
                    className="apk-notice-close" 
                    onClick={() => setShowApkBanner(false)}
                    aria-label="Dismiss banner"
                  >
                    ✕
                  </button>
                </div>
                <p className="apk-notice-desc">
                  To test the bank-regulated zero-trust UPI payment flow locally, download and install <strong>GGpay-v1.0.apk</strong> on your Android phone or local emulator. Bookings initiated here are sent to GGpay for secure MPIN approval.
                </p>
                <div className="apk-notice-footer">
                  <a 
                    href="https://github.com/1Athar/ai-builder-hackathon/raw/main/apks/GGpay-v1.0.apk" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="apk-download-btn"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download GGpay-v1.0.apk (64 MB)
                  </a>
                  <div className="apk-notice-meta">
                    <span>Configured VPA: <code>prasad@okicici</code></span>
                    <span className="dot-sep">•</span>
                    <span>Direct Android APK</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        {messages.length === 0 ? (
          <div className="empty-state">
            <span className="sparkle">✦</span>
            <h2>How can I help you today?</h2>
          </div>
        ) : (
          <div className="message-list">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message-wrapper ${msg.type === 'user' ? 'user' : 'assistant'}`}>
                {msg.type === 'user' && <div className="bubble user">{msg.text}</div>}
                {msg.type === 'assistant' && (
                  <div className="bubble assistant">
                    <span className="sparkle-inline">✦</span>
                    <div dangerouslySetInnerHTML={{ __html: msg.text?.replace(/\n/g, '<br/>') || '' }} />
                  </div>
                )}
                {msg.type === 'tool_makemytrip_hotels' && (
                  <div className="carousel-wrapper">
                    <div className="carousel-title">
                      <img src="https://www.google.com/s2/favicons?domain=makemytrip.com&sz=64" alt="MakeMyTrip" className="carousel-title-icon" />
                      <span>Available Hotels</span>
                    </div>
                    <div className="carousel-container">
                      {msg.toolData?.hotels?.map((hotel: any) => (
                        <div key={hotel.id} className="hotel-card" onClick={() => handleSend(`Select hotel ${hotel.id}`)}>
                          <img src={hotel.image_url} alt={hotel.name} className="hotel-card-image" />
                          <div className="hotel-card-info">
                            <h4 className="hotel-card-name" title={hotel.name}>{hotel.name}</h4>
                            <p className="hotel-card-details">{hotel.city} • ⭐ {hotel.rating}</p>
                            <div className="hotel-card-footer">
                              <span className="hotel-card-price">₹{hotel.price.toLocaleString()} <span className="price-unit">/ night</span></span>
                              <button className="card-select-btn">Select</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {msg.type === 'tool_redbus_buses' && (
                  <div className="carousel-wrapper">
                    <div className="carousel-title">
                      <img src="https://www.google.com/s2/favicons?domain=redbus.in&sz=64" alt="RedBus" className="carousel-title-icon" />
                      <span>Available Buses</span>
                    </div>
                    <div className="carousel-container">
                      {msg.toolData?.buses?.map((bus: any, bIdx: number) => (
                        <div key={bIdx} className="bus-card" onClick={() => handleSend(`Select ${bus.operator}`)}>
                          <div className="bus-card-header">
                            <span className="bus-operator" title={bus.operator}>{bus.operator}</span>
                            <span className="bus-rating">⭐ {bus.rating}</span>
                          </div>
                          <p className="bus-type">{bus.type}</p>
                          <span className="bus-route-badge">{bus.route}</span>
                          <div className="bus-card-footer">
                            <span className="bus-timing">{bus.departure} - {bus.arrival}</span>
                            <span className="bus-price">₹{bus.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {msg.type.startsWith('tool_') && msg.type !== 'tool_makemytrip_hotels' && msg.type !== 'tool_redbus_buses' && (
                  <div className={`tool-widget ${msg.isCompleted ? 'completed' : 'pulsing'}`}>
                    <div className="tool-info">
                      <div className="tool-icon" style={{ overflow: 'hidden' }}>
                        {getBrandLogo(msg.type) ? (
                          <img src={getBrandLogo(msg.type)!} alt={msg.type} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerText = msg.type.replace('tool_', '').charAt(0).toUpperCase(); }} />
                        ) : (
                          msg.type.replace('tool_', '').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="tool-text">
                        <strong>{msg.type === 'tool_chromepe' ? (msg.isCompleted ? (msg.toolData?.status === 'APPROVED' ? 'Payment Done' : 'Payment Failed') : 'Pending Approval') : msg.type.replace('tool_', '').toUpperCase()}</strong>
                        <p>{msg.toolData?.query || (msg.type === 'tool_chromepe' ? 'Check phone for ChromePe notification' : 'Processing request...')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="typing-indicator">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <footer className="input-area">
        <div className="input-wrapper">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? "Listening..." : "Ask Gemini Desktop"}
            className="chat-input"
          />
          <button className={`mic-button ${isListening ? 'listening' : ''}`} onClick={startListening}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>
          <button className="send-button" onClick={() => handleSend()} disabled={!inputText.trim() || isTyping}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          </button>
        </div>
      </footer>
      </div>
    </div>
  );
}

export default App;
