import { useEffect, useMemo, useState } from 'react'

type Product = {
  id: number
  title: string
  description: string
  active: boolean
  price: number
}

function formatChf(amount: number): string {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(amount)
}

function App() {
  const [products, setProducts] = useState<Product[]>([])

  const [newTitle, setNewTitle] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newActive, setNewActive] = useState(true)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editActive, setEditActive] = useState(true)

  const API_BASE = import.meta.env.VITE_API_URL ?? ''
  console.log(API_BASE)
  const api = (path: string) => (API_BASE ? `${API_BASE}${path}` : `/api${path}`)

  useEffect(() => {
    fetch(api('/products'))
      .then((r) => r.json())
      .then((data: Product[]) => setProducts(data))
      .catch(() => setProducts([]))
  }, [])

  const isAddDisabled = useMemo(() => {
    const price = Number(newPrice)
    return newTitle.trim() === '' || Number.isNaN(price) || price < 0
  }, [newTitle, newPrice])

  async function handleAddProduct() {
    const price = Number(newPrice)
    if (isAddDisabled) return
    const payload = {
      title: newTitle.trim(),
      description: newDescription,
      active: newActive,
      price,
    }
    const res = await fetch(api('/products'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return
    const created: Product = await res.json()
    setProducts((prev) => [...prev, created])
    setNewTitle('')
    setNewPrice('')
    setNewDescription('')
    setNewActive(true)
  }

  function startEdit(product: Product) {
    setEditingId(product.id)
    setEditTitle(product.title)
    setEditPrice(String(product.price))
    setEditDescription(product.description)
    setEditActive(product.active)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditTitle('')
    setEditPrice('')
    setEditDescription('')
    setEditActive(true)
  }

  async function saveEdit(id: number) {
    const price = Number(editPrice)
    if (editTitle.trim() === '' || Number.isNaN(price) || price < 0) return
    const payload = {
      title: editTitle.trim(),
      description: editDescription,
      active: editActive,
      price,
    }
    const res = await fetch(api(`/products/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return
    const updated: Product = await res.json()
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
    cancelEdit()
  }

  async function deleteProduct(id: number) {
    const res = await fetch(api(`/products/${id}`), { method: 'DELETE' })
    if (!res.ok) return
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Produkte</h1>
        <p className="mt-1 text-sm text-gray-600">Verwalte Produkte mit CRUD. Preise in CHF.</p>

        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-medium">Neues Produkt</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-500"
              placeholder="Titel"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <input
              type="number"
              step="0.05"
              min="0"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-500"
              placeholder="Preis (CHF)"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
            <input
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-500"
              placeholder="Beschreibung"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={newActive} onChange={(e) => setNewActive(e.target.checked)} />
              Aktiv
            </label>
            <div>
              <button
                disabled={isAddDisabled}
                onClick={handleAddProduct}
                className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Titel</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Beschreibung</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Aktiv</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Preis</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 align-middle">
                    {editingId === p.id ? (
                      <input
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-gray-500 focus:outline-none"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{p.title}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    {editingId === p.id ? (
                      <input
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-gray-500 focus:outline-none"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    ) : (
                      <span className="text-sm text-gray-700">{p.description || '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    {editingId === p.id ? (
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                        Aktiv
                      </label>
                    ) : (
                      <span className="text-sm text-gray-700">{p.active ? 'Ja' : 'Nein'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    {editingId === p.id ? (
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        className="w-32 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-gray-500 focus:outline-none"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{formatChf(p.price)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === p.id ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => saveEdit(p.id)}
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-500"
                        >
                          Speichern
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="rounded-md bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-300"
                        >
                          Abbrechen
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(p)}
                          className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-gray-800"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-500"
                        >
                          Löschen
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-600">Keine Produkte vorhanden.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
