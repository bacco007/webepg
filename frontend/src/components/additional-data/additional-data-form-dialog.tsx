"use client";

import { Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ChannelFormDialog } from "@/components/additional-channels/channel-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AdditionalChannel,
  CreateChannelRequest,
} from "@/types/additional-channels";
import type { AdditionalDataChannel } from "@/types/additional-data";

interface AdditionalDataFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    sourceId: string,
    channels: AdditionalDataChannel[],
    isXmlepg: boolean
  ) => Promise<void>;
  sourceId?: string;
  isXmlepg?: boolean;
  channels?: AdditionalDataChannel[];
  loading?: boolean;
}

interface FormData {
  sourceId: string;
  isXmlepg: boolean;
}

/**
 * Parses a string to a number, returning null if empty or invalid
 */
function parseOptionalNumber(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  return Number.parseInt(value, 10);
}

/**
 * Converts CreateChannelRequest to AdditionalDataChannel
 */
function convertToAdditionalDataChannel(
  data: CreateChannelRequest
): AdditionalDataChannel {
  return {
    chanbouq: data.chanbouq,
    chancomp: data.chancomp || null,
    chanlcnfet: parseOptionalNumber(data.chanlcnfet),
    chanlcnfox: parseOptionalNumber(data.chanlcnfox),
    chanlcnfta1: parseOptionalNumber(data.chanlcnfta1),
    chanlcnfta2: parseOptionalNumber(data.chanlcnfta2),
    chanlcnfta3: parseOptionalNumber(data.chanlcnfta3),
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
}

/**
 * Converts AdditionalDataChannel to AdditionalChannel format for ChannelFormDialog
 */

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Cant
function convertToAdditionalChannel(
  channel: AdditionalDataChannel
): AdditionalChannel {
  return {
    chanbouq: channel.chanbouq || "",
    chancomp: channel.chancomp?.toString() || "",
    chanlcnfet: channel.chanlcnfet?.toString() || "",
    chanlcnfox: channel.chanlcnfox?.toString() || "",
    chanlcnfta1: channel.chanlcnfta1?.toString() || "",
    chanlcnfta2: channel.chanlcnfta2?.toString() || "",
    chanlcnfta3: channel.chanlcnfta3?.toString() || "",
    channel_availability: channel.channel_availability || "",
    channel_group: channel.channel_group || "",
    channel_id: channel.channel_id,
    channel_name: channel.channel_name || "",
    channel_name_location: channel.channel_name_location || "",
    channel_name_real: channel.channel_name_real || "",
    channel_number: channel.channel_number || "",
    channel_packages: channel.channel_packages || "",
    channel_slug: channel.channel_slug || "",
    channel_type: channel.channel_type || "",
    channel_url: channel.channel_url || "",
    chantype: channel.chantype || "",
    chlogo_dark: channel.chlogo_dark || "",
    chlogo_light: channel.chlogo_light || "",
    guidelink: channel.guidelink || "",
    id: channel.channel_id,
  };
}

export function AdditionalDataFormDialog({
  open,
  onOpenChange,
  onSubmit,
  sourceId: initialSourceId,
  isXmlepg: initialIsXmlepg,
  channels: initialChannels,
  loading = false,
}: AdditionalDataFormDialogProps) {
  const [channels, setChannels] = useState<AdditionalDataChannel[]>([]);
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
    if (!open) {
      return;
    }
    const isXmlepgValue =
      initialSourceId !== undefined ? (initialIsXmlepg ?? false) : false;
    form.reset({
      isXmlepg: isXmlepgValue,
      sourceId: initialSourceId ?? "",
    });
    setChannels(initialChannels ?? []);
    setEditingChannelIndex(null);
  }, [open, initialSourceId, initialIsXmlepg, initialChannels, form]);

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
    const channelData = convertToAdditionalDataChannel(data);
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
      return;
    }
    try {
      await onSubmit(data.sourceId, channels, data.isXmlepg);
      onOpenChange(false);
      form.reset();
      setChannels([]);
    } catch {
      // Error handling is done in the parent component
    }
  };

  let buttonText = "Create";
  if (loading) {
    buttonText = "Saving...";
  } else if (initialSourceId) {
    buttonText = "Update";
  }

  const channelFormData: AdditionalChannel | null =
    editingChannelIndex !== null && channels[editingChannelIndex]
      ? convertToAdditionalChannel(channels[editingChannelIndex])
      : null;

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {initialSourceId
                ? "Edit Additional Data File"
                : "Create Additional Data File"}
            </DialogTitle>
            <DialogDescription>
              {initialSourceId
                ? "Update the additional data file for this source."
                : "Create a new additional data file to override channel data."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="sourceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source ID *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!!initialSourceId}
                              placeholder="e.g., FTACEN, freeviewuk"
                            />
                          </FormControl>
                          <FormDescription>
                            {initialSourceId
                              ? "Source ID cannot be changed"
                              : "Unique identifier for the source"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                      rules={{ required: "Source ID is required" }}
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

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Channels ({channels.length})</Label>
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
                    {channels.length === 0 ? (
                      <div className="rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground">
                        No channels added. Click "Add Channel" to get started.
                      </div>
                    ) : (
                      <div className="rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Channel ID</TableHead>
                              <TableHead>Channel Name</TableHead>
                              <TableHead>Channel Slug</TableHead>
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
                                <TableCell>
                                  {channel.channel_slug || "—"}
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
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter className="mt-4">
                <Button
                  disabled={loading}
                  onClick={() => onOpenChange(false)}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  disabled={loading || channels.length === 0}
                  type="submit"
                >
                  {buttonText}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ChannelFormDialog
        channel={channelFormData}
        loading={false}
        onOpenChange={(isOpen) => {
          setShowChannelDialog(isOpen);
          if (!isOpen) {
            setEditingChannelIndex(null);
          }
        }}
        onSubmit={handleChannelSubmit}
        open={showChannelDialog}
      />
    </>
  );
}
