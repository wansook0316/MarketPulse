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
import { formatDate, formatRelativeTime } from '@/lib/utils';
import type { Bucket, CreateBucketInput, UpdateBucketInput } from '@/types/database';
import { Plus, Edit, Trash2, FolderKanban } from 'lucide-react';

export default function BucketsPage() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateBucketInput>({
    name: '',
    type: 'regular',
    description: '',
    persona: '',
    collection_interval_minutes: 60,
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load buckets
  useEffect(() => {
    loadBuckets();
  }, []);

  const loadBuckets = async () => {
    setLoading(true);
    setError('');

    const response = await apiClient.get<any>('/api/admin/buckets');

    if (response.success && response.data) {
      setBuckets(response.data.data || []);
    } else {
      setError(response.error || 'Failed to load buckets');
    }

    setLoading(false);
  };

  // Create bucket
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    const response = await apiClient.post<Bucket>('/api/admin/buckets', formData);

    if (response.success) {
      setShowCreateModal(false);
      resetForm();
      loadBuckets();
    } else {
      setFormError(response.error || 'Failed to create bucket');
    }

    setSubmitting(false);
  };

  // Update bucket
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBucket) return;

    setFormError('');
    setSubmitting(true);

    const updateData: UpdateBucketInput = {
      name: formData.name,
      description: formData.description,
      persona: formData.persona,
      collection_interval_minutes: formData.collection_interval_minutes,
    };

    const response = await apiClient.put<Bucket>(
      `/api/admin/buckets/${selectedBucket.id}`,
      updateData
    );

    if (response.success) {
      setShowEditModal(false);
      resetForm();
      loadBuckets();
    } else {
      setFormError(response.error || 'Failed to update bucket');
    }

    setSubmitting(false);
  };

  // Delete bucket
  const handleDelete = async () => {
    if (!selectedBucket) return;

    setSubmitting(true);

    const response = await apiClient.delete(`/api/admin/buckets/${selectedBucket.id}`);

    if (response.success) {
      setShowDeleteModal(false);
      setSelectedBucket(null);
      loadBuckets();
    } else {
      setFormError(response.error || 'Failed to delete bucket');
    }

    setSubmitting(false);
  };

  // Open edit modal
  const openEditModal = (bucket: Bucket) => {
    setSelectedBucket(bucket);
    setFormData({
      name: bucket.name,
      type: bucket.type,
      description: bucket.description || '',
      persona: bucket.persona,
      collection_interval_minutes: bucket.collection_interval_minutes,
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (bucket: Bucket) => {
    setSelectedBucket(bucket);
    setShowDeleteModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'regular',
      description: '',
      persona: '',
      collection_interval_minutes: 60,
    });
    setFormError('');
    setSelectedBucket(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buckets</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your investment topic buckets
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Bucket
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" showIcon>
          {error}
        </Alert>
      )}

      {/* Buckets Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
              <p className="mt-2 text-sm text-gray-600">Loading buckets...</p>
            </div>
          </div>
        ) : buckets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No buckets yet
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Get started by creating your first bucket
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Bucket
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buckets.map((bucket) => (
                <TableRow key={bucket.id}>
                  <TableCell className="font-medium">{bucket.name}</TableCell>
                  <TableCell>
                    <Badge variant={bucket.type === 'macro' ? 'info' : 'default'}>
                      {bucket.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {bucket.description || '-'}
                  </TableCell>
                  <TableCell>{bucket.collection_interval_minutes}m</TableCell>
                  <TableCell>
                    <Badge
                      variant={bucket.is_active ? 'success' : 'default'}
                      dot
                    >
                      {bucket.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatRelativeTime(bucket.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(bucket)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteModal(bucket)}
                        disabled={bucket.type === 'macro'}
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
        title="Create New Bucket"
        description="Add a new bucket to organize investment topics"
      >
        <form onSubmit={handleCreate}>
          {formError && (
            <Alert variant="danger" showIcon className="mb-4">
              {formError}
            </Alert>
          )}

          <div className="space-y-4">
            <Input
              label="Bucket Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Tech Stocks"
              required
              fullWidth
            />

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of this bucket..."
              fullWidth
            />

            <Textarea
              label="Analysis Persona"
              value={formData.persona}
              onChange={(e) =>
                setFormData({ ...formData, persona: e.target.value })
              }
              placeholder="You are a tech sector analyst. Extract insights about..."
              required
              fullWidth
              helperText="Define how the AI should analyze tweets for this bucket"
            />

            <Input
              label="Collection Interval (minutes)"
              type="number"
              value={formData.collection_interval_minutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  collection_interval_minutes: parseInt(e.target.value, 10),
                })
              }
              min={1}
              required
              fullWidth
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
              Create Bucket
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
        title="Edit Bucket"
        description="Update bucket information"
      >
        <form onSubmit={handleUpdate}>
          {formError && (
            <Alert variant="danger" showIcon className="mb-4">
              {formError}
            </Alert>
          )}

          <div className="space-y-4">
            <Input
              label="Bucket Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              fullWidth
              disabled={selectedBucket?.type === 'macro'}
            />

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              fullWidth
            />

            <Textarea
              label="Analysis Persona"
              value={formData.persona}
              onChange={(e) =>
                setFormData({ ...formData, persona: e.target.value })
              }
              required
              fullWidth
            />

            <Input
              label="Collection Interval (minutes)"
              type="number"
              value={formData.collection_interval_minutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  collection_interval_minutes: parseInt(e.target.value, 10),
                })
              }
              min={1}
              required
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
              Update Bucket
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedBucket(null);
          setFormError('');
        }}
        title="Delete Bucket"
        description="Are you sure you want to delete this bucket?"
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

          {selectedBucket && (
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Bucket name:</p>
              <p className="mt-1 font-medium text-gray-900">
                {selectedBucket.name}
              </p>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedBucket(null);
              setFormError('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={submitting}
          >
            Delete Bucket
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
