"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import type {
  AdditionalChannel,
  CreateChannelRequest,
} from "@/types/additional-channels";

interface ChannelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateChannelRequest) => Promise<void>;
  channel?: AdditionalChannel | null;
  loading?: boolean;
}

export function ChannelFormDialog({
  open,
  onOpenChange,
  onSubmit,
  channel,
  loading = false,
}: ChannelFormDialogProps) {
  const form = useForm<CreateChannelRequest>({
    defaultValues: {
      chanbouq: "",
      chancomp: "",
      chanlcnfet: "",
      chanlcnfox: "",
      chanlcnfta1: "",
      chanlcnfta2: "",
      chanlcnfta3: "",
      channel_availability: "",
      channel_group: "",
      channel_id: "",
      channel_name: "",
      channel_name_location: "",
      channel_name_real: "",
      channel_number: "",
      channel_packages: "",
      channel_slug: "",
      channel_type: "",
      channel_url: "",
      chantype: "",
      chlogo_dark: "",
      chlogo_light: "",
      guidelink: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (channel) {
      form.reset({
        chanbouq: channel.chanbouq,
        chancomp: channel.chancomp,
        chanlcnfet: channel.chanlcnfet,
        chanlcnfox: channel.chanlcnfox,
        chanlcnfta1: channel.chanlcnfta1,
        chanlcnfta2: channel.chanlcnfta2,
        chanlcnfta3: channel.chanlcnfta3,
        channel_availability: channel.channel_availability,
        channel_group: channel.channel_group,
        channel_id: channel.channel_id,
        channel_name: channel.channel_name,
        channel_name_location: channel.channel_name_location,
        channel_name_real: channel.channel_name_real,
        channel_number: channel.channel_number,
        channel_packages: channel.channel_packages,
        channel_slug: channel.channel_slug,
        channel_type: channel.channel_type,
        channel_url: channel.channel_url,
        chantype: channel.chantype,
        chlogo_dark: channel.chlogo_dark,
        chlogo_light: channel.chlogo_light,
        guidelink: channel.guidelink,
      });
    } else {
      form.reset();
    }
  }, [channel, form]);

  const handleSubmit = async (data: CreateChannelRequest) => {
    try {
      // Ensure optional fields are empty strings if undefined
      const cleanedData: CreateChannelRequest = {
        ...data,
        channel_type: data.channel_type || "",
        chantype: data.chantype || "",
      };
      await onSubmit(cleanedData);
      onOpenChange(false);
      form.reset();
    } catch {
      // Error handling is done in the parent component
    }
  };

  const getButtonText = () => {
    if (loading) {
      return "Saving...";
    }
    if (channel) {
      return "Update";
    }
    return "Create";
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {channel ? "Edit Channel" : "Create New Channel"}
          </DialogTitle>
          <DialogDescription>
            {channel
              ? "Update the channel information below."
              : "Fill in the details to create a new channel."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="guidelink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guidelink *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                rules={{ required: "Guidelink is required" }}
              />
              <FormField
                control={form.control}
                name="channel_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel ID *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                rules={{ required: "Channel ID is required" }}
              />
              <FormField
                control={form.control}
                name="channel_slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Slug *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                rules={{ required: "Channel slug is required" }}
              />
              <FormField
                control={form.control}
                name="channel_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                rules={{ required: "Channel name is required" }}
              />
              <FormField
                control={form.control}
                name="channel_name_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Name (Location)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="channel_name_real"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Name (Real)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chantype"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Type</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Audio, SD 576i, HD 720p"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chancomp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Compression</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., MPEG-1, HE-AAC" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="channel_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel URL</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chanbouq"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bouquet Numbers</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Comma-separated" />
                    </FormControl>
                    <FormDescription>
                      Comma-separated bouquet numbers
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chanlcnfta1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LCN FTA 1</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chanlcnfta2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LCN FTA 2</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chanlcnfta3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LCN FTA 3</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chanlcnfox"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LCN Foxtel</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chanlcnfet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LCN Fetch</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="channel_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chlogo_light"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo (Light)</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chlogo_dark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo (Dark)</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="channel_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Group</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="channel_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Type Category</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Radio, Streaming, Apps, Television"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="channel_availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Availability</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., N/A" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="channel_packages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Packages</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., N/A" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                disabled={loading}
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={loading} type="submit">
                {getButtonText()}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
