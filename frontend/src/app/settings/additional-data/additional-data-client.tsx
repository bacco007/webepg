"use client";

import {
  Edit,
  FileJson,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiKeyDialog } from "@/components/additional-channels/api-key-dialog";
import { AdditionalDataFormDialog } from "@/components/additional-data/additional-data-form-dialog";
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
import { Badge } from "@/components/ui/badge";
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
import { useAdditionalData } from "@/hooks/use-additional-data";
import { toast } from "@/hooks/use-toast";
import { getStoredApiKey } from "@/lib/additional-data-api";
import type {
  AdditionalDataChannel,
  AdditionalDataFile,
} from "@/types/additional-data";

// Regex to remove trailing underscores from source IDs
const TRAILING_UNDERSCORES_REGEX = /_+$/;

function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return dateString;
  }
}

export default function AdditionalDataClient() {
  const { files, loading, error, refetch, createSourceData, deleteSourceData } =
    useAdditionalData();

  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<AdditionalDataFile | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    setHasApiKey(Boolean(getStoredApiKey()));
  }, []);

  const handleDelete = async () => {
    if (!selectedFile) {
      return;
    }
    setIsSubmitting(true);
    try {
      await deleteSourceData(selectedFile.source_id);
      toast({
        description: "Additional data file deleted successfully",
        title: "Success",
      });
      setSelectedFile(null);
      setShowDeleteDialog(false);
    } catch (err) {
      toast({
        description:
          err instanceof Error
            ? err.message
            : "Failed to delete additional data file",
        title: "Error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (file: AdditionalDataFile) => {
    setSelectedFile(file);
    setShowDeleteDialog(true);
  };

  const handleCreate = async (
    sourceId: string,
    channels: AdditionalDataChannel[],
    isXmlepg: boolean
  ) => {
    setIsSubmitting(true);
    try {
      await createSourceData(sourceId, { channels }, isXmlepg);
      toast({
        description: "Additional data file created successfully",
        title: "Success",
      });
      setShowCreateDialog(false);
    } catch (err) {
      toast({
        description:
          err instanceof Error
            ? err.message
            : "Failed to create additional data file",
        title: "Error",
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasApiKey === null) {
    return null;
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
              You need to configure an API key to access the additional data
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
            setHasApiKey(true);
            refetch();
          }}
          onOpenChange={setShowApiKeyDialog}
          open={showApiKeyDialog}
        />
      </div>
    );
  }

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
        Create File
      </Button>
    </div>
  );

  return (
    <SidebarLayout
      actions={headerActions}
      contentClassName="p-0"
      sidebar={null}
      title="Additional Data Files"
    >
      <div className="flex-1 overflow-auto p-4">
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && files.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => {
              const key = `loading-skeleton-${i}`;
              return <Skeleton className="h-12 w-full" key={key} />;
            })}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Additional Data Files ({files.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No additional data files found. Additional data files allow
                  you to override channel data for specific sources.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source ID</TableHead>
                      <TableHead>Filename</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>File Size</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file) => (
                      <TableRow key={`${file.source_id}-${file.is_xmlepg}`}>
                        <TableCell className="font-mono text-xs">
                          {file.source_id}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileJson className="size-4 text-muted-foreground" />
                            {file.filename}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={file.is_xmlepg ? "default" : "secondary"}
                          >
                            {file.is_xmlepg ? "XMLEPG" : "Regular"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(file.file_size)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(file.last_modified)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              asChild
                              disabled={isSubmitting}
                              size="icon"
                              title={`Edit ${file.source_id} (${file.is_xmlepg ? "XMLEPG" : "Regular"})`}
                              variant="ghost"
                            >
                              <Link
                                href={`/settings/additional-data/${encodeURIComponent(file.source_id.trim().replace(TRAILING_UNDERSCORES_REGEX, ""))}`}
                              >
                                <Edit className="size-4" />
                              </Link>
                            </Button>
                            <Button
                              disabled={isSubmitting}
                              onClick={() => handleDeleteClick(file)}
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
          setHasApiKey(true);
          refetch();
        }}
        onOpenChange={setShowApiKeyDialog}
        open={showApiKeyDialog}
      />

      <AdditionalDataFormDialog
        channels={undefined}
        isXmlepg={undefined}
        loading={isSubmitting}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreate}
        open={showCreateDialog}
        sourceId={undefined}
      />

      <AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Additional Data File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the additional data file for{" "}
              <strong>{selectedFile?.source_id}</strong> (
              {selectedFile?.filename})? This action cannot be undone.
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
