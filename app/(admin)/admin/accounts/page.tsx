'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Badge,
  Modal,
  ModalFooter,
  Input,
  Textarea,
  Alert,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui';
import { apiClient } from '@/lib/api/client';
import { formatRelativeTime, formatTwitterHandle, formatNumber } from '@/lib/utils';
import type { Account, CreateAccountInput } from '@/types/database';
import { Plus, Edit, Trash2, Users, Search } from 'lucide-react';

interface UpdateAccountInput {
  twitter_handle?: string;
  display_name?: string;
  description?: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateAccountInput>({
    twitter_handle: '',
    display_name: '',
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load accounts
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async (search?: string) => {
    setLoading(true);
    setError('');

    const endpoint = search
      ? `/api/admin/accounts?search=${encodeURIComponent(search)}`
      : '/api/admin/accounts';

    const response = await apiClient.get<any>(endpoint);

    if (response.success && response.data) {
      setAccounts(response.data.data || []);
    } else {
      setError(response.error || 'Failed to load accounts');
    }

    setLoading(false);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAccounts(searchQuery);
  };

  // Create account
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    const response = await apiClient.post<Account>('/api/admin/accounts', formData);

    if (response.success) {
      setShowCreateModal(false);
      resetForm();
      loadAccounts();
    } else {
      setFormError(response.error || 'Failed to create account');
    }

    setSubmitting(false);
  };

  // Update account
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    setFormError('');
    setSubmitting(true);

    const updateData: UpdateAccountInput = {
      twitter_handle: formData.twitter_handle,
      display_name: formData.display_name,
      description: formData.description,
    };

    const response = await apiClient.put<Account>(
      `/api/admin/accounts/${selectedAccount.id}`,
      updateData
    );

    if (response.success) {
      setShowEditModal(false);
      resetForm();
      loadAccounts();
    } else {
      setFormError(response.error || 'Failed to update account');
    }

    setSubmitting(false);
  };

  // Delete account
  const handleDelete = async () => {
    if (!selectedAccount) return;

    setSubmitting(true);

    const response = await apiClient.delete(`/api/admin/accounts/${selectedAccount.id}`);

    if (response.success) {
      setShowDeleteModal(false);
      setSelectedAccount(null);
      loadAccounts();
    } else {
      setFormError(response.error || 'Failed to delete account');
    }

    setSubmitting(false);
  };

  // Open edit modal
  const openEditModal = (account: Account) => {
    setSelectedAccount(account);
    setFormData({
      twitter_handle: account.twitter_handle,
      display_name: account.display_name || '',
      description: account.description || '',
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (account: Account) => {
    setSelectedAccount(account);
    setShowDeleteModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      twitter_handle: '',
      display_name: '',
      description: '',
    });
    setFormError('');
    setSelectedAccount(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage Twitter accounts to monitor
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search by handle or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            fullWidth
          />
          <Button type="submit">Search</Button>
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearchQuery('');
                loadAccounts();
              }}
            >
              Clear
            </Button>
          )}
        </form>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" showIcon>
          {error}
        </Alert>
      )}

      {/* Accounts Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
              <p className="mt-2 text-sm text-gray-600">Loading accounts...</p>
            </div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {searchQuery ? 'No accounts found' : 'No accounts yet'}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Get started by adding your first Twitter account'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Account
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Handle</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Followers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">
                    <span className="text-primary-600">
                      {formatTwitterHandle(account.twitter_handle)}
                    </span>
                  </TableCell>
                  <TableCell>{account.display_name || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {account.description || '-'}
                  </TableCell>
                  <TableCell>
                    {account.followers_count
                      ? formatNumber(account.followers_count)
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={account.is_active ? 'success' : 'default'}
                      dot
                    >
                      {account.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatRelativeTime(account.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(account)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteModal(account)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Add Twitter Account"
        description="Add a new Twitter account to monitor"
      >
        <form onSubmit={handleCreate}>
          {formError && (
            <Alert variant="danger" showIcon className="mb-4">
              {formError}
            </Alert>
          )}

          <div className="space-y-4">
            <Input
              label="Twitter Handle"
              value={formData.twitter_handle}
              onChange={(e) =>
                setFormData({ ...formData, twitter_handle: e.target.value })
              }
              placeholder="elonmusk (without @)"
              required
              fullWidth
              helperText="Enter the Twitter handle without the @ symbol"
            />

            <Input
              label="Display Name"
              value={formData.display_name}
              onChange={(e) =>
                setFormData({ ...formData, display_name: e.target.value })
              }
              placeholder="Elon Musk"
              fullWidth
              helperText="Optional: Override the display name"
            />

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of this account..."
              fullWidth
              helperText="Optional: Add notes about this account"
            />
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Add Account
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit Account"
        description="Update account information"
      >
        <form onSubmit={handleUpdate}>
          {formError && (
            <Alert variant="danger" showIcon className="mb-4">
              {formError}
            </Alert>
          )}

          <div className="space-y-4">
            <Input
              label="Twitter Handle"
              value={formData.twitter_handle}
              onChange={(e) =>
                setFormData({ ...formData, twitter_handle: e.target.value })
              }
              required
              fullWidth
            />

            <Input
              label="Display Name"
              value={formData.display_name}
              onChange={(e) =>
                setFormData({ ...formData, display_name: e.target.value })
              }
              fullWidth
            />

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              fullWidth
            />
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Update Account
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAccount(null);
          setFormError('');
        }}
        title="Delete Account"
        description="Are you sure you want to delete this account?"
      >
        {formError && (
          <Alert variant="danger" showIcon className="mb-4">
            {formError}
          </Alert>
        )}

        <div className="space-y-4">
          <Alert variant="warning" showIcon>
            This action cannot be undone. All related data will be permanently
            deleted.
          </Alert>

          {selectedAccount && (
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Twitter handle:</p>
              <p className="mt-1 font-medium text-gray-900">
                {formatTwitterHandle(selectedAccount.twitter_handle)}
              </p>
              {selectedAccount.display_name && (
                <>
                  <p className="mt-2 text-sm text-gray-600">Display name:</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {selectedAccount.display_name}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedAccount(null);
              setFormError('');
            }}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={submitting}>
            Delete Account
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
