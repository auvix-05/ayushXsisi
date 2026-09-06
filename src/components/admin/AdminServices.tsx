import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  Check,
  X,
  Search,
  CheckCircle2,
  XCircle,
  FolderPlus,
  Loader2,
  Tag,
  DollarSign
} from 'lucide-react';
import { Category, Service } from '../../types';
import {
  getAdminServices,
  createAdminService,
  updateAdminService,
  deleteAdminService,
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory
} from '../../lib/api';

interface AdminServicesProps {
  token: string;
}

export const AdminServices: React.FC<AdminServicesProps> = ({ token }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'services' | 'categories'>('services');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');

  // Service Modal State
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState<{
    service_id?: number;
    category_id: string;
    name: string;
    description: string;
    price_per_1k: number;
    min_quantity: number;
    max_quantity: number;
    target_type: 'url' | 'username' | 'custom';
    target_placeholder: string;
    is_active: boolean;
  }>({
    category_id: '',
    name: '',
    description: '',
    price_per_1k: 100,
    min_quantity: 100,
    max_quantity: 50000,
    target_type: 'url',
    target_placeholder: 'https://...',
    is_active: true
  });

  // Category Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState<{ name: string; slug: string; sort_order: number; is_active: boolean }>({
    name: '',
    slug: '',
    sort_order: 1,
    is_active: true
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [srvRes, catRes] = await Promise.all([
        getAdminServices(token),
        getAdminCategories(token)
      ]);
      if (srvRes.success) setServices(srvRes.services);
      if (catRes.success) {
        setCategories(catRes.categories);
        if (catRes.categories.length > 0 && !serviceForm.category_id) {
          setServiceForm(prev => ({ ...prev, category_id: catRes.categories[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load services/categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Service Handlers
  const handleOpenNewService = () => {
    setEditingService(null);
    setServiceForm({
      service_id: undefined,
      category_id: categories[0]?.id || '',
      name: '',
      description: '',
      price_per_1k: 150,
      min_quantity: 100,
      max_quantity: 50000,
      target_type: 'url',
      target_placeholder: 'https://...',
      is_active: true
    });
    setServiceModalOpen(true);
  };

  const handleOpenEditService = (srv: Service) => {
    setEditingService(srv);
    setServiceForm({
      service_id: srv.service_id,
      category_id: srv.category_id,
      name: srv.name,
      description: srv.description,
      price_per_1k: srv.price_per_1k,
      min_quantity: srv.min_quantity,
      max_quantity: srv.max_quantity,
      target_type: srv.target_type,
      target_placeholder: srv.target_placeholder,
      is_active: srv.is_active
    });
    setServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name.trim() || !serviceForm.category_id) return;

    setSubmitting(true);
    try {
      if (editingService) {
        await updateAdminService(token, editingService.id, serviceForm);
      } else {
        await createAdminService(token, serviceForm);
      }
      setServiceModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert('Error saving service: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleServiceActive = async (srv: Service) => {
    try {
      await updateAdminService(token, srv.id, { is_active: !srv.is_active });
      setServices(prev => prev.map(s => s.id === srv.id ? { ...s, is_active: !s.is_active } : s));
    } catch (err) {
      console.error('Toggle active error:', err);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await deleteAdminService(token, id);
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Delete service error:', err);
    }
  };

  // Category Handlers
  const handleOpenNewCategory = () => {
    setEditingCat(null);
    setCatForm({
      name: '',
      slug: '',
      sort_order: categories.length + 1,
      is_active: true
    });
    setCatModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCat(cat);
    setCatForm({
      name: cat.name,
      slug: cat.slug,
      sort_order: cat.sort_order,
      is_active: cat.is_active
    });
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;

    setSubmitting(true);
    try {
      if (editingCat) {
        await updateAdminCategory(token, editingCat.id, catForm);
      } else {
        await createAdminCategory(token, catForm);
      }
      setCatModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert('Error saving category: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Associated services will also be removed.')) return;
    try {
      await deleteAdminCategory(token, id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Delete category error:', err);
    }
  };

  const filteredServices = services.filter(s => {
    const matchesCat = selectedCatFilter === 'all' || s.category_id === selectedCatFilter;
    const matchesQ = !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.service_id).includes(searchQuery.trim());
    return matchesCat && matchesQ;
  });

  return (
    <div className="space-y-6">
      {/* Sub-tabs header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('services')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'services'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'bg-neutral-950 text-neutral-400 hover:text-white'
            }`}
          >
            Manage Services ({services.length})
          </button>
          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'categories'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'bg-neutral-950 text-neutral-400 hover:text-white'
            }`}
          >
            Manage Categories ({categories.length})
          </button>
        </div>

        <div>
          {activeSubTab === 'services' ? (
            <button
              onClick={handleOpenNewService}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-900/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Service</span>
            </button>
          ) : (
            <button
              onClick={handleOpenNewCategory}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-900/20"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SERVICES TAB */}
      {/* ======================================================== */}
      {activeSubTab === 'services' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-900/80 border border-neutral-800 p-3.5 rounded-2xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search services by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-neutral-500">Category:</span>
              <select
                value={selectedCatFilter}
                onChange={(e) => setSelectedCatFilter(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Services Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="text-[11px] uppercase tracking-wider text-neutral-500 border-b border-neutral-800 bg-neutral-950">
                  <tr>
                    <th className="py-3 px-3">Service ID</th>
                    <th className="py-3 px-3">Name & Category</th>
                    <th className="py-3 px-3">Rate / 1K</th>
                    <th className="py-3 px-3">Min / Max</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80">
                  {filteredServices.map(srv => (
                    <tr key={srv.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-amber-400">#{srv.service_id}</td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white text-sm">{srv.name}</div>
                        <div className="text-[11px] text-neutral-400">{srv.category_name}</div>
                      </td>
                      <td className="py-3.5 px-3 font-extrabold text-emerald-400 text-sm">₹{srv.price_per_1k}</td>
                      <td className="py-3.5 px-3 font-mono text-neutral-300">
                        {srv.min_quantity.toLocaleString()} - {srv.max_quantity.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => handleToggleServiceActive(srv)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition-colors ${
                            srv.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                          }`}
                        >
                          {srv.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{srv.is_active ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditService(srv)}
                            className="p-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                            title="Edit Service"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(srv.id)}
                            className="p-1.5 rounded-lg bg-neutral-950 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-colors"
                            title="Delete Service"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CATEGORIES TAB */}
      {/* ======================================================== */}
      {activeSubTab === 'categories' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="text-[11px] uppercase tracking-wider text-neutral-500 border-b border-neutral-800 bg-neutral-950">
              <tr>
                <th className="py-3 px-4">Sort</th>
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-neutral-800/40">
                  <td className="py-3.5 px-4 font-mono text-neutral-400">{cat.sort_order}</td>
                  <td className="py-3.5 px-4 font-bold text-white text-sm">{cat.name}</td>
                  <td className="py-3.5 px-4 font-mono text-neutral-400">{cat.slug}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      cat.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800 text-neutral-500'
                    }`}>
                      {cat.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="p-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 rounded-lg bg-neutral-950 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD/EDIT SERVICE MODAL */}
      {/* ======================================================== */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white my-8">
            <button
              onClick={() => setServiceModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-5">
              {editingService ? `Edit Service #${editingService.service_id}` : 'Create New SMM Service'}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-400 mb-1">Category</label>
                <select
                  required
                  value={serviceForm.category_id}
                  onChange={(e) => setServiceForm({ ...serviceForm, category_id: e.target.value })}
                  className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-400 mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Instagram Real Followers"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-neutral-400 mb-1">Price / 1K (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.1"
                    value={serviceForm.price_per_1k}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_per_1k: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-400 mb-1">Min Qty</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={serviceForm.min_quantity}
                    onChange={(e) => setServiceForm({ ...serviceForm, min_quantity: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-400 mb-1">Max Qty</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={serviceForm.max_quantity}
                    onChange={(e) => setServiceForm({ ...serviceForm, max_quantity: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-400 mb-1">Target Placeholder</label>
                <input
                  type="text"
                  placeholder="e.g. @username or https://..."
                  value={serviceForm.target_placeholder}
                  onChange={(e) => setServiceForm({ ...serviceForm, target_placeholder: e.target.value })}
                  className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-400 mb-1">Service Description / Specifications</label>
                <textarea
                  rows={3}
                  placeholder="Details regarding quality, speed, refill guarantee, etc."
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="service-active-chk"
                  checked={serviceForm.is_active}
                  onChange={(e) => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                  className="rounded border-neutral-700 text-amber-500 focus:ring-0"
                />
                <label htmlFor="service-active-chk" className="font-semibold text-neutral-300">
                  Service is Active and visible on customer order page
                </label>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl"
                >
                  {submitting ? 'Saving...' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD/EDIT CATEGORY MODAL */}
      {/* ======================================================== */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-white">
            <button
              onClick={() => setCatModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">
              {editingCat ? 'Edit Category' : 'Create New Category'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-400 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TikTok Services"
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-400 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={catForm.sort_order}
                  onChange={(e) => setCatForm({ ...catForm, sort_order: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="cat-active-chk"
                  checked={catForm.is_active}
                  onChange={(e) => setCatForm({ ...catForm, is_active: e.target.checked })}
                  className="rounded border-neutral-700 text-amber-500 focus:ring-0"
                />
                <label htmlFor="cat-active-chk" className="font-semibold text-neutral-300">
                  Category is Active
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-800 text-neutral-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-amber-500 text-neutral-950 font-bold rounded-xl hover:bg-amber-400"
                >
                  {submitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
