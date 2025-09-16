"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Eye,
  Globe,
  Maximize2,
  Minimize2,
  Palette,
  X,
} from "lucide-react";
import Image from "next/image";

type Feature = {
  feature_name: string;
};

type RawTemplate = {
  id: number;
  title: string;
  category: string;
  thumbnail: string | null;
  description: string | null;
  url: string | null;
  features?: Feature[];
};

type Template = {
  id: number;
  title: string;
  category: string;
  thumbnail: string | null;
  description: string | null;
  url: string | null;
  features: string[];
};

type Event = {
  id: string;
  name: string;
  description: string;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  capacity?: number | null;
  status?: boolean | null;
  image_venue?: string | null;
  hero_image?: string | null;
  template_id?: number | null;
};

export default function EventDetailPage() {
  const didFetch = useRef(false);
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<number | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  // preview modal state
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [isChanged, setIsChanged] = useState(false);
  const venueInputRef = useRef<HTMLInputElement | null>(null);
  const heroInputRef = useRef<HTMLInputElement | null>(null);

  // fetch data event & template
  useEffect(() => {
    if (!didFetch.current && id) {
      fetchEvent(id as string);
      fetchTemplates();
      didFetch.current = true;
    }
  }, [id]);

  useEffect(() => {
    if (!editEvent || !event) return;

    const hasChanged =
      editEvent.name !== event.name ||
      editEvent.description !== event.description ||
      editEvent.location !== event.location ||
      editEvent.start_date?.split("T")[0] !== event.start_date?.split("T")[0] ||
      editEvent.end_date?.split("T")[0] !== event.end_date?.split("T")[0] ||
      editEvent.capacity !== event.capacity ||
      editEvent.status !== event.status ||
      !!file ||
      !!heroFile;

    setIsChanged(hasChanged);
  }, [editEvent, event, file, heroFile]);

  const fetchEvent = async (eventId: string) => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error) {
      console.error("Failed to fetch event:", error.message);
      return;
    }
    setEvent(data);
    setEditEvent(data);

    if (data.template_id) {
      setActiveTemplate(data.template_id);
    }
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("templates")
      .select(
        `
        id,
        title,
        category,
        thumbnail,
        description,
        url,
        features:features(
          feature_name
        )
      `
      )
      .order("id", { ascending: true });

    if (error) {
      console.error("Failed to fetch templates:", error.message);
      return;
    }

    const mapped: Template[] = (data as RawTemplate[]).map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      thumbnail: t.thumbnail,
      description: t.description,
      url: t.url,
      features: t.features ? t.features.map((f) => f.feature_name) : [],
    }));

    setTemplates(mapped);
  };

  const handleSelectTemplate = (templateId: number) => {
    setSelectedTemplate(templateId);
  };

  const handleApplyTemplate = async () => {
    console.log("event : ", event);
    if (!selectedTemplate || !event) return;
    console.log("event 2");

    setIsApplying(true);

    try {
      if (event.image_venue) {
        const res = await fetch("/api/delete-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filePath: event.image_venue,
            scope: "event",
            templateId: activeTemplate,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to delete image_venue file");
        }
      }

      if (event.hero_image) {
        const res = await fetch("/api/delete-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filePath: event.hero_image,
            scope: "event",
            templateId: activeTemplate,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to delete hero_image file");
        }
      }

      const { error } = await supabase
        .from("events")
        .update({
          template_id: selectedTemplate,
          image_venue: null,
          hero_image: null,
        })
        .eq("id", event.id);

      if (error) throw new Error(error.message);

      setActiveTemplate(selectedTemplate);
      setEvent({
        ...event,
        template_id: selectedTemplate,
        image_venue: null,
        hero_image: null,
      });

      alert("Template applied successfully!");
      fetchEvent(id as string);
      setFile(null);
      setHeroFile(null);
      if (venueInputRef.current) venueInputRef.current.value = "";
      if (heroInputRef.current) heroInputRef.current.value = "";
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Failed to apply template:", err);
        alert(`Failed: ${err.message}`);
      } else {
        console.error("Unknown error:", err);
        alert("Failed: An unknown error occurred");
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handlePreviewTemplate = (templateId: number) => {
    setPreviewTemplate(templateId);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewTemplate(null);
    setIsFullscreen(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const handleFileUpload = async (
    newFile: File | null,
    prevUrl: string | null | undefined,
    field: "image_venue" | "hero_image"
  ): Promise<string | null> => {
    let finalUrl = prevUrl || null;

    if (newFile) {
      if (prevUrl?.startsWith("/uploads/event/")) {
        const delRes = await fetch("/api/delete-file", {
          method: "POST",
          body: JSON.stringify({
            filePath: prevUrl,
            scope: "event",
            templateId: editEvent?.template_id,
          }),
          headers: { "Content-Type": "application/json" },
        });

        if (!delRes.ok) {
          return null;
        }
      }

      const formData = new FormData();
      formData.append("file", newFile);
      formData.append("folder", "event");
      formData.append("scope", "event");
      formData.append("template_id", String(activeTemplate));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errRes = await res.json();
        alert(errRes.error || `Upload ${field} failed`);
        setIsChanged(true);
        return prevUrl || null;
      }

      const { url } = await res.json();
      finalUrl = url;
    }

    return finalUrl;
  };

  const handleSaveEvent = async () => {
    if (!editEvent) return;
    setIsChanged(false);

    // ✅ Validasi field kosong
    if (
      !editEvent.name.trim() ||
      !editEvent.description?.trim() ||
      !editEvent.location?.trim() ||
      !editEvent.start_date ||
      !editEvent.end_date ||
      !editEvent.capacity
    ) {
      alert("Semua field wajib diisi!");
      return;
    }

    const imageUrl = await handleFileUpload(
      file,
      event?.image_venue,
      "image_venue"
    );
    if (file && !imageUrl) {
      alert("Upload venue image gagal, event tidak disimpan.");
      setIsChanged(true);
      return;
    }

    const heroImageUrl = await handleFileUpload(
      heroFile,
      event?.hero_image,
      "hero_image"
    );
    if (heroFile && !heroImageUrl) {
      alert("Upload hero image gagal, event tidak disimpan.");
      setIsChanged(true);
      return;
    }

    const { error } = await supabase
      .from("events")
      .update({
        name: editEvent.name,
        description: editEvent.description,
        location: editEvent.location,
        start_date: editEvent.start_date,
        end_date: editEvent.end_date,
        capacity: editEvent.capacity,
        status: editEvent.status,
        image_venue: imageUrl,
        hero_image: heroImageUrl,
      })
      .eq("id", editEvent.id);

    if (error) {
      console.error("Failed to update event:", error.message);
      setIsChanged(true);
      return;
    }

    alert("Event updated successfully!");
    fetchEvent(id as string);
    setFile(null);
    setHeroFile(null);
    if (venueInputRef.current) venueInputRef.current.value = "";
    if (heroInputRef.current) heroInputRef.current.value = "";
  };

  if (!event) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white/90">
          Website Templates
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose from our collection of professional website templates.
        </p>
      </div>

      {/* --- PREVIEW MODAL --- */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden flex flex-col ${
              isFullscreen ? "w-full h-full m-0" : "w-11/12 max-w-4xl h-[80vh]"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Preview:{" "}
                {templates.find((t) => t.id === previewTemplate)?.title}
              </h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClosePreview}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 bg-background">
              <iframe
                src={
                  templates.find((t) => t.id === previewTemplate)?.url ||
                  "http://localhost:3000"
                }
                className="w-full h-full"
                title="Template Preview"
                frameBorder="0"
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={handleClosePreview}>
                Close Preview
              </Button>
              <Button
                onClick={() => {
                  if (previewTemplate) {
                    handleSelectTemplate(previewTemplate);
                    handleClosePreview();
                  }
                }}
              >
                Select This Template
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- TEMPLATE LIST --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-gray-800 dark:text-white/90">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg bg-white dark:bg-white/[0.03] ${
              selectedTemplate === template.id
                ? "ring-2 ring-primary border-primary"
                : activeTemplate === template.id
                ? "ring-2 ring-green-500 border-green-500"
                : "hover:border-primary/50"
            }`}
            onClick={() => handleSelectTemplate(template.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {template.title}
                    {activeTemplate === template.id && (
                      <Badge
                        variant="default"
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </CardTitle>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {template.category}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewTemplate(template.id);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <Image
                  src={template.thumbnail || "/placeholder.svg"}
                  alt={`${template.title} preview`}
                  width={100}
                  height={100}
                  className="w-full h-full object-cover"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">
                  Features
                </label>
                <div className="flex flex-wrap gap-1">
                  {template.features.slice(0, 2).map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {template.features.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.features.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- APPLY SECTION --- */}
      {selectedTemplate && (
        <Card className="border-primary/20 bg-primary/5 mt-6 bg-white dark:bg-white/[0.03]">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  {`Apply "${
                    templates.find((t) => t.id === selectedTemplate)?.title
                  }" Template`}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This will replace your current website design with the
                  selected template.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="bg-gray-800 dark:bg-white dark:text-gray-800 text-white/90"
                  onClick={() => handlePreviewTemplate(selectedTemplate)}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  onClick={handleApplyTemplate}
                  disabled={isApplying || activeTemplate === selectedTemplate}
                >
                  <Palette className="w-4 h-4 mr-2" />
                  {isApplying
                    ? "Applying..."
                    : activeTemplate === selectedTemplate
                    ? "Already Active"
                    : "Apply Template"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="p-6 rounded-lg mt-5 grid gap-4 border border-primary/20 bg-primary/5 bg-white dark:bg-white/[0.03]">
        <h2 className="text-lg font-bold mb-4 col-span-12 text-gray-800 dark:text-white/90">
          Edit Event
        </h2>

        {/* Name & Location */}
        <input
          type="text"
          placeholder="Event Name"
          className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6"
          value={editEvent?.name || ""}
          onChange={(e) =>
            setEditEvent((prev) =>
              prev ? { ...prev, name: e.target.value } : null
            )
          }
        />

        <input
          type="text"
          placeholder="Location"
          className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6"
          value={editEvent?.location || ""}
          onChange={(e) =>
            setEditEvent((prev) =>
              prev ? { ...prev, location: e.target.value } : null
            )
          }
        />

        {/* Description */}
        <textarea
          placeholder="Description"
          className="w-full border rounded-lg p-2 mb-2 col-span-12 h-32 resize-y"
          value={editEvent?.description || ""}
          onChange={(e) =>
            setEditEvent((prev) =>
              prev ? { ...prev, description: e.target.value } : null
            )
          }
        />

        {/* Start Date & End Date */}
        <input
          type="date"
          className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6"
          value={editEvent?.start_date?.split("T")[0] || ""}
          min={
            editEvent?.start_date?.split("T")[0] ||
            new Date().toISOString().split("T")[0]
          }
          max={editEvent?.end_date?.split("T")[0] || undefined}
          onChange={(e) =>
            setEditEvent((prev) =>
              prev ? { ...prev, start_date: e.target.value } : null
            )
          }
        />

        <input
          type="date"
          className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6"
          value={editEvent?.end_date?.split("T")[0] || ""}
          min={
            editEvent?.end_date?.split("T")[0] ||
            new Date().toISOString().split("T")[0]
          }
          onChange={(e) =>
            setEditEvent((prev) =>
              prev ? { ...prev, end_date: e.target.value } : null
            )
          }
        />

        {/* Venue Image */}
        <div className="col-span-12 grid grid-cols-12 gap-4 items-start">
          <div className="col-span-12 lg:col-span-6">
            <input
              type="file"
              ref={venueInputRef}
              accept="image/*"
              className="w-full border rounded-lg p-2 mb-2"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                if (f) {
                  setFile(f);
                  setEditEvent((prev) =>
                    prev
                      ? { ...prev, image_venue: URL.createObjectURL(f) }
                      : null
                  );
                }
              }}
            />
          </div>
          <div className="col-span-12 lg:col-span-6 flex items-center">
            {editEvent?.image_venue ? (
              <Image
                src={
                  editEvent.image_venue.startsWith("blob:")
                    ? editEvent.image_venue
                    : `/api/upload?file=${editEvent.image_venue}`
                }
                alt="Event Preview"
                width={100}
                height={100}
                className="w-auto h-40 object-cover rounded-lg border"
              />
            ) : (
              <div className="w-full h-40 flex items-center justify-center border rounded-lg text-gray-400">
                No Image
              </div>
            )}
          </div>
        </div>

        {/* Hero Image */}
        <div className="col-span-12 grid grid-cols-12 gap-4 items-start">
          <div className="col-span-12 lg:col-span-6">
            <input
              ref={heroInputRef}
              type="file"
              accept="image/*"
              className="w-full border rounded-lg p-2 mb-2"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                if (f) {
                  setHeroFile(f);
                  setEditEvent((prev) =>
                    prev
                      ? { ...prev, hero_image: URL.createObjectURL(f) }
                      : null
                  );
                }
              }}
            />
          </div>
          <div className="col-span-12 lg:col-span-6 flex items-center">
            {editEvent?.hero_image ? (
              <Image
                src={
                  editEvent.hero_image.startsWith("blob:")
                    ? editEvent.hero_image
                    : `/api/upload?file=${editEvent.hero_image}`
                }
                alt="Hero Preview"
                width={100}
                height={100}
                className="w-auto h-40 object-cover rounded-lg border"
              />
            ) : (
              <div className="w-full h-40 flex items-center justify-center border rounded-lg text-gray-400">
                No Hero Image
              </div>
            )}
          </div>
        </div>

        {/* Capacity & Status */}
        <input
          type="number"
          placeholder="Capacity"
          className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6"
          value={editEvent?.capacity || 0}
          onChange={(e) =>
            setEditEvent((prev) =>
              prev
                ? {
                    ...prev,
                    capacity: e.target.value ? parseInt(e.target.value) : null,
                  }
                : null
            )
          }
        />

        <select
          className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6"
          value={editEvent?.status ? "true" : "false"}
          onChange={(e) =>
            setEditEvent((prev) =>
              prev ? { ...prev, status: e.target.value === "true" } : null
            )
          }
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        {/* Action Buttons */}
        <div className="col-span-12 flex justify-end mt-4">
          <Button
            onClick={handleSaveEvent}
            className={`px-4 py-2 rounded text-white ${
              isChanged
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={!isChanged}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
