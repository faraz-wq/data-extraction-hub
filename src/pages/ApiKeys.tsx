import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api, ApiKey } from '@/lib/api';
import { Key, Plus, Copy, Check, Trash2, Calendar, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

// Mock data
const mockApiKeys: ApiKey[] = [
  { id: 'key_1', description: 'Production API', created_at: '2024-01-01T00:00:00Z', last_used_at: '2024-01-15T10:30:00Z', revoked: false, total_requests: 12847 },
  { id: 'key_2', description: 'Development API', created_at: '2024-01-10T00:00:00Z', last_used_at: '2024-01-14T16:45:00Z', revoked: false, total_requests: 234 },
  { id: 'key_3', description: 'Testing', created_at: '2023-12-15T00:00:00Z', last_used_at: null, revoked: true, total_requests: 0 },
];

export default function ApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [revokeKey, setRevokeKey] = useState<ApiKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const data = await api.getApiKeys();
        setApiKeys(data);
      } catch {
        setApiKeys(mockApiKeys);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKeys();
  }, []);

  const handleCreate = async () => {
    if (!newKeyDescription.trim()) return;
    setIsCreating(true);
    try {
      const response = await api.createApiKey(newKeyDescription);
      setCreatedKey(response.api_key);
      setApiKeys([...apiKeys, {
        id: `key_${Date.now()}`,
        description: newKeyDescription,
        created_at: new Date().toISOString(),
        last_used_at: null,
        revoked: false,
        total_requests: 0,
      }]);
    } catch (error) {
      // Mock response for demo
      const mockKey = `sk_live_${Math.random().toString(36).substring(2, 15)}`;
      setCreatedKey(mockKey);
      setApiKeys([...apiKeys, {
        id: `key_${Date.now()}`,
        description: newKeyDescription,
        created_at: new Date().toISOString(),
        last_used_at: null,
        revoked: false,
        total_requests: 0,
      }]);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeKey) return;
    try {
      await api.revokeApiKey(revokeKey.id);
    } catch {
      // Continue with UI update for demo
    }
    setApiKeys(apiKeys.map((k) =>
      k.id === revokeKey.id ? { ...k, revoked: true } : k
    ));
    toast({ title: 'API key revoked', description: 'The key can no longer be used.' });
    setRevokeKey(null);
  };

  const copyKey = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeCreateDialog = () => {
    setIsCreateOpen(false);
    setNewKeyDescription('');
    setCreatedKey(null);
    setCopied(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">API Keys</h1>
            <p className="text-muted-foreground mt-1">Manage your API keys for programmatic access</p>
          </div>
          <Button variant="glow" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Create API Key
          </Button>
        </div>

        {/* API Keys List */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg">Your API Keys</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y divide-border">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 shimmer rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 shimmer rounded" />
                      <div className="h-3 w-48 shimmer rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="p-8 text-center">
                <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No API keys yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {apiKeys.map((key, index) => (
                  <div
                    key={key.id}
                    className={cn(
                      'flex items-center gap-4 p-4 animate-fade-in',
                      key.revoked && 'opacity-50'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      key.revoked ? 'bg-muted' : 'bg-primary/10'
                    )}>
                      <Key className={cn(
                        'w-5 h-5',
                        key.revoked ? 'text-muted-foreground' : 'text-primary'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {key.description}
                        </p>
                        {key.revoked && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-destructive/20 text-destructive">
                            Revoked
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          Created {new Date(key.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Activity className="w-3 h-3" />
                          {key.total_requests.toLocaleString()} requests
                        </span>
                        {key.last_used_at && (
                          <span className="text-xs text-muted-foreground">
                            Last used {new Date(key.last_used_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {!key.revoked && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setRevokeKey(key)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create API Key Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={closeCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{createdKey ? 'API Key Created' : 'Create API Key'}</DialogTitle>
            <DialogDescription>
              {createdKey
                ? 'Save this API key now. You won\'t be able to see it again!'
                : 'Give your API key a descriptive name to help you remember its purpose.'}
            </DialogDescription>
          </DialogHeader>

          {createdKey ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-secondary rounded-lg text-sm font-mono break-all">
                  {createdKey}
                </code>
                <Button size="icon" variant="outline" onClick={copyKey}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button onClick={closeCreateDialog} className="w-full">
                I've saved my API key
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Input
                  placeholder="e.g., Production API, Development"
                  value={newKeyDescription}
                  onChange={(e) => setNewKeyDescription(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeCreateDialog}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!newKeyDescription.trim() || isCreating}>
                  {isCreating ? 'Creating...' : 'Create Key'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation */}
      <AlertDialog open={!!revokeKey} onOpenChange={() => setRevokeKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke "{revokeKey?.description}"? Any applications using this key will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-destructive hover:bg-destructive/90">
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
