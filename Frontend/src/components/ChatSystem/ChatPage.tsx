import { useState, useEffect } from 'react'

const dummyUsers = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Sarah Johnson' },
  { id: '3', name: 'Adeepa K' }
]

export default function ChatPage() {
  const [topOffset, setTopOffset] = useState<number>(64)

  useEffect(() => {
    function updateOffset() {
      const header = document.querySelector('header') as HTMLElement | null
      const h = header ? Math.ceil(header.getBoundingClientRect().height) : 64
      setTopOffset(h)
    }

    updateOffset()
    window.addEventListener('resize', updateOffset)
    // also observe mutations to header size (e.g., responsive changes)
    let ro: ResizeObserver | undefined
    const headerEl = document.querySelector('header') as HTMLElement | null
    const win = window as Window & { ResizeObserver?: typeof ResizeObserver }
    if (headerEl && typeof win.ResizeObserver === 'function') {
      // ResizeObserver is available
      ro = new win.ResizeObserver(() => updateOffset())
      ro.observe(headerEl)
    }

    return () => {
      window.removeEventListener('resize', updateOffset)
      if (ro && headerEl) ro.unobserve(headerEl)
    }
  }, [])
  const [selectedUser, setSelectedUser] = useState(dummyUsers[0])
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([])
  const [input, setInput] = useState('')

  function sendMessage() {
    if (!input.trim()) return
    setMessages(prev => [...prev, { from: 'You', text: input }])
    // add simulated reply
    setTimeout(() => {
      setMessages(prev => [...prev, { from: selectedUser.name, text: 'Thanks, got your message!' }])
    }, 700)
    setInput('')
  }

  return (
  <div className="fixed left-0 right-0 bottom-0 bg-gray-50" style={{ top: `${topOffset}px` }}>
      <div className="h-full flex">
        <aside className="w-80 bg-white border-r flex flex-col">
          <div className="p-4 border-b font-semibold">Contacts</div>
          <ul className="flex-1 overflow-auto">
            {dummyUsers.map(u => (
              <li
                key={u.id}
                className={`p-4 cursor-pointer hover:bg-gray-100 transition-colors ${selectedUser.id === u.id ? 'bg-gray-100' : ''}`}
                onClick={() => setSelectedUser(u)}
              >
                {u.name}
              </li>
            ))}
          </ul>
        </aside>

  <section className="flex-1 flex flex-col min-h-0">
          <header className="p-4 border-b flex items-center justify-between bg-white">
            <div className="font-semibold">Chat with {selectedUser.name}</div>
            <div className="text-sm text-green-600">Online</div>
          </header>

          <div className="p-6 flex-1 overflow-auto bg-gray-50 pb-6">
            <div className="flex flex-col gap-4 w-full">
              {messages.length === 0 && <div className="text-gray-400">No messages yet. Say hello 👋</div>}
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.from === 'You' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg max-w-[70%] ${m.from === 'You' ? 'bg-primary-500 text-white' : 'bg-white shadow'}`}>
                    <div className="text-xs text-gray-500 mb-1">{m.from}</div>
                    <div>{m.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <footer className="p-4 border-t bg-white flex-shrink-0">
            <div className="flex gap-2 w-full">
              <input value={input} onChange={e => setInput(e.target.value)} className="flex-1 px-4 py-3 border rounded-lg" placeholder={`Message ${selectedUser.name}...`} />
              <button
                type="button"
                aria-label="Send message"
                onClick={sendMessage}
                className="px-5 py-3 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-300 dark:bg-purple-500"
              >
                Send
              </button>
            </div>
          </footer>
        </section>
      </div>
    </div>
  )
}
