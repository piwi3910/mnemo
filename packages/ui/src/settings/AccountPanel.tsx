import * as React from "react";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";

export interface AccountPanelProps {
  email: string;
  displayName?: string;
  avatarUrl?: string;
  onChangeEmail?: (newEmail: string) => void;
  onChangePassword?: (currentPassword: string, newPassword: string) => void;
  onLogout?: () => void;
}

export function AccountPanel({
  email,
  displayName,
  avatarUrl,
  onChangeEmail,
  onChangePassword,
  onLogout,
}: AccountPanelProps) {
  const [newEmail, setNewEmail] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Account</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account details and security.
        </p>
      </div>

      {/* Current user info */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile</h3>
        <div className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName ?? email}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-lg font-semibold dark:bg-violet-900/40 dark:text-violet-300">
              {(displayName ?? email)[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            {displayName && (
              <p className="font-medium text-gray-900 dark:text-gray-50">{displayName}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{email}</p>
          </div>
        </div>
      </section>

      {/* Change email */}
      {onChangeEmail && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Change email</h3>
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="New email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              aria-label="New email address"
            />
            <Button
              size="sm"
              disabled={!newEmail.trim()}
              onClick={() => {
                onChangeEmail(newEmail.trim());
                setNewEmail("");
              }}
            >
              Update email
            </Button>
          </div>
        </section>
      )}

      {/* Change password */}
      {onChangePassword && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Change password</h3>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              aria-label="Current password"
            />
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              aria-label="New password"
            />
            <Button
              size="sm"
              disabled={!currentPassword || !newPassword}
              onClick={() => {
                onChangePassword(currentPassword, newPassword);
                setCurrentPassword("");
                setNewPassword("");
              }}
            >
              Update password
            </Button>
          </div>
        </section>
      )}

      {/* Logout */}
      {onLogout && (
        <section className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="destructive" size="sm" onClick={onLogout}>
            Log out
          </Button>
        </section>
      )}
    </div>
  );
}
