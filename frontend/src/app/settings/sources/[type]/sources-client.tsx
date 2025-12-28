"use client";

import { Edit, Plus, RefreshCw, Settings, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiKeyDialog } from "@/components/additional-channels/api-key-dialog";
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
import { SourceFormDialog } from "@/components/xmltv-sources/source-form-dialog";
import { toast } from "@/hooks/use-toast";
import { useXmltvSources } from "@/hooks/use-xmltv-sources";
import { getStoredApiKey } from "@/lib/additional-channels-api";
import type {
  CreateSourceRequest,
  SourceType,
  XmltvSource,
} from "@/types/xmltv-sources";

interface SourcesClientProps {
  sourceType: SourceType;
}

export default function SourcesClient({ sourceType }: SourcesClientProps) {
  const {
    sources,
    loading,
    error,
    refetch,
    createSource,
    updateSource,
    deleteSource,
  } = useXmltvSources(sourceType);

  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSource, setSelectedSource] = useState<XmltvSource | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  const sourceTypeLabel = sourceType === "remote" ? "Remote" : "Local";

  useEffect(() => {
    setHasApiKey(Boolean(getStoredApiKey()));
  }, []);

  const handleCreate = async (data: CreateSourceRequest) => {
    setIsSubmitting(true);
    try {
      await createSource(data);
      toast({
        description: "Source created successfully",
        title: "Success",
      });
    } catch (err) {
      toast({
        description:
          err instanceof Error ? err.message : "Failed to create source",
        title: "Error",
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: CreateSourceRequest) => {
    if (!selectedSource) {
      return;
    }
    setIsSubmitting(true);
    try {
      await updateSource(selectedSource.id, data);
      toast({
        description: "Source updated successfully",
        title: "Success",
      });
      setSelectedSource(null);
    } catch (err) {
      toast({
        description:
          err instanceof Error ? err.message : "Failed to update source",
        title: "Error",
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSource) {
      return;
    }
    setIsSubmitting(true);
    try {
      await deleteSource(selectedSource.id);
      toast({
        description: "Source deleted successfully",
        title: "Success",
      });
      setSelectedSource(null);
      setShowDeleteDialog(false);
    } catch (err) {
      toast({
        description:
          err instanceof Error ? err.message : "Failed to delete source",
        title: "Error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (source: XmltvSource) => {
    setSelectedSource(source);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (source: XmltvSource) => {
    setSelectedSource(source);
    setShowDeleteDialog(true);
  };

  if (hasApiKey === null) {
    return (
      <div className="flex size-full flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="flex size-full flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>API Key Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              You need to configure an API key to access the XMLTV sources API.
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

  return (
    <div className="flex size-full flex-col">
      <div className="flex flex-col items-start justify-between gap-4 border-b bg-background/95 p-4 backdrop-blur supports-backdrop-filter:bg-background/60 sm:flex-row sm:items-center sm:gap-0">
        <div>
          <h1 className="font-bold text-xl sm:text-2xl">
            {sourceTypeLabel} Sources
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage {sourceTypeLabel.toLowerCase()} XMLTV sources
          </p>
        </div>
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
            Create Source
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && sources.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => {
              const key = `loading-skeleton-${i}`;
              return <Skeleton className="h-12 w-full" key={key} />;
            })}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Sources ({sources.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {sources.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No sources found. Create your first source to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Subgroup</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sources.map((source) => (
                      <TableRow key={source.id}>
                        <TableCell className="font-mono text-xs">
                          {source.id}
                        </TableCell>
                        <TableCell>{source.group}</TableCell>
                        <TableCell>{source.subgroup}</TableCell>
                        <TableCell>{source.location}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {source.url}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => handleEditClick(source)}
                              size="icon"
                              title="Edit"
                              variant="ghost"
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteClick(source)}
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

      <SourceFormDialog
        loading={isSubmitting}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreate}
        open={showCreateDialog}
        sourceType={sourceType}
      />

      <SourceFormDialog
        loading={isSubmitting}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) {
            setSelectedSource(null);
          }
        }}
        onSubmit={handleEdit}
        open={showEditDialog}
        source={selectedSource}
        sourceType={sourceType}
      />

      <AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedSource?.id}</strong>? This action cannot be
              undone.
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
    </div>
  );
}
