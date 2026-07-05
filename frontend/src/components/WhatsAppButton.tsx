'use client'

import { useState } from 'react'
import { MessageCircle, X, Send, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { categories, fillTemplate, getWhatsAppLink, type Category, type Template } from '@/lib/whatsapp-templates'

interface WhatsAppButtonProps {
  phone: string
  name: string
  defaultCategory?: string
  presetFields?: Record<string, string>
  size?: 'sm' | 'default' | 'icon'
}

export default function WhatsAppButton({ phone, name, defaultCategory, presetFields = {}, size = 'icon' }: WhatsAppButtonProps) {
  const [open, setOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category>(
    categories.find(c => c.id === defaultCategory) || categories[0]
  )
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(
    selectedCategory.templates[0]
  )
  const [fields, setFields] = useState<Record<string, string>>(presetFields)

  const handleCategoryChange = (catId: string) => {
    const cat = categories.find(c => c.id === catId) || categories[0]
    setSelectedCategory(cat)
    setSelectedTemplate(cat.templates[0])
  }

  const message = fillTemplate(selectedTemplate?.text || '', { name, phone, ...fields })

  const handleSend = () => {
    const link = getWhatsAppLink(phone, message)
    window.open(link, '_blank')
  }

  const extractVars = (text: string): string[] => {
    const matches = text.match(/\{(\w+)\}/g)
    return [...new Set(matches?.map(m => m.replace(/[{}]/g, '')) || [])]
  }

  const dynamicVars = extractVars(selectedTemplate?.text || '').filter(v => !['name', 'phone'].includes(v))

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg hover:bg-green-100 transition-colors"
        title="إرسال واتساب"
      >
        <MessageCircle className="w-5 h-5 text-green-600" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-bold">إرسال رسالة واتساب</h3>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                <Phone className="w-4 h-4 text-green-600" />
                <span className="font-medium text-sm">{name}</span>
                <span className="text-gray-400 text-sm" dir="ltr">{phone}</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">الموضوع</label>
                <select
                  value={selectedCategory.id}
                  onChange={e => handleCategoryChange(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-green-400 focus:border-green-400"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">القالب</label>
                <select
                  value={selectedTemplate?.id}
                  onChange={e => {
                    const cat = categories.find(c => c.id === selectedCategory.id)
                    const tpl = cat?.templates.find(t => t.id === e.target.value)
                    if (tpl) setSelectedTemplate(tpl)
                  }}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-green-400 focus:border-green-400"
                >
                  {selectedCategory.templates.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>{tpl.label}</option>
                  ))}
                </select>
              </div>

              {dynamicVars.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">الحقول</label>
                  <div className="grid grid-cols-2 gap-2">
                    {dynamicVars.map(v => (
                      <div key={v}>
                        <input
                          placeholder={v}
                          value={fields[v] || ''}
                          onChange={e => setFields({ ...fields, [v]: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">الرسالة</label>
                <textarea
                  value={message}
                  onChange={e => {
                    const newText = e.target.value
                    const cat = categories.find(c => c.id === selectedCategory.id)
                    const matching = cat?.templates.find(t => fillTemplate(t.text, { name, phone, ...fields }) === newText)
                    if (matching) setSelectedTemplate(matching)
                  }}
                  rows={5}
                  className="w-full border rounded-xl px-4 py-3 text-sm resize-none bg-gray-50"
                  dir="auto"
                />
              </div>

              <Button onClick={handleSend} className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 h-12 text-base">
                <Send className="w-5 h-5" /> فتح واتساب وإرسال
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
