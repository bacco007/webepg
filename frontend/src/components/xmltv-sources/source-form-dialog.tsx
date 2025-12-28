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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { CreateSourceRequest, XmltvSource } from "@/types/xmltv-sources";

interface SourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateSourceRequest) => Promise<void>;
  source?: XmltvSource | null;
  loading?: boolean;
  sourceType: "remote" | "local";
}

export function SourceFormDialog({
  open,
  onOpenChange,
  onSubmit,
  source,
  loading = false,
  sourceType,
}: SourceFormDialogProps) {
  const form = useForm<CreateSourceRequest>({
    defaultValues: {
      group: "",
      id: "",
      location: "",
      logo: {
        dark: "",
        light: "",
      },
      subgroup: "",
      url: sourceType === "local" ? "local" : "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (source) {
      form.reset({
        group: source.group,
        id: source.id,
        location: source.location,
        logo: source.logo || {
          dark: "",
          light: "",
        },
        subgroup: source.subgroup,
        url: source.url,
      });
    } else {
      form.reset({
        group: "",
        id: "",
        location: "",
        logo: {
          dark: "",
          light: "",
        },
        subgroup: "",
        url: sourceType === "local" ? "local" : "",
      });
    }
  }, [source, form, sourceType]);

  const handleSubmit = async (data: CreateSourceRequest) => {
    try {
      await onSubmit(data);
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
    if (source) {
      return "Update";
    }
    return "Create";
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {source ? "Edit Source" : "Create New Source"}
          </DialogTitle>
          <DialogDescription>
            {source
              ? "Update the source information below."
              : `Fill in the details to create a new ${sourceType} source.`}
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
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!!source} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                rules={{ required: "ID is required" }}
              />
              <FormField
                control={form.control}
                name="group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Australia, New Zealand"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                rules={{ required: "Group is required" }}
              />
              <FormField
                control={form.control}
                name="subgroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subgroup *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., FTA, Subscription, Streaming"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                rules={{ required: "Subgroup is required" }}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Freeview, Sydney" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                rules={{ required: "Location is required" }}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          sourceType === "local"
                            ? "local"
                            : "https://example.com/epg.xml"
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                rules={{ required: "URL is required" }}
              />
              <FormField
                control={form.control}
                name="logo.light"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo (Light)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="local/path/to/light-logo.png or https://example.com/logo.png"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logo.dark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo (Dark)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="local/path/to/dark-logo.png or https://example.com/logo.png"
                      />
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
