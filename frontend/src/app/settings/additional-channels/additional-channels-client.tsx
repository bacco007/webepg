"use client";

import { Edit, Plus, RefreshCw, Settings, Trash2 } from "lucide-react";
import { useState } from "react";
import { ApiKeyDialog } from "@/components/additional-channels/api-key-dialog";
import { ChannelFormDialog } from "@/components/additional-channels/channel-form-dialog";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdditionalChannels } from "@/hooks/use-additional-channels";
import { toast } from "@/hooks/use-toast";
import { getStoredApiKey } from "@/lib/additional-channels-api";
import type {
  AdditionalChannel,
  CreateChannelRequest,
} from "@/types/additional-channels";

export default function AdditionalChannelsClient() {
  const {
    channels,
    loading,
    error,
    refetch,
    createChannel,
    updateChannel,
    deleteChannel,
  } = useAdditionalChannels();

  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedChannel, setSelectedChannel] =
    useState<AdditionalChannel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasApiKey = Boolean(getStoredApiKey());

  const handleCreate = async (data: CreateChannelRequest) => {
    setIsSubmitting(true);
    try {
      await createChannel(data);
      toast({
        description: "Channel created successfully",
        title: "Success",
      });
    } catch (err) {
      toast({
        description:
          err instanceof Error ? err.message : "Failed to create channel",
        title: "Error",
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: CreateChannelRequest) => {
    if (!selectedChannel) {
      return;
    }
    setIsSubmitting(true);
    try {
      await updateChannel(selectedChannel.id, data);
      toast({
        description: "Channel updated successfully",
        title: "Success",
      });
      setSelectedChannel(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update channel";

      toast({
        description: errorMessage,
        title: "Error",
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedChannel) {
      return;
    }
    setIsSubmitting(true);
    try {
      await deleteChannel(selectedChannel.id);
      toast({
        description: "Channel deleted successfully",
        title: "Success",
      });
      setSelectedChannel(null);
      setShowDeleteDialog(false);
    } catch (err) {
      toast({
        description:
          err instanceof Error ? err.message : "Failed to delete channel",
        title: "Error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (channel: AdditionalChannel) => {
    setSelectedChannel(channel);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (channel: AdditionalChannel) => {
    setSelectedChannel(channel);
    setShowDeleteDialog(true);
  };

  if (!hasApiKey) {
    return (
      <div className="flex size-full flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>API Key Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              You need to configure an API key to access the additional channels
              API.
            </p>
            <Button
              className="w-full"
              onClick={() => setShowApiKeyDialog(true)}
            >
              <Settings className="mr-2 size-4" />
              Configure API Key
            </Button>
          </CardContent>
        </Card>
        <ApiKeyDialog
          onApiKeySet={() => {
            refetch();
          }}
          onOpenChange={setShowApiKeyDialog}
          open={showApiKeyDialog}
        />
      </div>
    );
  }

  // Create header actions
  const headerActions = (
    <div className="flex gap-2">
      <Button
        onClick={() => setShowApiKeyDialog(true)}
        size="icon"
        title="Configure API Key"
        variant="outline"
      >
        <Settings className="size-4" />
      </Button>
      <Button
        disabled={loading}
        onClick={() => refetch()}
        size="icon"
        title="Refresh"
        variant="outline"
      >
        <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
      </Button>
      <Button onClick={() => setShowCreateDialog(true)}>
        <Plus className="mr-2 size-4" />
        Create Channel
      </Button>
    </div>
  );

  return (
    <SidebarLayout
      actions={headerActions}
      contentClassName="p-0"
      sidebar={null}
      title="Additional Channels"
    >
      <div className="flex-1 overflow-auto p-4">
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && channels.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => {
              const key = `loading-skeleton-${i}`;
              return <Skeleton className="h-12 w-full" key={key} />;
            })}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Channels ({channels.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {channels.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No channels found. Create your first channel to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Channel Name</TableHead>
                      <TableHead>Channel Slug</TableHead>
                      <TableHead>Channel Type</TableHead>
                      <TableHead>Channel Group</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channels.map((channel) => (
                      <TableRow key={channel.id}>
                        <TableCell className="font-mono text-xs">
                          {channel.id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {channel.channel_name}
                        </TableCell>
                        <TableCell>{channel.channel_slug}</TableCell>
                        <TableCell>{channel.channel_type || "—"}</TableCell>
                        <TableCell>{channel.channel_group || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => handleEditClick(channel)}
                              size="icon"
                              title="Edit"
                              variant="ghost"
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteClick(channel)}
                              size="icon"
                              title="Delete"
                              variant="ghost"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <ApiKeyDialog
        onApiKeySet={() => {
          refetch();
        }}
        onOpenChange={setShowApiKeyDialog}
        open={showApiKeyDialog}
      />

      <ChannelFormDialog
        loading={isSubmitting}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreate}
        open={showCreateDialog}
      />

      <ChannelFormDialog
        channel={selectedChannel}
        loading={isSubmitting}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) {
            setSelectedChannel(null);
          }
        }}
        onSubmit={handleEdit}
        open={showEditDialog}
      />

      <AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedChannel?.channel_name}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
              onClick={handleDelete}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarLayout>
  );
}
