import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { api } from '@/api';

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const { addToast } = useUIStore();
  const [form, setForm] = useState({
    username: '',
    display_name: '',
    password: '',
    confirmPassword: '',
    department: '',
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api.users.getDepartments().then(setDepartments).catch(() => {});
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.username.trim() || form.username.length < 3) {
      errs.username = 'Username must be at least 3 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      errs.username = 'Username can only contain letters, numbers, and underscores';
    }
    if (!form.display_name.trim()) {
      errs.display_name = 'Display name is required';
    }
    if (!form.password || form.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register({
        username: form.username.trim(),
        password: form.password,
        display_name: form.display_name.trim(),
        department: form.department || undefined,
      });
      navigate('/');
    } catch (err: any) {
      addToast({ type: 'error', title: err.message || 'Registration failed' });
    }
  };

  const setField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Create Account</h1>
          <p className="text-dark-textMuted text-sm mt-1">Join your team on TeamChat</p>
        </div>

        {/* Form */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-dark-textSecondary mb-1.5">
                Username
              </label>
              <input
                type="text"
                className={`input ${errors.username ? 'input-error' : ''}`}
                placeholder="e.g. john_doe"
                value={form.username}
                onChange={(e) => setField('username', e.target.value)}
                autoComplete="username"
                autoFocus
              />
              {errors.username && <p className="text-xs text-danger mt-1">{errors.username}</p>}
              <p className="text-[10px] text-dark-textMuted mt-1">Letters, numbers, and underscores only</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-dark-textSecondary mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                className={`input ${errors.display_name ? 'input-error' : ''}`}
                placeholder="e.g. John Doe"
                value={form.display_name}
                onChange={(e) => setField('display_name', e.target.value)}
              />
              {errors.display_name && <p className="text-xs text-danger mt-1">{errors.display_name}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-dark-textSecondary mb-1.5">
                Department
              </label>
              <select
                className="input"
                value={form.department}
                onChange={(e) => setField('department', e.target.value)}
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Data">Data</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-dark-textSecondary mb-1.5">
                Password
              </label>
              <input
                type="password"
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                autoComplete="new-password"
              />
              {errors.password && <p className="text-xs text-danger mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-dark-textSecondary mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={(e) => setField('confirmPassword', e.target.value)}
                autoComplete="new-password"
              />
              {errors.confirmPassword && <p className="text-xs text-danger mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-2.5 text-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-dark-textMuted">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
