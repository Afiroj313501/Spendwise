import type { Insight } from '../../types/finance'

export function insightContent(insight: Insight | null, money: (v: number | string) => string) {
  switch (insight?.kind) {
    case 'category_up':
      return {
        message: `Your ${insight.category} spending is up ${insight.percent}% (+${money(insight.amount)}) compared with last month. A budget can help keep it in check.`,
        action: 'Set Budget',
        to: '/app/budgets',
      }
    case 'spending_down':
      return {
        message: `Nice work! You've spent ${insight.percent}% less than the same period last month. Keep it going.`,
        action: 'View Transactions',
        to: '/app/transactions',
      }
    case 'no_data':
      return {
        message: 'Add a few transactions to unlock personalised insights about your spending.',
        action: 'Add Transaction',
        to: '/app/transactions',
      }
    default:
      return {
        message: 'Your spending looks steady. Set category budgets to stay on track.',
        action: 'Set Budget',
        to: '/app/budgets',
      }
  }
}