
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Search, ShoppingCart, Archive, TrendingDown, Printer, Truck, Package, Phone, Mail, RotateCcw, Eye, Pill, CheckCircle, AlertTriangle, BarChart3, Plus, FileText, Glasses, ReceiptText, X, Save, Trash2, PenTool, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InventoryItem, Supplier } from '../types';
import { CustomDatePicker } from '../components/CustomDatePicker';

const Pharmacy = () => {
    const {
        inventory, suppliers, purchaseOrders, updateInventory, addInventoryItem,
        addSupplier, addPurchaseOrder, addInvoice, prescriptions, formatCurrency,
        currency, shops, itemGroups, itemCategories, itemUnits,
        addItemGroup, updateItemGroup, deleteItemGroup,
        addItemCategory, updateItemCategory, deleteItemCategory,
        addItemUnit, updateItemUnit, deleteItemUnit,
        addShop, updateShop, deleteShop
    } = useData();
    const navigate = useNavigate();

    const [selectedShopId, setSelectedShopId] = useState(shops[0]?.id || '');
    const [activeTab, setActiveTab] = useState<'pharmacy_pos' | 'vision_pos' | 'inventory' | 'suppliers' | 'purchase' | 'master' | 'expiry'>('pharmacy_pos');
    const [cart, setCart] = useState<{
        id: string,
        name: string,
        price: number,
        qty: number,
        category: string,
        batchId: string,
        batchNo: string,
        expiryDate: string
    }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [rxSearch, setRxSearch] = useState('');
    const [selectedRx, setSelectedRx] = useState<any>(null);

    // Master States
    const [editingMaster, setEditingMaster] = useState<{ type: 'group' | 'category' | 'unit', id: string } | null>(null);
    const [masterForm, setMasterForm] = useState<any>({});

    // Modal States
    const [showAddItem, setShowAddItem] = useState(false);
    const [showAddSupplier, setShowAddSupplier] = useState(false);
    const [showNewOrder, setShowNewOrder] = useState(false);

    // New Data States
    const [newItem, setNewItem] = useState<any>({
        groupId: '',
        categoryId: '',
        baseUnitId: '',
        reorderLevel: 10,
        batches: []
    });
    const [newBatch, setNewBatch] = useState<any>({
        batchNo: '',
        mfgDate: '',
        expiryDate: '',
        stock: 0,
        purchasePrice: 0,
        salePrice: 0,
        mrp: 0
    });
    const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({});
    const [poData, setPoData] = useState({ supplierId: '', items: [] as { itemName: string, qty: string, price: string }[] });

    const addToCart = (item: InventoryItem, batch: any) => {
        if (!batch || batch.stock <= 0) return;
        const existing = cart.find(c => c.id === item.id && c.batchId === batch.id);
        if (existing) {
            if (existing.qty >= batch.stock) return;
            setCart(cart.map(c => (c.id === item.id && c.batchId === batch.id) ? { ...c, qty: c.qty + 1 } : c));
        } else {
            setCart([...cart, {
                id: item.id,
                name: item.name,
                price: batch.salePrice,
                qty: 1,
                category: item.batches[0]?.purchasePrice ? 'Medicine' : 'Retail',
                batchId: batch.id,
                batchNo: batch.batchNo,
                expiryDate: batch.expiryDate
            }]);
        }
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(c => c.id !== id));
    };

    const handleCheckout = () => {
        const total = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);

        cart.forEach(cartItem => {
            const invItem = inventory.find(i => i.id === cartItem.id);
            if (invItem) {
                const updatedBatches = invItem.batches.map(b =>
                    b.id === cartItem.batchId ? { ...b, stock: b.stock - cartItem.qty } : b
                );
                updateInventory(cartItem.id, {
                    batches: updatedBatches,
                    totalStock: updatedBatches.reduce((sum, b) => sum + b.stock, 0)
                });
            }
        });

        const invId = `POS-${Date.now().toString().slice(-6)}`;
        addInvoice({
            id: invId,
            patientId: selectedRx?.patientId || 'WALK-IN',
            patientName: selectedRx?.patientName || 'Walk-in Customer',
            patientContact: '-',
            date: new Date().toISOString().split('T')[0],
            department: 'Pharmacy',
            items: cart.map(c => ({ id: c.id, description: c.name, qty: c.qty, price: c.price })),
            subtotal: total,
            tax: total * 0.05,
            discount: 0,
            totalAmount: total * 1.05,
            currency,
            paymentMethod: 'Cash',
            paymentStatus: 'Paid',
            workflowStatus: 'Completed'
        });

        window.print();
        setCart([]);
        setSelectedRx(null);
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItem.name && newBatch.batchNo) {
            addInventoryItem({
                id: `INV-${Date.now().toString().slice(-6)}`,
                name: newItem.name,
                groupId: newItem.groupId,
                categoryId: newItem.categoryId,
                baseUnitId: newItem.baseUnitId,
                totalStock: Number(newBatch.stock),
                reorderLevel: Number(newItem.reorderLevel),
                shopId: selectedShopId,
                batches: [{
                    ...newBatch,
                    id: `B-${Date.now().toString().slice(-4)}`,
                    stock: Number(newBatch.stock),
                    purchasePrice: Number(newBatch.purchasePrice),
                    salePrice: Number(newBatch.salePrice),
                    mrp: Number(newBatch.mrp)
                }]
            });
            setShowAddItem(false);
            setNewItem({ groupId: '', categoryId: '', baseUnitId: '', reorderLevel: 10 });
            setNewBatch({ batchNo: '', mfgDate: '', expiryDate: '', stock: 0, purchasePrice: 0, salePrice: 0, mrp: 0 });
        }
    };

    const handleAddSupplier = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSupplier.name) {
            addSupplier({
                id: `SUP-${Date.now()}`,
                name: newSupplier.name,
                contactPerson: newSupplier.contactPerson || '',
                email: newSupplier.email || '',
                phone: newSupplier.phone || '',
                itemsSupplied: []
            });
            setShowAddSupplier(false);
            setNewSupplier({});
        }
    };

    const handleCreatePO = (e: React.FormEvent) => {
        e.preventDefault();
        const sup = suppliers.find(s => s.id === poData.supplierId);
        if (sup) {
            addPurchaseOrder({
                id: `PO-${Date.now()}`,
                supplierId: sup.id,
                supplierName: sup.name,
                date: new Date().toISOString().split('T')[0],
                status: 'Ordered',
                items: poData.items.map(i => ({ itemName: i.itemName, qty: Number(i.qty), price: Number(i.price) })),
                total: poData.items.reduce((acc, i) => acc + (Number(i.qty) * Number(i.price)), 0)
            });
            setShowNewOrder(false);
            setPoData({ supplierId: '', items: [] });
        }
    };

    const filteredInventory = inventory.filter(i =>
        i.shopId === selectedShopId &&
        (i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const matchedPrescriptions = rxSearch ? prescriptions.filter(p =>
        p.patientName.toLowerCase().includes(rxSearch.toLowerCase()) ||
        p.patientId.toLowerCase().includes(rxSearch.toLowerCase())
    ) : [];

    const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
    const tax = subtotal * 0.05;
    const totalPayable = subtotal + tax;

    return (
        <div className="space-y-6 animate-in fade-in duration-300 min-h-screen">
            {/* Header & Command Center */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 print:hidden">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Pill className="text-teal-600" /> PHARMACY <span className="text-slate-400">&</span> <Glasses className="text-rose-600" /> VISION <span className="text-teal-600 uppercase">Hub</span>
                    </h1>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Omnichannel Healthcare Retail & Inventory Management System</p>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-1 rounded-xl flex items-center gap-2">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest pl-3">Active Hub:</span>
                        <select
                            value={selectedShopId}
                            onChange={(e) => { setSelectedShopId(e.target.value); setCart([]); }}
                            className="bg-transparent border-0 text-xs font-black uppercase tracking-widest outline-none focus:ring-0 cursor-pointer pr-8"
                        >
                            {shops.map(shop => (
                                <option key={shop.id} value={shop.id}>{shop.name} ({shop.type})</option>
                            ))}
                        </select>
                    </div>
                    <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-1.5 rounded-2xl flex flex-wrap gap-1 shadow-2xl shadow-slate-200/50">
                        {[
                            { id: 'pharmacy_pos', label: 'Rx POS', icon: ShoppingCart, color: 'text-teal-600' },
                            { id: 'vision_pos', label: 'Vision POS', icon: Glasses, color: 'text-rose-600' },
                            { id: 'inventory', label: 'Stock', icon: Archive, color: 'text-blue-600' },
                            { id: 'master', label: 'Masters', icon: Package, color: 'text-indigo-600' },
                            { id: 'expiry', label: 'Expiries', icon: AlertTriangle, color: 'text-rose-600', badge: true },
                            { id: 'suppliers', label: 'Nodes', icon: Truck, color: 'text-indigo-600' },
                            { id: 'purchase', label: 'Supply', icon: FileText, color: 'text-amber-600' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id as any); setCart([]); }}
                                className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest relative ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <tab.icon size={14} className={activeTab === tab.id ? 'text-white' : tab.color} />
                                {tab.label}
                                {tab.badge && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* POS Contextual Interface */}
            {(activeTab === 'pharmacy_pos' || activeTab === 'vision_pos') && (
                <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)] print:hidden">
                    {/* Left Column: Product Grid */}
                    <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 overflow-hidden">
                        <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder={`Search ${activeTab === 'pharmacy_pos' ? 'Medicines...' : 'Frames & Lenses...'}`}
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-xs font-bold focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            {activeTab === 'vision_pos' && (
                                <div className="relative w-full md:w-80">
                                    <PenTool className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Sync Rx (Patient ID/Name)"
                                        className="w-full pl-12 pr-6 py-4 bg-rose-50/50 border border-rose-100 rounded-[1.5rem] text-xs font-bold text-rose-900 placeholder:text-rose-300 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all"
                                        value={rxSearch}
                                        onChange={(e) => setRxSearch(e.target.value)}
                                    />
                                    {matchedPrescriptions.length > 0 && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-3xl shadow-2xl z-20 py-3 max-h-48 overflow-y-auto">
                                            {matchedPrescriptions.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => { setSelectedRx(p); setRxSearch(''); }}
                                                    className="px-6 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                                >
                                                    <div className="font-black text-xs text-slate-900 uppercase">{p.patientName}</div>
                                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">{p.id} • {p.date}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
                            {filteredInventory.map(item => (
                                <div
                                    key={item.id}
                                    className={`group bg-white p-5 rounded-[2rem] border border-slate-100 hover:border-teal-500 hover:shadow-2xl hover:shadow-teal-500/5 transition-all relative overflow-hidden flex flex-col items-center text-center ${item.totalStock <= 0 ? 'opacity-50 grayscale' : ''}`}
                                >
                                    <div className={`p-4 rounded-full mb-4 bg-slate-50 group-hover:bg-teal-50 transition-colors`}>
                                        {item.groupId.includes('G003') || item.groupId.includes('G004') ? <Glasses className="text-rose-600" /> : <Pill className="text-teal-600" />}
                                    </div>
                                    <h3 className="font-black text-slate-900 text-xs uppercase tracking-tight line-clamp-2 min-h-[32px]">{item.name}</h3>
                                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest mt-1">{item.id}</p>

                                    <div className="mt-4 w-full space-y-2">
                                        {item.batches.filter(b => b.stock > 0).slice(0, 1).map(batch => (
                                            <div key={batch.id} onClick={() => addToCart(item, batch)} className="pt-4 border-t border-slate-50 cursor-pointer">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase tracking-tighter">BN: {batch.batchNo}</span>
                                                    <span className="text-[10px] font-black text-rose-500">Exp: {batch.expiryDate}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-black text-sm text-slate-900">{formatCurrency(batch.salePrice)}</span>
                                                    <span className="text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest bg-emerald-50 text-emerald-600">{batch.stock} Units</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                        {selectedRx && (
                            <div className="bg-rose-900 text-white p-6 rounded-[2.5rem] shadow-xl animate-in slide-in-from-right-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                        <PenTool size={14} /> Synced Glass Prescription
                                    </h4>
                                    <button onClick={() => setSelectedRx(null)} className="p-1 hover:bg-white/10 rounded-lg"><X size={16} /></button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-rose-200 uppercase">Patient</span>
                                            <span className="text-xs font-black uppercase font-mono">{selectedRx.patientName}</span>
                                        </div>
                                        <div className="text-right flex flex-col">
                                            <span className="text-[10px] font-bold text-rose-200 uppercase">Consultant</span>
                                            <span className="text-xs font-black uppercase font-mono">{selectedRx.doctorName}</span>
                                        </div>
                                    </div>
                                    {selectedRx.glassPrescription && (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-white/10 p-3 rounded-2xl relative overflow-hidden">
                                                    <div className="text-[10px] font-bold text-rose-200 uppercase mb-2 flex justify-between">Right Eye (OD) <span className="text-white/50">VA: {selectedRx.glassPrescription.re.va}</span></div>
                                                    <div className="flex justify-between text-xs font-black">
                                                        <span>S: {selectedRx.glassPrescription.re.sph}</span>
                                                        <span>C: {selectedRx.glassPrescription.re.cyl}</span>
                                                        <span>A: {selectedRx.glassPrescription.re.axis}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-white/10 p-3 rounded-2xl relative overflow-hidden">
                                                    <div className="text-[10px] font-bold text-rose-200 uppercase mb-2 flex justify-between">Left Eye (OS) <span className="text-white/50">VA: {selectedRx.glassPrescription.le.va}</span></div>
                                                    <div className="flex justify-between text-xs font-black">
                                                        <span>S: {selectedRx.glassPrescription.le.sph}</span>
                                                        <span>C: {selectedRx.glassPrescription.le.cyl}</span>
                                                        <span>A: {selectedRx.glassPrescription.le.axis}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {selectedRx.glassPrescription.remarks && (
                                                <div className="text-xs font-bold text-rose-200 italic px-2">" {selectedRx.glassPrescription.remarks} "</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                                <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                    <ShoppingCart size={16} className="text-teal-400" /> Active CART
                                </h3>
                                <span className="text-xs font-black bg-white/10 px-3 py-1 rounded-full">{cart.length} ITEMS</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
                                        <Package size={48} />
                                        <p className="text-xs font-black uppercase tracking-widest">Cart is Null</p>
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.id} className="flex justify-between items-center group">
                                            <div className="flex-1">
                                                <div className="text-xs font-black text-slate-800 uppercase tracking-tight">{item.name}</div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">QTY: {item.qty} × {formatCurrency(item.price)}</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-xs font-black text-slate-900">{formatCurrency(item.price * item.qty)}</div>
                                                <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-4">
                                <div className="space-y-2 text-xs font-black uppercase tracking-widest text-slate-500">
                                    <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                                    <div className="flex justify-between"><span>Regulatory Tax (5%)</span><span>{formatCurrency(tax)}</span></div>
                                    <div className="flex justify-between text-slate-900 text-sm pt-4 border-t border-slate-200">
                                        <span>Total Payable</span>
                                        <span className="text-teal-700 font-black">{formatCurrency(totalPayable)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0}
                                    className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-[0.3em] hover:bg-teal-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                                >
                                    <CheckCircle size={16} /> Finalize Protocol
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Inventory & Stock Control */}
            {activeTab === 'inventory' && (
                <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden print:hidden">
                    <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/20">
                        <div>
                            <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-3">
                                <Archive className="text-blue-600" /> CENTRAL STOCK INVENTORY
                            </h3>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Real-time SKU resolution and replenishment metrics</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative w-72">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="Search Master SKU..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <button onClick={() => setShowAddItem(true)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">
                                <Plus size={16} /> Inject SKU
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#fbfcff] text-slate-400 font-black uppercase tracking-[0.2em] border-b border-slate-100">
                                <tr><th className="px-8 py-6">SKU Identifier</th><th className="px-8 py-6">Descriptor</th><th className="px-8 py-6">Domain</th><th className="px-8 py-6">Supply Source</th><th className="px-8 py-6 text-right">Unit Price</th><th className="px-8 py-6 text-right">Available Stock</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredInventory.map(item => (
                                    <React.Fragment key={item.id}>
                                        <tr className="bg-white border-b border-slate-50 group">
                                            <td className="px-8 py-6 font-mono font-black text-blue-600">{item.id}</td>
                                            <td className="px-8 py-6 font-black text-slate-900 uppercase tracking-tight">{item.name}</td>
                                            <td className="px-8 py-6">
                                                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-slate-100 text-slate-600">
                                                    {itemGroups.find(g => g.id === item.groupId)?.name || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-slate-500 font-bold">{itemCategories.find(c => c.id === item.categoryId)?.name || 'N/A'}</td>
                                            <td className="px-8 py-6 text-right font-black text-slate-900">{formatCurrency(item.batches[0]?.salePrice || 0)}</td>
                                            <td className="px-8 py-6 text-right">
                                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${item.totalStock < item.reorderLevel ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                    {item.totalStock} {itemUnits.find(u => u.id === item.baseUnitId)?.abbreviation}
                                                </div>
                                            </td>
                                        </tr>
                                        {item.batches.map(batch => (
                                            <tr key={batch.id} className="bg-slate-50/30 text-xs border-b border-slate-50">
                                                <td className="px-8 py-2"></td>
                                                <td className="px-8 py-2 font-black text-slate-400">BATCH: {batch.batchNo}</td>
                                                <td className="px-8 py-2 text-slate-400 uppercase tracking-widest">MFG: {batch.mfgDate}</td>
                                                <td className="px-8 py-2 text-rose-400 font-black uppercase tracking-widest">EXP: {batch.expiryDate}</td>
                                                <td className="px-8 py-2 text-right">MRP: {formatCurrency(batch.mrp)}</td>
                                                <td className="px-8 py-2 text-right font-black text-slate-500">{batch.stock} Units</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Supplier & Nodes */}
            {activeTab === 'suppliers' && (
                <div className="space-y-6 print:hidden">
                    <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div>
                            <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-3">
                                <Truck className="text-indigo-600" /> PROCUREMENT NODES
                            </h3>
                        </div>
                        <button onClick={() => setShowAddSupplier(true)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                            <Plus size={16} /> Link Supplier
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {suppliers.map(sup => (
                            <div key={sup.id} className="group bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity"><Truck size={80} /></div>
                                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight mb-2">{sup.name}</h3>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">{sup.id}</p>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-slate-50 rounded-xl text-indigo-600"><User size={14} /></div>
                                        <span className="text-xs font-bold text-slate-600">{sup.contactPerson}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-slate-50 rounded-xl text-indigo-600"><Mail size={14} /></div>
                                        <span className="text-xs font-bold text-slate-600">{sup.email}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-slate-50 rounded-xl text-indigo-600"><Phone size={14} /></div>
                                        <span className="text-xs font-bold text-slate-600">{sup.phone}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Master Configuration Hub */}
            {activeTab === 'master' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:hidden">
                    {/* Item Groups Master */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-fit">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <h4 className="text-xs font-black uppercase tracking-widest">Item Groups</h4>
                            <button
                                onClick={() => { setEditingMaster({ type: 'group', id: 'new' }); setMasterForm({ name: '' }); }}
                                className="p-1 hover:bg-white/10 rounded-lg"
                            ><Plus size={14} /></button>
                        </div>
                        <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                            {editingMaster?.type === 'group' && editingMaster.id === 'new' && (
                                <div className="p-4 bg-blue-50 rounded-2xl space-y-3">
                                    <input autoFocus placeholder="New Group Name" className="w-full p-3 bg-white border border-blue-200 rounded-xl text-xs font-bold uppercase outline-none" value={masterForm.name} onChange={e => setMasterForm({ ...masterForm, name: e.target.value })} />
                                    <div className="flex gap-2">
                                        <button onClick={() => { addItemGroup({ id: `G-${Date.now()}`, name: masterForm.name }); setEditingMaster(null); }} className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase">Save</button>
                                        <button onClick={() => setEditingMaster(null)} className="flex-1 py-2 bg-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase">Cancel</button>
                                    </div>
                                </div>
                            )}
                            {itemGroups.map(g => (
                                <div key={g.id} className="group flex justify-between items-center p-4 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-xl transition-all">
                                    {editingMaster?.id === g.id ? (
                                        <div className="flex-1 flex gap-2">
                                            <input autoFocus className="flex-1 p-1 bg-white border rounded text-xs font-bold uppercase" value={masterForm.name} onChange={e => setMasterForm({ ...masterForm, name: e.target.value })} />
                                            <button onClick={() => { updateItemGroup(g.id, { name: masterForm.name }); setEditingMaster(null); }}><Save size={14} className="text-teal-600" /></button>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{g.name}</span>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{g.id}</div>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setEditingMaster({ type: 'group', id: g.id }); setMasterForm({ name: g.name }); }}><PenTool size={12} className="text-blue-500" /></button>
                                                <button onClick={() => deleteItemGroup(g.id)}><Trash2 size={12} className="text-rose-500" /></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Categories Master */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-fit">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <h4 className="text-xs font-black uppercase tracking-widest">Categories</h4>
                            <button
                                onClick={() => { setEditingMaster({ type: 'category', id: 'new' }); setMasterForm({ name: '' }); }}
                                className="p-1 hover:bg-white/10 rounded-lg"
                            ><Plus size={14} /></button>
                        </div>
                        <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                            {editingMaster?.type === 'category' && editingMaster.id === 'new' && (
                                <div className="p-4 bg-blue-50 rounded-2xl space-y-3">
                                    <input autoFocus placeholder="New Category Name" className="w-full p-3 bg-white border border-blue-200 rounded-xl text-xs font-bold uppercase outline-none" value={masterForm.name} onChange={e => setMasterForm({ ...masterForm, name: e.target.value })} />
                                    <div className="flex gap-2">
                                        <button onClick={() => { addItemCategory({ id: `C-${Date.now()}`, name: masterForm.name }); setEditingMaster(null); }} className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase">Save</button>
                                        <button onClick={() => setEditingMaster(null)} className="flex-1 py-2 bg-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase">Cancel</button>
                                    </div>
                                </div>
                            )}
                            {itemCategories.map(c => (
                                <div key={c.id} className="group flex justify-between items-center p-4 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-xl transition-all">
                                    {editingMaster?.id === c.id ? (
                                        <div className="flex-1 flex gap-2">
                                            <input autoFocus className="flex-1 p-1 bg-white border rounded text-xs font-bold uppercase" value={masterForm.name} onChange={e => setMasterForm({ ...masterForm, name: e.target.value })} />
                                            <button onClick={() => { updateItemCategory(c.id, { name: masterForm.name }); setEditingMaster(null); }}><Save size={14} className="text-teal-600" /></button>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{c.name}</span>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.id}</div>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setEditingMaster({ type: 'category', id: c.id }); setMasterForm({ name: c.name }); }}><PenTool size={12} className="text-blue-500" /></button>
                                                <button onClick={() => deleteItemCategory(c.id)}><Trash2 size={12} className="text-rose-500" /></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Unit Master */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-fit">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <h4 className="text-xs font-black uppercase tracking-widest">Unit Master</h4>
                            <button
                                onClick={() => { setEditingMaster({ type: 'unit', id: 'new' }); setMasterForm({ name: '', abbreviation: '' }); }}
                                className="p-1 hover:bg-white/10 rounded-lg"
                            ><Plus size={14} /></button>
                        </div>
                        <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                            {editingMaster?.type === 'unit' && editingMaster.id === 'new' && (
                                <div className="p-4 bg-blue-50 rounded-2xl space-y-3">
                                    <input autoFocus placeholder="Full Name" className="w-full p-3 bg-white border border-blue-200 rounded-xl text-xs font-bold uppercase outline-none" value={masterForm.name} onChange={e => setMasterForm({ ...masterForm, name: e.target.value })} />
                                    <input placeholder="Abbr (Ex: Tab)" className="w-full p-3 bg-white border border-blue-200 rounded-xl text-xs font-black uppercase outline-none" value={masterForm.abbreviation} onChange={e => setMasterForm({ ...masterForm, abbreviation: e.target.value })} />
                                    <div className="flex gap-2">
                                        <button onClick={() => { addItemUnit({ id: `U-${Date.now()}`, name: masterForm.name, abbreviation: masterForm.abbreviation }); setEditingMaster(null); }} className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase">Save</button>
                                        <button onClick={() => setEditingMaster(null)} className="flex-1 py-2 bg-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase">Cancel</button>
                                    </div>
                                </div>
                            )}
                            {itemUnits.map(u => (
                                <div key={u.id} className="group flex justify-between items-center p-4 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-xl transition-all">
                                    {editingMaster?.id === u.id ? (
                                        <div className="flex-1 space-y-2">
                                            <input autoFocus placeholder="Full Name" className="w-full p-1 bg-white border rounded text-xs font-bold uppercase" value={masterForm.name} onChange={e => setMasterForm({ ...masterForm, name: e.target.value })} />
                                            <div className="flex gap-2">
                                                <input placeholder="Abbr" className="flex-1 p-1 bg-white border rounded text-xs font-black uppercase" value={masterForm.abbreviation} onChange={e => setMasterForm({ ...masterForm, abbreviation: e.target.value })} />
                                                <button onClick={() => { updateItemUnit(u.id, { name: masterForm.name, abbreviation: masterForm.abbreviation }); setEditingMaster(null); }}><Save size={14} className="text-teal-600" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <div className="text-xs font-black text-slate-800 uppercase tracking-tight">{u.name}</div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">({u.abbreviation}) • {u.id}</div>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setEditingMaster({ type: 'unit', id: u.id }); setMasterForm({ name: u.name, abbreviation: u.abbreviation }); }}><PenTool size={12} className="text-blue-500" /></button>
                                                <button onClick={() => deleteItemUnit(u.id)}><Trash2 size={12} className="text-rose-500" /></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shop Locations Master */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-fit lg:col-span-3">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <h4 className="text-xs font-black uppercase tracking-widest">Shop & Hub Locations</h4>
                            <button
                                onClick={() => { setEditingMaster({ type: 'unit' as any, id: 'new_shop' }); setMasterForm({ name: '', type: 'Pharmacy', location: '', contact: '' }); }}
                                className="p-1 hover:bg-white/10 rounded-lg"
                            ><Plus size={14} /></button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto">
                            {editingMaster?.id === 'new_shop' && (
                                <div className="p-5 bg-blue-50 rounded-[2rem] space-y-3 border-2 border-blue-200 animate-in zoom-in-95">
                                    <input placeholder="Shop Name" className="w-full p-3 bg-white border rounded-xl text-xs font-bold uppercase" value={masterForm.name} onChange={e => setMasterForm({ ...masterForm, name: e.target.value })} />
                                    <select className="w-full p-3 bg-white border rounded-xl text-xs font-black uppercase" value={masterForm.type} onChange={e => setMasterForm({ ...masterForm, type: e.target.value })}>
                                        <option value="Pharmacy">Pharmacy</option><option value="Vision">Vision</option>
                                    </select>
                                    <input placeholder="Location" className="w-full p-3 bg-white border rounded-xl text-xs font-bold" value={masterForm.location} onChange={e => setMasterForm({ ...masterForm, location: e.target.value })} />
                                    <div className="flex gap-2 text-[10px] font-black">
                                        <button onClick={() => { addShop({ id: `SH-${Date.now()}`, ...masterForm }); setEditingMaster(null); }} className="flex-1 py-3 bg-slate-900 text-white rounded-xl uppercase">Enroll</button>
                                        <button onClick={() => setEditingMaster(null)} className="flex-1 py-3 bg-slate-200 text-slate-500 rounded-xl uppercase">Cancel</button>
                                    </div>
                                </div>
                            )}
                            {shops.map(s => (
                                <div key={s.id} className="group relative bg-slate-50 p-5 rounded-[2rem] border border-transparent hover:border-blue-500 hover:bg-white hover:shadow-2xl transition-all">
                                    {editingMaster?.id === s.id ? (
                                        <div className="space-y-2">
                                            <input className="w-full p-2 bg-white border rounded text-xs font-bold uppercase" value={masterForm.name} onChange={e => setMasterForm({ ...masterForm, name: e.target.value })} />
                                            <div className="flex gap-2">
                                                <button onClick={() => { updateShop(s.id, masterForm); setEditingMaster(null); }} className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Update</button>
                                                <button onClick={() => setEditingMaster(null)} className="flex-1 py-2 bg-slate-200 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">X</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${s.type === 'Pharmacy' ? 'bg-teal-100 text-teal-700' : 'bg-rose-100 text-rose-700'}`}>{s.type}</span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setEditingMaster({ type: 'unit' as any, id: s.id }); setMasterForm(s); }} className="p-1 hover:bg-blue-50 rounded-md"><PenTool size={10} className="text-blue-500" /></button>
                                                    <button onClick={() => deleteShop(s.id)} className="p-1 hover:bg-rose-50 rounded-md"><Trash2 size={10} className="text-rose-500" /></button>
                                                </div>
                                            </div>
                                            <div className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{s.name}</div>
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 mb-3">{s.id}</div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                <Truck size={12} className="text-slate-300" /> {s.location}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Expiry Intelligence Report */}
            {activeTab === 'expiry' && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden print:hidden">
                    <div className="p-8 border-b border-slate-100 bg-rose-50/20">
                        <h3 className="font-black text-rose-900 text-sm uppercase tracking-widest flex items-center gap-3">
                            <AlertTriangle className="text-rose-600" /> EXPIRY RISK RECONNAISSANCE
                        </h3>
                        <p className="text-xs font-black text-rose-400 uppercase tracking-widest mt-1">Predictive analysis of stock nearing expiration (90 Day Threshold)</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#fffbfc] text-rose-400 font-black uppercase tracking-[0.2em] border-b border-rose-100">
                                <tr>
                                    <th className="px-8 py-6">Batch Identifier</th>
                                    <th className="px-8 py-6">Product Descriptor</th>
                                    <th className="px-8 py-6">Expiry Horizon</th>
                                    <th className="px-8 py-6">Location</th>
                                    <th className="px-8 py-6 text-right">Remaining Stock</th>
                                    <th className="px-8 py-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-rose-50">
                                {inventory.flatMap(item =>
                                    item.batches.filter(b => {
                                        const exp = new Date(b.expiryDate);
                                        const now = new Date();
                                        const diff = exp.getTime() - now.getTime();
                                        return diff < (90 * 24 * 60 * 60 * 1000);
                                    }).map(batch => (
                                        <tr key={batch.id} className="hover:bg-rose-50/30 transition-colors">
                                            <td className="px-8 py-6 font-mono font-black text-rose-600">{batch.batchNo}</td>
                                            <td className="px-8 py-6">
                                                <div className="font-black text-slate-900 uppercase tracking-tight">{item.name}</div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.id}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="font-black text-rose-600 uppercase tracking-widest">{batch.expiryDate}</div>
                                                <div className="text-[10px] font-black text-rose-300 uppercase italic">
                                                    {Math.ceil((new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} Days Remaining
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-slate-500 font-bold uppercase tracking-widest">
                                                {shops.find(s => s.id === item.shopId)?.name}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 font-black">{batch.stock} Units</span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-all">Clearance</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals - Standardized Premium Style */}
            {showAddItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                    <Archive size={16} className="text-blue-400" /> MASTER SKU ENROLLMENT
                                </h3>
                            </div>
                            <button onClick={() => setShowAddItem(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddItem} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2">Basic Info</h4>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">SKU Descriptor</label>
                                        <input required placeholder="Product Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500" value={newItem.name || ''} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Group</label>
                                            <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-blue-500" value={newItem.groupId} onChange={e => setNewItem({ ...newItem, groupId: e.target.value })}>
                                                <option value="">-- SELECT --</option>
                                                {itemGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                            <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-blue-500" value={newItem.categoryId} onChange={e => setNewItem({ ...newItem, categoryId: e.target.value })}>
                                                <option value="">-- SELECT --</option>
                                                {itemCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Base Unit</label>
                                            <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-blue-500" value={newItem.baseUnitId} onChange={e => setNewItem({ ...newItem, baseUnitId: e.target.value })}>
                                                <option value="">-- SELECT --</option>
                                                {itemUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Alert Level</label>
                                            <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-blue-500" value={newItem.reorderLevel} onChange={e => setNewItem({ ...newItem, reorderLevel: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest border-b border-rose-50 pb-2">Initial Batch</h4>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Batch Number</label>
                                        <input required placeholder="Ex: BN-990" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-rose-500" value={newBatch.batchNo} onChange={e => setNewBatch({ ...newBatch, batchNo: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Mfg Date</label>
                                            <CustomDatePicker
                                                value={newBatch.mfgDate}
                                                onChange={e => setNewBatch({ ...newBatch, mfgDate: e.target.value })}
                                                className="!p-3 !rounded-2xl !bg-slate-50 !border-slate-200 !text-xs !font-black"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-rose-600">Expiry Date</label>
                                            <CustomDatePicker
                                                required
                                                value={newBatch.expiryDate}
                                                onChange={e => setNewBatch({ ...newBatch, expiryDate: e.target.value })}
                                                className="!p-3 !rounded-2xl !bg-rose-50 !border-rose-200 !text-xs !font-black"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Buy Price</label>
                                            <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-rose-500" value={newBatch.purchasePrice} onChange={e => setNewBatch({ ...newBatch, purchasePrice: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Sale Price</label>
                                            <input type="number" className="w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500" value={newBatch.salePrice} onChange={e => setNewBatch({ ...newBatch, salePrice: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">MRP</label>
                                            <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-rose-500" value={newBatch.mrp} onChange={e => setNewBatch({ ...newBatch, mrp: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Opening Stock</label>
                                        <input type="number" required className="w-full p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-blue-500" value={newBatch.stock} onChange={e => setNewBatch({ ...newBatch, stock: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-blue-600 transition-all mt-4">Commit Protocol</button>
                        </form>
                    </div>
                </div>
            )}

            {showAddSupplier && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
                        <div className="p-6 bg-indigo-900 text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                    <Truck size={16} className="text-indigo-400" /> Supplier Node Linking
                                </h3>
                            </div>
                            <button onClick={() => setShowAddSupplier(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleAddSupplier(e); }} className="p-8 space-y-4">
                            <input required placeholder="Company Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500" value={newSupplier.name || ''} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                            <input placeholder="Primary Liaison" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500" value={newSupplier.contactPerson || ''} onChange={e => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })} />
                            <input type="email" placeholder="Communication Email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500" value={newSupplier.email || ''} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} />
                            <button type="submit" className="w-full py-5 bg-indigo-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-900 transition-all mt-4">Establish Link</button>
                        </form>
                    </div>
                </div>
            )}

            {showNewOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
                        <div className="p-6 bg-amber-900 text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                    <FileText size={16} className="text-amber-400" /> Logistics Deployment
                                </h3>
                            </div>
                            <button onClick={() => setShowNewOrder(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleCreatePO(e); }} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Acquisition Source</label>
                                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-amber-500 appearance-none" value={poData.supplierId} onChange={e => setPoData({ ...poData, supplierId: e.target.value })} required>
                                    <option value="">-- SELECT SOURCE NODE --</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">SKU Manifest</p>
                                <div className="flex gap-2">
                                    <input placeholder="SKU Descriptor" className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none" id="poItemName" />
                                    <input placeholder="Qty" className="w-20 p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" type="number" id="poItemQty" />
                                    <button type="button" onClick={() => {
                                        const name = (document.getElementById('poItemName') as HTMLInputElement).value;
                                        const qty = (document.getElementById('poItemQty') as HTMLInputElement).value;
                                        if (name && qty) setPoData({ ...poData, items: [...poData.items, { itemName: name, qty, price: '0' }] });
                                    }} className="bg-slate-900 text-white px-4 rounded-xl text-lg hover:bg-amber-600 transition-all shadow-xl">+</button>
                                </div>
                                <div className="mt-4 space-y-2 max-h-32 overflow-y-auto pr-2">
                                    {poData.items.map((i, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white p-3 border border-slate-100 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600">
                                            <span>{i.itemName}</span>
                                            <span className="bg-slate-50 px-3 py-1 rounded-full text-slate-900">N: {i.qty}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="w-full py-5 bg-amber-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-900 transition-all">Submit Order Protocol</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Print Receipt Section (Hidden on screen) */}
            <div id="pos-receipt" className="hidden print:block p-8 border border-black w-[80mm] font-mono text-xs leading-relaxed">
                <div className="text-center mb-6">
                    <h2 className="font-black text-sm uppercase">Visionary Care</h2>
                    <p>Specialist Eye Center</p>
                    <p>Ph: 555-0199</p>
                </div>
                <div className="border-b border-dashed border-black mb-4"></div>
                <div className="mb-4">
                    <p>ID: {Date.now().toString().slice(-6)}</p>
                    <p>DATE: {new Date().toLocaleDateString()}</p>
                </div>
                <div className="border-b border-dashed border-black mb-4"></div>
                {cart.map(item => (
                    <div key={item.id} className="flex justify-between mb-2">
                        <span className="uppercase">{item.name} x{item.qty}</span>
                        <span>{formatCurrency(item.price * item.qty)}</span>
                    </div>
                ))}
                <div className="border-t border-dashed border-black mt-4 pt-4 flex justify-between font-black text-xs">
                    <span>TOTAL</span>
                    <span>{formatCurrency(totalPayable)}</span>
                </div>
                <div className="text-center mt-8 uppercase tracking-widest font-black text-[10px]">
                    <p>Thank you for choosing</p>
                    <p>Visionary Excellence</p>
                </div>
            </div>
        </div>
    );
};

export default Pharmacy;
