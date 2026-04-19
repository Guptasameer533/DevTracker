import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useDisconnectRepo } from '../hooks/useRepos';
import { Trash2, AlertTriangle, User, Github, LogOut, ExternalLink, GitFork, Lock, Globe } from 'lucide-react';

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const disconnectMutation = useDisconnectRepo();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDisconnect() {
    try {
      await disconnectMutation.mutateAsync();
      await refreshUser();
      setConfirmDisconnect(false);
      navigate('/dashboard');
    } catch {
      // Error shown via mutation state
    }
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto">

        {/* Page header */}
        <div className="mb-7">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your account and connected repository</p>
        </div>

        <div className="space-y-4">

          {/* ── Account ── */}
          <section className="card p-5 space-y-4">
            <h2 className="section-label flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              Account
            </h2>

            <div className="flex items-center gap-4">
              <img
                src={user?.avatarUrl}
                alt={user?.username}
                className="w-12 h-12 rounded-full ring-2 ring-gray-200 dark:ring-surface-border shadow-sm"
              />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">@{user?.username}</p>
                {user?.email && (
                  <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                )}
              </div>
            </div>

            <a
              href="https://github.com/settings/applications"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-accent dark:hover:text-accent transition-colors group"
            >
              <Github className="w-4 h-4" />
              Manage GitHub OAuth access
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </section>

          {/* ── Connected repo ── */}
          <section className="card p-5 space-y-4">
            <h2 className="section-label flex items-center gap-2">
              <GitFork className="w-3.5 h-3.5" />
              Connected repository
            </h2>

            {user?.connectedRepo ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl border border-gray-200 dark:border-surface-border flex items-center justify-center flex-shrink-0">
                      {user.connectedRepo.private
                        ? <Lock className="w-4 h-4 text-gray-400" />
                        : <Globe className="w-4 h-4 text-gray-400" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {user.connectedRepo.fullName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {user.connectedRepo.private ? 'Private' : 'Public'} repository
                      </p>
                    </div>
                  </div>

                  {!confirmDisconnect ? (
                    <button
                      onClick={() => setConfirmDisconnect(true)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg transition-colors"
                      style={{ background: 'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={handleDisconnect}
                        disabled={disconnectMutation.isPending}
                        className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                      >
                        {disconnectMutation.isPending ? 'Disconnecting…' : 'Confirm'}
                      </button>
                      <button onClick={() => setConfirmDisconnect(false)} className="btn-secondary text-xs px-3 py-1.5">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {disconnectMutation.isError && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {disconnectMutation.error?.response?.data?.message || 'Failed to disconnect. Please try again.'}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No repository connected.{' '}
                <a href="/dashboard" className="text-accent hover:underline font-medium">
                  Connect one from the dashboard →
                </a>
              </p>
            )}
          </section>

          {/* ── Danger zone ── */}
          <section className="card p-5 space-y-4" style={{ borderColor: '#fca5a5' }}>
            <h2 className="flex items-center gap-2 text-[11px] font-semibold text-red-500 dark:text-red-400 uppercase tracking-widest">
              <AlertTriangle className="w-3.5 h-3.5" />
              Danger zone
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Deleting your account removes all your data from DevTrack permanently. This cannot be undone.
            </p>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg transition-colors"
                style={{ background: 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete account
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-red-500 dark:text-red-400">
                  Are you absolutely sure? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      alert('Account deletion is not yet implemented. Please contact support.');
                      setConfirmDelete(false);
                    }}
                    className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Yes, delete everything
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="btn-secondary text-xs px-3 py-1.5">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Sign out */}
          <button
            onClick={logout}
            className="w-full btn-secondary text-sm py-2.5"
            style={{ justifyContent: 'center' }}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>

        </div>
      </div>
    </Layout>
  );
}
