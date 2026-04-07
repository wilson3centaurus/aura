'use client'

import { useState, useEffect } from 'react'
import { MdAdd, MdEdit, MdDelete, MdSave, MdClose } from 'react-icons/md'

interface InfoItem {
  id: string
  key: string
  value: string
  category: string
}

const CATEGORIES = ['general', 'contact', 'visiting', 'facilities', 'capacity']

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  general:   { label: 'General Information', icon: '🏥' },
  contact:   { label: 'Contact Details',     icon: '📞' },
  visiting:  { label: 'Visiting Rules',      icon: '🕐' },
  facilities:{ label: 'Facilities',          icon: '🏢' },
  capacity:  { label: 'Capacity & Stats',    icon: '📊' },
}

export default function AdminInformation() {
  const [items,          setItems]          = useState<InfoItem[]>([])
  const [loading,        setLoading]        = useState(true)
  const [editingId,      setEditingId]      = useState<string | null>(null)
  const [editValue,      setEditValue]      = useState('')
  const [saving,         setSaving]         = useState(false)
  const [addingCategory, setAddingCategory] = useState<string | null>(null)
  const [newKey,         setNewKey]         = useState('')
  const [newValue,       setNewValue]       = useState('')

  useEffect(() => {
    fetch('/api/information')
      .then(r => r.json())
      .then(data => { setItems(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const startEdit = (item: InfoItem) => {
    setEditingId(item.id)
    setEditValue(item.value)
    setAddingCategory(null)
  }

  const cancelEdit = () => { setEditingId(null); setEditValue('') }

  const saveEdit = async (item: InfoItem) => {
    setSaving(true)
    try {
      const res = await fetch('/api/information', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, key: item.key, value: editValue, category: item.category }),
      })
      if (res.ok) {
        const updated = await res.json()
        setItems(prev => prev.map(i => i.id === item.id ? updated : i))
        setEditingId(null)
      }
    } catch { /* silent */ }
    setSaving(false)
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this information item?')) return
    await fetch(`/api/information?id=${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const addItem = async (category: string) => {
    if (!newKey.trim() || !newValue.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/information', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newKey.trim().toLowerCase().replace(/\s+/g, '_'),
          value: newValue.trim(),
          category,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setItems(prev => [...prev, created])
        setNewKey('')
        setNewValue('')
        setAddingCategory(null)
      }
    } catch { /* silent */ }
    setSaving(false)
  }

  const allCategories = Array.from(new Set([...CATEGORIES, ...items.map(i => i.category)]))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">Hospital Information</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Manage the information shown to patients on the kiosk — visiting hours, contacts, facilities, and more.
        </p>
      </div>

      {allCategories.map(category => {
        const meta = CATEGORY_META[category] ?? { label: category, icon: '📋' }
        const catItems = items.filter(i => i.category === category)
        const isAdding = addingCategory === category

        return (
          <div key={category} className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] overflow-hidden">
            {/* Category header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-[#222] bg-gray-50 dark:bg-[#0f0f0f]">
              <div className="flex items-center gap-2">
                <span className="text-lg">{meta.icon}</span>
                <h2 className="font-bold text-gray-900 dark:text-white text-sm">{meta.label}</h2>
                <span className="text-xs text-gray-400 dark:text-gray-600">({catItems.length})</span>
              </div>
              <button
                onClick={() => { setAddingCategory(isAdding ? null : category); setNewKey(''); setNewValue('') }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#003d73] text-white text-xs font-semibold hover:bg-[#002d57] transition-colors"
              >
                <MdAdd size={14} />
                Add
              </button>
            </div>

            {/* Add form */}
            {isAdding && (
              <div className="px-5 py-3 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30 space-y-2">
                <input
                  type="text"
                  placeholder="Key (e.g. emergency_contact)"
                  value={newKey}
                  onChange={e => setNewKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm focus:outline-none focus:ring-2 focus:ring-[#003d73] text-gray-900 dark:text-white"
                />
                <textarea
                  placeholder="Value (the information to display)"
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#003d73] text-gray-900 dark:text-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => addItem(category)}
                    disabled={saving || !newKey.trim() || !newValue.trim()}
                    className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#003d73] text-white text-xs font-bold disabled:opacity-50 hover:bg-[#002d57] transition-colors"
                  >
                    <MdSave size={12} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setAddingCategory(null)}
                    className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400 text-xs font-bold hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                  >
                    <MdClose size={12} />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="divide-y divide-gray-100 dark:divide-[#222]">
              {catItems.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-400 dark:text-gray-600 italic">No items yet. Click Add to create one.</p>
              ) : catItems.map(item => (
                <div key={item.id} className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">
                        {item.key.replace(/_/g, ' ')}
                      </p>
                      {editingId === item.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            rows={4}
                            autoFocus
                            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] border border-[#003d73] text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#003d73] text-gray-900 dark:text-white"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(item)}
                              disabled={saving}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#003d73] text-white text-xs font-bold disabled:opacity-50 hover:bg-[#002d57] transition-colors"
                            >
                              <MdSave size={12} />
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400 text-xs font-bold hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                            >
                              <MdClose size={12} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{item.value}</p>
                      )}
                    </div>
                    {editingId !== item.id && (
                      <div className="flex gap-1 flex-shrink-0 mt-0.5">
                        <button
                          onClick={() => startEdit(item)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 transition-colors"
                        >
                          <MdEdit size={15} />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors"
                        >
                          <MdDelete size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
