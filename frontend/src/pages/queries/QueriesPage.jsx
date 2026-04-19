import BatchView from './BatchView';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getStudents,
  deleteStudent,
  getStudentStats,
} from '../../api/students';
import { exportQueries, downloadBlob } from '../../api/export';
import {
  Modal,
  Confirm,
  Spinner,
  Empty,
  StatCard,
  SearchInput,
  Tabs,
  Badge,
} from '../../components/common';
import {
  fmtDate,
  fmtCurrency,
  conversionColor,
  studentStatusColor,
} from '../../utils/helpers';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import StudentForm from './StudentForm';

const tabs = [
  { value: 'batch', label: 'Batch View', icon: '🎓' },
  { value: 'all', label: 'All', icon: '👥' },
  { value: 'lead', label: 'Leads', icon: '🔵' },
  { value: 'pending', label: 'Pending', icon: '⏳' },
  { value: 'converted', label: 'Confirmed', icon: '✅' },
  { value: 'lost', label: 'Lost', icon: '❌' },
];

export default function QueriesPage() {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { can } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === 'new') setShowForm(true);
  }, []);

  useEffect(() => {
    fetchData();
  }, [search, activeTab, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, search };
      if (activeTab !== 'all') params.status = activeTab;
      const [studRes, statRes] = await Promise.all([
        getStudents(params),
        getStudentStats(),
      ]);
      setStudents(studRes.data.data);
      setTotal(studRes.data.total);
      setStats(statRes.data.data);
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteStudent(id);
      toast.success('Deleted successfully');
      fetchData();
    } catch {}
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const now = new Date();
      const res = await exportQueries({
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        type: 'monthly',
      });
      downloadBlob(
        res.data,
        `Queries_${now.getMonth() + 1}_${now.getFullYear()}.xlsx`,
      );
      toast.success('Excel exported!');
    } catch {
      toast.error('Export failed');
    }
    setExportLoading(false);
  };

  const tabsWithCount = tabs.map((t) => ({
    ...t,
    count:
      t.value === 'all'
        ? stats.total
        : t.value === 'lead'
          ? stats.leads
          : t.value === 'pending'
            ? stats.pending
            : t.value === 'converted'
              ? stats.converted
              : stats.lost,
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Query Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Manage student queries, leads and conversions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {can('queries', 'export') && (
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="btn-secondary"
            >
              {exportLoading ? '⏳' : '📥'} Export
            </button>
          )}
          {can('queries', 'create') && (
            <button
              onClick={() => {
                setEditStudent(null);
                setShowForm(true);
              }}
              className="btn-primary"
            >
              ➕ New Query
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon="👥"
          label="Total"
          value={stats.total || 0}
          color="blue"
        />
        <StatCard
          icon="⏳"
          label="Pending"
          value={stats.pending || 0}
          color="yellow"
        />
        <StatCard
          icon="✅"
          label="Converted"
          value={stats.converted || 0}
          color="green"
        />
        <StatCard
          icon="⭐"
          label="Hot Leads"
          value={stats.veryGood || 0}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <Tabs
          tabs={tabsWithCount}
          active={activeTab}
          onChange={(v) => {
            setActiveTab(v);
            setPage(1);
          }}
        />
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by name, phone, email, city..."
        />
      </div>

      {/* Batch View */}
      {activeTab === 'batch' && <BatchView />}

      {/* Table */}
      {activeTab !== 'batch' && (
        <div className="card overflow-hidden">
          {loading ? (
            <Spinner />
          ) : students.length === 0 ? (
            <Empty
              icon="👥"
              title="No queries found"
              desc="Add your first query to get started"
              action={
                can('queries', 'create') && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="btn-primary"
                  >
                    ➕ Add Query
                  </button>
                )
              }
            />
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>City</th>
                      <th>Source</th>
                      <th>Knowledge</th>
                      <th>Conversion</th>
                      <th>Fee Told</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr
                        key={s._id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/queries/${s._id}`)}
                      >
                        <td>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {s.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {s.gender}
                          </div>
                        </td>
                        <td className="font-mono text-xs">{s.contact}</td>
                        <td>{s.city || '—'}</td>
                        <td>
                          <span className="text-xs">
                            {s.howReached?.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs badge badge-gray capitalize">
                            {s.traderKnowledge?.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${conversionColor[s.conversionExpectation] || 'badge-gray'} capitalize`}
                          >
                            {s.conversionExpectation?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="font-medium">
                          {s.feeTold ? fmtCurrency(s.feeTold) : '—'}
                        </td>
                        <td>
                          <span
                            className={`badge ${studentStatusColor[s.status]} capitalize`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="text-xs text-slate-400">
                          {fmtDate(s.createdAt)}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {can('queries', 'edit') && (
                              <button
                                onClick={() => {
                                  setEditStudent(s);
                                  setShowForm(true);
                                }}
                                className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-600 transition-colors text-sm"
                              >
                                ✏️
                              </button>
                            )}
                            {can('queries', 'delete') && (
                              <button
                                onClick={() => setDeleteId(s._id)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors text-sm"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {total > 20 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-sm text-slate-500">
                    Showing {Math.min((page - 1) * 20 + 1, total)}–
                    {Math.min(page * 20, total)} of {total}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="btn-secondary px-3 py-1.5 disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <button
                      disabled={page * 20 >= total}
                      onClick={() => setPage((p) => p + 1)}
                      className="btn-secondary px-3 py-1.5 disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditStudent(null);
        }}
        title={editStudent ? 'Edit Query' : 'New Query'}
        size="lg"
      >
        <StudentForm
          student={editStudent}
          onSuccess={() => {
            setShowForm(false);
            setEditStudent(null);
            fetchData();
          }}
        />
      </Modal>

      {/* Delete Confirm */}
      <Confirm
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId)}
        title="Delete Query"
        message="This will permanently delete this student record."
        danger
      />
    </div>
  );
}
