"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStoredApiKey, storeApiKey } from "@/lib/additional-channels-api";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiKeySet: () => void;
}

export function ApiKeyDialog({
  open,
  onOpenChange,
  onApiKeySet,
}: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState(getStoredApiKey() || "");
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError("API key is required");
      return;
    }
    storeApiKey(apiKey.trim());
    setError(null);
    onApiKeySet();
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>API Key Configuration</DialogTitle>
          <DialogDescription>
            Enter your API key to access the additional channels API. The key
            will be stored locally in your browser.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              onChange={(e) => {
                setApiKey(e.target.value);
                setError(null);
              }}
              placeholder="Enter your API key"
              type="password"
              value={apiKey}
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} type="button">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
