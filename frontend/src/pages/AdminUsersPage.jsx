import { useEffect, useState } from 'react';
import { Search, ShieldCheck, UsersRound } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { Select } from '../components/FormControls';
import { ErrorState, LoadingState } from '../components/Loading';
import { useDebounce } from '../hooks/useDebounce';
import { adminService } from '../services/profileService';
import { formatDate } from '../utils/format';
import { getErrorMessage } from '../utils/apiError';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ totalElements: 0, totalPages: 0, page: 0 });
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);
  const [role, setRole] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [search, role]);

  useEffect(() => {
    let active = true;
    async function loadUsers() {
      setLoading(true);
      setError('');
      try {
        const result = await adminService.users({ search, role, page, size: 20 });
        if (!active) return;
        setUsers(result.content);
        setMeta({
          totalElements: result.totalElements,
          totalPages: result.totalPages,
          page: result.page,
        });
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError, 'Unable to load registered users.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadUsers();
    return () => {
      active = false;
    };
  }, [search, role, page, refreshKey]);

  const hasFilters = Boolean(search || role);

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Registered Users"
        description="Browse every verified UniConnect account, including students and administrators."
      />

      <div className="admin-summary">
        <span className="admin-summary-icon"><ShieldCheck size={19} /></span>
        <div>
          <strong>{meta.totalElements} {meta.totalElements === 1 ? 'account' : 'accounts'} found</strong>
          <p>Only administrators can access this directory. Email addresses and university IDs are read-only.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-input">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by name, university ID, email or department…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search registered users"
          />
        </div>
        <Select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          aria-label="Filter by role"
          className="toolbar-select"
        >
          <option value="">All roles</option>
          <option value="STUDENT">Students</option>
          <option value="ADMIN">Administrators</option>
        </Select>
      </div>

      {loading ? (
        <LoadingState message="Loading registered users…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setRefreshKey((key) => key + 1)} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title={hasFilters ? 'No accounts match this filter' : 'No registered users yet'}
          description={
            hasFilters
              ? 'Try a different name, email, university ID, department or role.'
              : 'Student accounts will appear here after they register with a @klu.ac.in email.'
          }
          action={
            hasFilters ? (
              <button
                type="button"
                className="btn btn-secondary btn-md"
                onClick={() => {
                  setSearchInput('');
                  setRole('');
                }}
              >
                Clear filters
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">User</th>
                  <th scope="col">University ID</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Department</th>
                  <th scope="col">Year</th>
                  <th scope="col">Role</th>
                  <th scope="col">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((account) => (
                  <tr key={account.id}>
                    <td data-label="User">
                      <div className="table-user">
                        <Avatar name={account.fullName} size="sm" />
                        <strong>{account.fullName}</strong>
                      </div>
                    </td>
                    <td data-label="University ID"><span className="table-mono">{account.universityId}</span></td>
                    <td data-label="Contact"><a href={`mailto:${account.email}`}>{account.email}</a></td>
                    <td data-label="Department">{account.department}</td>
                    <td data-label="Year">{account.academicYear}</td>
                    <td data-label="Role">
                      <Badge variant={account.role === 'ADMIN' ? 'warning' : 'primary'}>
                        {account.role}
                      </Badge>
                    </td>
                    <td data-label="Joined">{formatDate(account.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            totalElements={meta.totalElements}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
