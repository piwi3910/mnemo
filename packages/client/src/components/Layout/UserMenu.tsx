import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Shield, Bell, Key, Fingerprint } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../lib/api';
import { PasskeyManager } from '../Security/PasskeyManager';

interface UserMenuProps {
  onAdminClick: () => void;
  onAccessRequestsClick: () => void;
}

export function UserMenu({ onAdminClick, onAccessRequestsClick }: UserMenuProps) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPasskeyManager, setShowPasskeyManager] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update dropdown position when opening
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.right - 180,
      });
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleLogout = useCallback(async () => {
    setOpen(false);
    await logout();
  }, [logout]);

  const handleAdminClick = useCallback(() => {
    setOpen(false);
    onAdminClick();
  }, [onAdminClick]);

  const handlePasswordChange = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return; }
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters'); return; }
    setPwLoading(true);
    try {
      await authApi.changePassword(currentPw, newPw);
      setPwSuccess(true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => { setShowPasswordModal(false); setPwSuccess(false); }, 1500);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  }, [currentPw, newPw, confirmPw]);

  if (!user) return null;

  const initials = user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="btn-ghost p-1.5 flex items-center gap-2"
        aria-label="User menu"
        title={user.name || user.email}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-semibold">
            {initials}
          </div>
        )}
        <span className="text-sm text-gray-200 hidden sm:inline truncate max-w-[120px]">
          {user.name || user.email}
        </span>
      </button>
      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            zIndex: 99999,
          }}
          className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl py-1 min-w-[180px]"
        >
          <div className="px-3 py-2 border-b border-gray-600">
            <div className="text-sm text-gray-200 font-medium truncate">{user.name}</div>
            <div className="text-xs text-gray-400 truncate">{user.email}</div>
          </div>
          {user.role === 'admin' && (
            <button
              onClick={handleAdminClick}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-100 hover:bg-gray-700 transition-colors"
            >
              <Shield size={14} />
              Admin Panel
            </button>
          )}
          <button
            onClick={() => { onAccessRequestsClick(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-100 hover:bg-gray-700 transition-colors"
          >
            <Bell size={14} />
            Access Requests
          </button>
          <button
            onClick={() => { setShowPasskeyManager(true); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-100 hover:bg-gray-700 transition-colors"
          >
            <Fingerprint size={14} />
            Manage Passkeys
          </button>
          <button
            onClick={() => { setShowPasswordModal(true); setOpen(false); setPwError(''); setPwSuccess(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-100 hover:bg-gray-700 transition-colors"
          >
            <Key size={14} />
            Change Password
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-100 hover:bg-gray-700 transition-colors"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>,
        document.body
      )}
      <PasskeyManager open={showPasskeyManager} onClose={() => setShowPasskeyManager(false)} />
      {showPasswordModal && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-surface-900 rounded-xl shadow-2xl w-full max-w-sm p-6 border border-gray-700/50" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Current Password</label>
                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required
                  className="w-full bg-surface-800 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">New Password</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8}
                  className="w-full bg-surface-800 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Confirm New Password</label>
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required
                  className="w-full bg-surface-800 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
              </div>
              {pwError && <div className="text-red-400 text-xs">{pwError}</div>}
              {pwSuccess && <div className="text-green-400 text-xs">Password changed successfully!</div>}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={pwLoading}
                  className="flex-1 bg-violet-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-violet-600 transition-colors disabled:opacity-50">
                  {pwLoading ? 'Changing...' : 'Change Password'}
                </button>
                <button type="button" onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
