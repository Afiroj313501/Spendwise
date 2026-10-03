import { useEffect, useMemo, useState } from 'react'
import { Plus, Receipt, Search, X } from 'lucide-react'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import { control, primaryButton } from '../components/ui/styles'
import { useAuth } from '../features/auth/AuthContext'
import TransactionFormModal from '../features/transactions/TransactionForModal'
import TransactionTable from '../features/transactions/TransactionTable'
import type { SortKey } from '../features/transactions/TransactionTable'
import { useDebounce } from '../hooks/useDebounce'
import { deleteTransaction, listCategories, listTransactions } from '../services/finance'
import type { Category, Transaction, TransactionList, TxType } from '../types/finance'
import { errorMessage } from '../utils/error'
import { formatMoney } from '../utils/format'

const PAGE_SIZE = 10

type Filters = {
  search: string
  type: '' | TxType
  categoryId: string
  from: string
  to: string
  sortBy: SortKey
  order: 'asc' | 'desc'
  page: number
}

const initialFilters: Filters = {
  search: '', type: '', categoryId: '', from: '', to: '', sortBy: 'date', order: 'desc', page: 1,
}

export default function Transactions() {
  const { user } = useAuth()
  const currency = user?.currency ?? 'BDT'

  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [categories, setCategories] = useState<Category[]>([])
  const [result, setResult] = useState<TransactionList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const debouncedSearch = useDebounce(filters.search)

  useEffect(() => {
    listCategories().then(setCategories).catch(() => undefined)
  }, [])

  const query = useMemo(() => {
    const p = new URLSearchParams({
      page: String(filters.page),
      limit: String(PAGE_SIZE),
      sortBy: filters.sortBy,
      order: filters.order,
    })
    if (debouncedSearch.trim()) p.set('search', debouncedSearch.trim())
    if (filters.type) p.set('type', filters.type)
    if (filters.categoryId) p.set('categoryId', filters.categoryId)
    if (filters.from) p.set('from', filters.from)
    if (filters.to) p.set('to', filters.to)
    return p.toString()
  }, [filters, debouncedSearch])

  useEffect(() => {
    let ignore = false // drops responses from outdated requests
    setLoading(true)
    setError('')
    listTransactions(query)
      .then((r) => {
        if (!ignore) setResult(r)
      })
      .catch((err) => {
        if (!ignore) setError(errorMessage(err))
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [query, reloadKey])

  // Any filter change goes back to page 1
  const patch = (p: Partial<Filters>) => setFilters((f) => ({ ...f, page: 1, ...p }))

  function toggleSort(key: SortKey) {
    setFilters((f) =>
      f.sortBy === key
        ? { ...f, order: f.order === 'asc' ? 'desc' : 'asc', page: 1 }
        : { ...f, sortBy: key, order: 'desc', page: 1 },
    )
  }

  const hasFilters = Boolean(filters.search || filters.type || filters.categoryId || filters.from || filters.to)
  const categoryOptions = categories.filter((c) => !filters.type || c.type === filters.type)

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(t: Transaction) {
    setEditing(t)
    setFormOpen(true)
  }

  function handleSaved() {
    setFormOpen(false)
    setEditing(null)
    setReloadKey((k) => k + 1)
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    setDeleteError('')
    try {
      await deleteTransaction(deleting.id)
      setDeleting(null)
      // If we removed the last row of a later page, step back one page
      if (result && result.data.length === 1 && filters.page > 1) {
        setFilters((f) => ({ ...f, page: f.page - 1 }))
      } else {
        setReloadKey((k) => k + 1)
      }
    } catch (err) {
      setDeleteError(errorMessage(err))
    } finally {
      setDeleteBusy(false)
    }
  }

  const money = (v?: string) => (v === undefined ? '—' : formatMoney(v, currency))
  const net = result ? Number(result.summary.net) : 0

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Transactions</h1>
          <p className="mt-1 text-lg text-slate-500">Track, search and manage every income and expense.</p>
        </div>
        <button onClick={openAdd} className={primaryButton}>
          <Plus size={18} /> Add transaction
        </button>
      </div>

      {/* Summary for the current filters */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="!p-5">
          <p className="text-sm text-slate-500">Income</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">{money(result?.summary.income)}</p>
        </Card>
        <Card className="!p-5">
          <p className="text-sm text-slate-500">Expenses</p>
          <p className="mt-1 text-2xl font-semibold text-red-500">{money(result?.summary.expense)}</p>
        </Card>
        <Card className="!p-5">
          <p className="text-sm text-slate-500">Net</p>
          <p className={`mt-1 text-2xl font-semibold ${net < 0 ? 'text-red-500' : 'text-slate-900'}`}>
            {money(result?.summary.net)}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mt-6 !p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={`${control} pl-11`}
              placeholder="Search description or category"
              value={filters.search}
              onChange={(e) => patch({ search: e.target.value })}
            />
          </div>
          <select className={control} value={filters.type}
            onChange={(e) => patch({ type: e.target.value as '' | TxType, categoryId: '' })}>
            <option value="">All types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <select className={control} value={filters.categoryId} onChange={(e) => patch({ categoryId: e.target.value })}>
            <option value="">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input className={control} type="date" aria-label="From date" value={filters.from}
            onChange={(e) => patch({ from: e.target.value })} />
          <input className={control} type="date" aria-label="To date" value={filters.to}
            onChange={(e) => patch({ to: e.target.value })} />
        </div>
        {hasFilters && (
          <button onClick={() => setFilters(initialFilters)}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline">
            <X size={14} /> Clear filters
          </button>
        )}
      </Card>

      {/* Table */}
      <Card className="mt-6">
        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        {loading && !result ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : result && result.data.length > 0 ? (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <TransactionTable
              items={result.data}
              currency={currency}
              sortBy={filters.sortBy}
              order={filters.order}
              onSort={toggleSort}
              onEdit={openEdit}
              onDelete={(t) => {
                setDeleteError('')
                setDeleting(t)
              }}
            />
            <Pagination
              page={result.meta.page}
              limit={result.meta.limit}
              total={result.meta.total}
              totalPages={result.meta.totalPages}
              onPage={(page) => setFilters((f) => ({ ...f, page }))}
            />
          </div>
        ) : !error ? (
          <div className="grid place-items-center py-14 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-brand-50 text-brand-600">
              <Receipt size={28} />
            </span>
            <h3 className="mt-4 text-xl font-semibold">
              {hasFilters ? 'No matching transactions' : 'No transactions yet'}
            </h3>
            <p className="mt-1 max-w-sm text-slate-500">
              {hasFilters ? 'Try changing or clearing your filters.' : 'Add your first income or expense to get started.'}
            </p>
            <button onClick={hasFilters ? () => setFilters(initialFilters) : openAdd} className={`${primaryButton} mt-5`}>
              {hasFilters ? 'Clear filters' : 'Add transaction'}
            </button>
          </div>
        ) : null}
      </Card>

      {formOpen && (
        <TransactionFormModal
          initial={editing}
          categories={categories}
          currency={currency}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
          onSaved={handleSaved}
        />
      )}

      {deleting && (
        <Modal title="Delete transaction" onClose={() => setDeleting(null)}>
          <p className="text-slate-600">
            Delete <span className="font-medium text-slate-900">{deleting.description || deleting.category?.name || 'this transaction'}</span>{' '}
            ({formatMoney(deleting.amount, currency)})? This can't be undone.
          </p>
          {deleteError && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{deleteError}</p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setDeleting(null)} className="rounded-full px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button onClick={confirmDelete} disabled={deleteBusy}
              className="rounded-full bg-red-500 px-5 py-2.5 font-medium text-white transition hover:bg-red-600 disabled:opacity-60">
              {deleteBusy ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}