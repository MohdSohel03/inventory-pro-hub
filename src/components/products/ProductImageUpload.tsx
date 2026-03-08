import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, X, Loader2, Link, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProductImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
}

export function ProductImageUpload({ imageUrl, onImageChange }: ProductImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, { upsert: true });

    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    onImageChange(urlData.publicUrl);
    setUploading(false);
  };

  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
      onImageChange(trimmed);
      setUrlInput("");
    } catch {
      toast({ title: "Invalid URL", description: "Please enter a valid image URL.", variant: "destructive" });
    }
  };

  const handleRemove = () => {
    onImageChange(null);
    setUrlInput("");
  };

  return (
    <div className="sm:col-span-2">
      <label className="text-sm font-medium leading-none mb-2 block">Product Image</label>
      {imageUrl ? (
        <div className="relative w-full h-40 rounded-lg border border-border overflow-hidden bg-muted">
          <img src={imageUrl} alt="Product" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-destructive/20 text-foreground hover:text-destructive transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex border border-border rounded-lg overflow-hidden w-fit">
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${mode === "upload" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
            >
              <Upload className="w-3.5 h-3.5" />Upload
            </button>
            <button
              type="button"
              onClick={() => setMode("url")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${mode === "url" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
            >
              <Link className="w-3.5 h-3.5" />Image URL
            </button>
          </div>

          {mode === "upload" ? (
            <div
              onClick={() => fileRef.current?.click()}
              className="w-full h-32 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              ) : (
                <>
                  <ImagePlus className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload image</span>
                </>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1"
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleUrlSubmit(); } }}
              />
              <Button type="button" size="sm" onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
                Add
              </Button>
            </div>
          )}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
}
