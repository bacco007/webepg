"use client";

import { ArrowLeft, Edit, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ChannelFormDialog } from "@/components/additional-channels/channel-form-dialog";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import type {
  AdditionalChannel,
  CreateChannelRequest,
} from "@/types/additional-channels";
import type { AdditionalDataChannel } from "@/types/additional-data";

interface FormData {
  sourceId: string;
  isXmlepg: boolean;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Cant
export default function AdditionalDataEditClient({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const router = useRouter();
  const { getSourceData, updateSourceData } = useAdditionalData();
  const [channels, setChannels] = useState<AdditionalDataChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChannelDialog, setShowChannelDialog] = useState(false);
  const [editingChannelIndex, setEditingChannelIndex] = useState<number | null>(
    null
  );

  const form = useForm<FormData>({
    defaultValues: {
      isXmlepg: false,
      sourceId: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params;
        const decodedSourceId = decodeURIComponent(resolvedParams.sourceId);

        const data = await getSourceData(decodedSourceId);
        form.reset({
          isXmlepg: data.is_xmlepg,
          sourceId: data.source_id,
        });
        setChannels(data.channels);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load additional data file";
        setError(errorMessage);
        toast({
          description: errorMessage,
          title: "Error",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params, form, getSourceData]);

  const handleAddChannel = () => {
    setEditingChannelIndex(null);
    setShowChannelDialog(true);
  };

  const handleEditChannel = (index: number) => {
    setEditingChannelIndex(index);
    setShowChannelDialog(true);
  };

  const handleDeleteChannel = (index: number) => {
    setChannels((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChannelSubmit = (data: CreateChannelRequest): Promise<void> => {
    const channelData: AdditionalDataChannel = {
      chanbouq: data.chanbouq,
      chancomp: data.chancomp || null,
      chanlcnfet: data.chanlcnfet ? Number.parseInt(data.chanlcnfet, 10) : null,
      chanlcnfox: data.chanlcnfox ? Number.parseInt(data.chanlcnfox, 10) : null,
      chanlcnfta1: data.chanlcnfta1
        ? Number.parseInt(data.chanlcnfta1, 10)
        : null,
      chanlcnfta2: data.chanlcnfta2
        ? Number.parseInt(data.chanlcnfta2, 10)
        : null,
      chanlcnfta3: data.chanlcnfta3
        ? Number.parseInt(data.chanlcnfta3, 10)
        : null,
      channel_availability: data.channel_availability,
      channel_group: data.channel_group,
      channel_id: data.channel_id,
      channel_name: data.channel_name,
      channel_name_location: data.channel_name_location,
      channel_name_real: data.channel_name_real,
      channel_number: data.channel_number,
      channel_packages: data.channel_packages,
      channel_slug: data.channel_slug,
      channel_type: data.channel_type,
      channel_url: data.channel_url || null,
      chantype: data.chantype,
      chlogo: data.chlogo_light || data.chlogo_dark || undefined,
      chlogo_dark: data.chlogo_dark,
      chlogo_light: data.chlogo_light,
      guidelink: data.guidelink,
    };

    if (editingChannelIndex !== null) {
      setChannels((prev) => {
        const updated = [...prev];
        updated[editingChannelIndex] = channelData;
        return updated;
      });
    } else {
      setChannels((prev) => [...prev, channelData]);
    }
    setShowChannelDialog(false);
    setEditingChannelIndex(null);
    return Promise.resolve();
  };

  const handleSubmit = async (data: FormData) => {
    if (channels.length === 0) {
      form.setError("sourceId", {
        message: "At least one channel is required",
        type: "manual",
      });
      toast({
        description: "At least one channel is required",
        title: "Validation Error",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await updateSourceData(data.sourceId, { channels }, data.isXmlepg);
      toast({
        description: "Additional data file updated successfully",
        title: "Success",
      });
      router.push("/settings/additional-data");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to update additional data file";
      setError(errorMessage);
      toast({
        description: errorMessage,
        title: "Error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentEditingChannel =
    editingChannelIndex !== null ? channels[editingChannelIndex] : null;

  const channelFormData: AdditionalChannel | null = currentEditingChannel
    ? {
        chanbouq: currentEditingChannel.chanbouq || "",
        chancomp: currentEditingChannel.chancomp?.toString() || "",
        chanlcnfet: currentEditingChannel.chanlcnfet?.toString() || "",
        chanlcnfox: currentEditingChannel.chanlcnfox?.toString() || "",
        chanlcnfta1: currentEditingChannel.chanlcnfta1?.toString() || "",
        chanlcnfta2: currentEditingChannel.chanlcnfta2?.toString() || "",
        chanlcnfta3: currentEditingChannel.chanlcnfta3?.toString() || "",
        channel_availability: currentEditingChannel.channel_availability || "",
        channel_group: currentEditingChannel.channel_group || "",
        channel_id: currentEditingChannel.channel_id,
        channel_name: currentEditingChannel.channel_name || "",
        channel_name_location:
          currentEditingChannel.channel_name_location || "",
        channel_name_real: currentEditingChannel.channel_name_real || "",
        channel_number: currentEditingChannel.channel_number || "",
        channel_packages: currentEditingChannel.channel_packages || "",
        channel_slug: currentEditingChannel.channel_slug || "",
        channel_type: currentEditingChannel.channel_type || "",
        channel_url: currentEditingChannel.channel_url || "",
        chantype: currentEditingChannel.chantype || "",
        chlogo_dark: currentEditingChannel.chlogo_dark || "",
        chlogo_light: currentEditingChannel.chlogo_light || "",
        guidelink: currentEditingChannel.guidelink || "",
        id: currentEditingChannel.channel_id,
      }
    : null;

  const headerActions = (
    <div className="flex gap-2">
      <Button asChild disabled={isSubmitting} variant="outline">
        <Link href="/settings/additional-data">
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Link>
      </Button>
      <Button
        disabled={isSubmitting || channels.length === 0}
        onClick={form.handleSubmit(handleSubmit)}
      >
        <Save className="mr-2 size-4" />
        {isSubmitting ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );

  if (loading) {
    return (
      <SidebarLayout
        actions={headerActions}
        contentClassName="p-0"
        sidebar={null}
        title="Edit Additional Data"
      >
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <>
      <SidebarLayout
        actions={headerActions}
        contentClassName="p-0"
        sidebar={null}
        title="Edit Additional Data"
      >
        <div className="flex-1 overflow-auto p-4">
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Source Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="sourceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source ID</FormLabel>
                          <FormControl>
                            <Input {...field} disabled />
                          </FormControl>
                          <FormDescription>
                            Source ID cannot be changed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isXmlepg"
                      render={({ field }) => (
                        <FormItem className="flex flex-col justify-end">
                          <div className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-0.5">
                              <FormLabel>XMLEPG Source</FormLabel>
                              <FormDescription>
                                Use XMLEPG naming pattern
                              </FormDescription>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Channels ({channels.length})</CardTitle>
                    <Button
                      onClick={handleAddChannel}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Plus className="mr-2 size-4" />
                      Add Channel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {channels.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground">
                      No channels added. Click "Add Channel" to get started.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Channel ID</TableHead>
                            <TableHead>Channel Name</TableHead>
                            <TableHead>Channel Slug</TableHead>
                            <TableHead>Channel Group</TableHead>
                            <TableHead>Channel Type</TableHead>
                            <TableHead>Channel Number</TableHead>
                            <TableHead>LCN FTA1</TableHead>
                            <TableHead>Guidelink</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {channels.map((channel, index) => (
                            <TableRow key={`${channel.channel_id}-${index}`}>
                              <TableCell className="font-mono text-xs">
                                {channel.channel_id}
                              </TableCell>
                              <TableCell className="font-medium">
                                {channel.channel_name || "—"}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {channel.channel_slug || "—"}
                              </TableCell>
                              <TableCell>
                                {channel.channel_group || "—"}
                              </TableCell>
                              <TableCell>
                                {channel.channel_type || "—"}
                              </TableCell>
                              <TableCell>
                                {channel.channel_number || "—"}
                              </TableCell>
                              <TableCell>
                                {channel.chanlcnfta1 !== null &&
                                channel.chanlcnfta1 !== undefined
                                  ? channel.chanlcnfta1
                                  : "—"}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {channel.guidelink || "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    onClick={() => handleEditChannel(index)}
                                    size="icon"
                                    title="Edit"
                                    type="button"
                                    variant="ghost"
                                  >
                                    <Edit className="size-4" />
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteChannel(index)}
                                    size="icon"
                                    title="Delete"
                                    type="button"
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
                    </div>
                  )}
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </SidebarLayout>

      <ChannelFormDialog
        channel={channelFormData}
        loading={false}
        onOpenChange={(open) => {
          setShowChannelDialog(open);
          if (!open) {
            setEditingChannelIndex(null);
          }
        }}
        onSubmit={handleChannelSubmit}
        open={showChannelDialog}
      />
    </>
  );
}
