
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { DollarSign, TrendingUp, TrendingDown, FileText, Download, Receipt, Calendar, Plus, X, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FinanceRecord } from '../types';
import { CustomDatePicker } from '../components/CustomDatePicker';

const Finance = () => {
  const { invoices, finance, addTransaction, formatCurrency, currency } = useData();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  const [viewMode, setViewMode] = useState<'Dashboard' | 'General Ledger'>('Dashboard');
  
  // Date Range State
  const [dateRange, setDateRange] = useState({
    start: '2023-01-01', // Default to include mock data
    end: new Date().toISOString().split('T')[0]
  });

  // Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
      description: '',
      amount: '',
      method: 'Cash'
  });

  // Filter logic
  const isWithinRange = (dateStr: string) => {
      return dateStr >= dateRange.start && dateStr <= dateRange.end;
  };

  // Filtered Data
  const filteredInvoices = invoices.filter(inv => isWithinRange(inv.date));
  const filteredFinance = finance.filter(f => isWithinRange(f.date));

  // Calculations
  const billingIncome = filteredInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  
  const manualIncome = filteredFinance
    .filter(t => t.category === 'Income' && !t.description.startsWith('Inv #'))
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const totalExpense = filteredFinance
    .filter(t => t.category === 'Expense')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const totalIncome = billingIncome + manualIncome;
  const netProfit = totalIncome - totalExpense;

  const allTransactions = [...filteredFinance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayTransactions = filter === 'All' 
    ? allTransactions 
    : allTransactions.filter(t => t.category === filter);

  const handleAddExpense = (e: React.FormEvent) => {
      e.preventDefault();
      if (!expenseForm.description || !expenseForm.amount) return;

      const newExpense: FinanceRecord = {
          id: `EXP-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description: expenseForm.description,
          category: 'Expense',
          amount: parseFloat(expenseForm.amount),
          method: expenseForm.method as any
      };

      addTransaction(newExpense);
      setExpenseForm({ description: '', amount: '', method: 'Cash' });
      setShowExpenseModal(false);
  };

  const handlePrintLedger = () => {
      window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Finance & Accounting</h1>
           <p className="text-sm text-slate-500">Financial health monitoring, expense tracking and ledger.</p>
        </div>
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm">
                <CustomDatePicker
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                    className="!text-sm !py-0.5 !border-0 w-32"
                    placeholder="Start Date"
                />
                <span className="text-slate-300">-</span>
                <CustomDatePicker
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                    className="!text-sm !py-0.5 !border-0 w-32"
                    placeholder="End Date"
                />
            </div>

            <div className="flex gap-2">
                <button onClick={() => setViewMode(viewMode === 'Dashboard' ? 'General Ledger' : 'Dashboard')} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                    {viewMode === 'Dashboard' ? 'View Ledger' : 'View Dashboard'}
                </button>
                <button onClick={() => setShowExpenseModal(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors justify-center">
                    <span className="font-bold">{currency === 'BDT' ? '৳' : '$'}</span> Record Expense
                </button>
            </div>
        </div>
      </div>

      {viewMode === 'Dashboard' && (
        <div className="space-y-6 print:hidden">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Income</p>
                            <h3 className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalIncome)}</h3>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600"><TrendingUp size={20} /></div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Billing Revenue</p>
                            <h3 className="text-2xl font-bold text-teal-600 mt-1">{formatCurrency(billingIncome)}</h3>
                        </div>
                        <div className="p-2 bg-teal-50 rounded-lg text-teal-600"><Receipt size={20} /></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">From Invoices in Period</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Expenses</p>
                            <h3 className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalExpense)}</h3>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg text-red-600"><TrendingDown size={20} /></div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-red-500 h-1.5 rounded-full" style={{ width: totalIncome > 0 ? `${(totalExpense/totalIncome)*100}%` : '0%' }}></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Net Profit</p>
                            <h3 className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(netProfit)}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 font-bold">{currency === 'BDT' ? '৳' : '$'}</div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Available Cash Flow</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Expense Breakdown */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4">Expense Distribution</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600">Inventory & Supplies</span>
                                <span className="font-bold text-slate-900">45%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full"><div className="bg-indigo-500 h-2 rounded-full" style={{width: '45%'}}></div></div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600">Salaries & Wages</span>
                                <span className="font-bold text-slate-900">30%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full"><div className="bg-pink-500 h-2 rounded-full" style={{width: '30%'}}></div></div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600">Utilities & Maintenance</span>
                                <span className="font-bold text-slate-900">15%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full"><div className="bg-amber-500 h-2 rounded-full" style={{width: '15%'}}></div></div>
                        </div>
                    </div>
                </div>

                {/* Live Transactions Table */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Recent Transactions</h3>
                        <div className="flex gap-2">
                            {['All', 'Income', 'Expense'].map(f => (
                                <button 
                                    key={f}
                                    onClick={() => setFilter(f as any)}
                                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${filter === f ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[400px]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white text-slate-500 font-medium border-b border-slate-100 sticky top-0">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Method</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {displayTransactions.length > 0 ? displayTransactions.map((txn) => (
                                    <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-slate-500 text-xs">{txn.date}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{txn.description}</div>
                                            <div className="text-xs text-slate-400 font-mono">{txn.id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                txn.category === 'Income' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                            }`}>
                                                {txn.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{txn.method}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${
                                            txn.category === 'Income' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {txn.category === 'Income' ? '+' : '-'}{formatCurrency(txn.amount)}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">No transactions found in this date range.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      )}

      {viewMode === 'General Ledger' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center print:hidden">
                  <div>
                      <h2 className="text-xl font-bold text-slate-900">General Ledger Statement</h2>
                      <p className="text-sm text-slate-500">Period: {dateRange.start} to {dateRange.end}</p>
                  </div>
                  <button onClick={handlePrintLedger} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
                      <Printer size={16} /> Print Statement
                  </button>
              </div>
              
              <div className="p-6" id="ledger-print">
                  {/* Print Header */}
                  <div className="hidden print:block mb-6 border-b border-black pb-4">
                      <h1 className="text-2xl font-bold">Visionary Care Hospital</h1>
                      <h2 className="text-xl">General Ledger Statement</h2>
                      <p>From: {dateRange.start} To: {dateRange.end}</p>
                  </div>

                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border-collapse">
                          <thead className="bg-slate-50 text-slate-600 font-bold uppercase print:bg-gray-100">
                              <tr>
                                  <th className="px-4 py-3 border border-slate-200">Date</th>
                                  <th className="px-4 py-3 border border-slate-200">Txn ID</th>
                                  <th className="px-4 py-3 border border-slate-200">Description</th>
                                  <th className="px-4 py-3 border border-slate-200 text-right">Debit (Exp)</th>
                                  <th className="px-4 py-3 border border-slate-200 text-right">Credit (Inc)</th>
                              </tr>
                          </thead>
                          <tbody>
                              {displayTransactions.map(txn => (
                                  <tr key={txn.id}>
                                      <td className="px-4 py-3 border border-slate-200">{txn.date}</td>
                                      <td className="px-4 py-3 border border-slate-200 font-mono text-xs">{txn.id}</td>
                                      <td className="px-4 py-3 border border-slate-200">{txn.description}</td>
                                      <td className="px-4 py-3 border border-slate-200 text-right text-red-600">
                                          {txn.category === 'Expense' ? formatCurrency(txn.amount) : '-'}
                                      </td>
                                      <td className="px-4 py-3 border border-slate-200 text-right text-green-600">
                                          {txn.category === 'Income' ? formatCurrency(txn.amount) : '-'}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                          <tfoot className="font-bold bg-slate-100 print:bg-gray-100">
                              <tr>
                                  <td colSpan={3} className="px-4 py-3 border border-slate-200 text-right">Totals</td>
                                  <td className="px-4 py-3 border border-slate-200 text-right text-red-600">{formatCurrency(totalExpense)}</td>
                                  <td className="px-4 py-3 border border-slate-200 text-right text-green-600">{formatCurrency(totalIncome)}</td>
                              </tr>
                              <tr>
                                  <td colSpan={3} className="px-4 py-3 border border-slate-200 text-right">Net Balance</td>
                                  <td colSpan={2} className={`px-4 py-3 border border-slate-200 text-center ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                      {formatCurrency(netProfit)}
                                  </td>
                              </tr>
                          </tfoot>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-lg text-slate-900">Record New Expense</h3>
                      <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                  </div>
                  <form onSubmit={handleAddExpense} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                          <input 
                            type="text" 
                            required
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="e.g. Office Supplies, Electricity Bill"
                            value={expenseForm.description}
                            onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Amount ({currency === 'BDT' ? '৳' : '$'})</label>
                          <input 
                            type="number" 
                            required
                            min="0"
                            step="0.01"
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="0.00"
                            value={expenseForm.amount}
                            onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                          <select 
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            value={expenseForm.method}
                            onChange={(e) => setExpenseForm({...expenseForm, method: e.target.value})}
                          >
                              <option>Cash</option>
                              <option>Card</option>
                              <option>Bank Transfer</option>
                          </select>
                      </div>
                      <div className="pt-4 flex gap-3">
                          <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
                          <button type="submit" className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Save Expense</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Finance;
