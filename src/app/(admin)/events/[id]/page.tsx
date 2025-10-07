"use client";

import { useEffect, useRef, useState } from "react";
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
import { useUser } from "@/context/UserContext";

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
  const { user } = useUser();
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<string | undefined>();
  const [isScrollable, setIsScrollable] = useState(false);
  const [removeVenueImage, setRemoveVenueImage] = useState(false);
  const [removeHeroImage, setRemoveHeroImage] = useState(false);

  // fetch data event & template
  useEffect(() => {
    if (!didFetch.current && id && user?.id) {
      fetchEvent(id as string);
      fetchTemplates();
      didFetch.current = true;
    }
  }, [id, user?.id]);

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
      !!heroFile ||
      removeVenueImage ||
      removeHeroImage; // ← tambahan

    setIsChanged(hasChanged);
  }, [editEvent, event, file, heroFile, removeVenueImage, removeHeroImage]);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards =
      containerRef.current.querySelectorAll<HTMLDivElement>(".template-card");

    if (cards.length === 0) return;

    const heights: number[] = [];

    const observer = new ResizeObserver(() => {
      heights.length = 0;
      cards.forEach((card, i) => {
        if (i < 3) heights.push(card.offsetHeight);
      });
      const tallest = Math.max(...heights, 0);

      setIsScrollable(cards.length > 3);
      setMaxHeight(`${tallest + 16}px`);
    });

    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [templates]);

  const fetchEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events?event_id=${eventId}&merchant_id=${user.id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (!res.ok) {
        console.error("Failed to fetch event:", res.status, res.statusText);
        return;
      }

      const result = await res.json();

      const eventData = result.data ?? result;

      setEvent(eventData);
      setEditEvent(eventData);

      if (eventData.template_id) {
        setActiveTemplate(eventData.template_id);
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    }
  };

  const fetchTemplates = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.token}`,
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch templates:", res.status, res.statusText);
      return;
    }
    const result = await res.json();
    const data = result.data;

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
    if (!selectedTemplate || !event) return;
    const templateUrl = templates.find((t) => t.id === event?.template_id)?.url;

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
            templateUrl: templateUrl,
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
            templateUrl: templateUrl,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to delete hero_image file");
        }
      }

      const req = {
        name: event.name,
        description: event.description,
        location: event.location,
        start_date: event.start_date,
        end_date: event.end_date,
        capacity: event.capacity,
        status: event.status,
        image_venue: null,
        hero_image: null,
        template_id: selectedTemplate,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${event.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify(req),
        }
      );

      if (!res.ok) {
        console.error("Failed to update event:", res.status, res.statusText);
        setIsChanged(true);
        return;
      }

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
    field: "image_venue" | "hero_image",
    remoteUrl: string | null | undefined
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
            templateUrl: remoteUrl,
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
      formData.append("template_url", String(remoteUrl));

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
    const templateUrl = templates.find((t) => t.id === event?.template_id)?.url;
    if (!editEvent) return;
    setIsChanged(false);

    // sebelum upload file baru
    if (removeVenueImage && event?.image_venue) {
      await fetch("/api/delete-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: event.image_venue,
          scope: "event",
          templateId: editEvent?.template_id,
          templateUrl: templates.find((t) => t.id === editEvent?.template_id)
            ?.url,
        }),
      });
    }

    if (removeHeroImage && event?.hero_image) {
      await fetch("/api/delete-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: event.hero_image,
          scope: "event",
          templateId: editEvent?.template_id,
          templateUrl: templates.find((t) => t.id === editEvent?.template_id)
            ?.url,
        }),
      });
    }

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
      "image_venue",
      templateUrl
    );
    if (file && !imageUrl) {
      alert("Upload venue image gagal, event tidak disimpan.");
      setIsChanged(true);
      return;
    }

    const heroImageUrl = await handleFileUpload(
      heroFile,
      event?.hero_image,
      "hero_image",
      templateUrl
    );
    if (heroFile && !heroImageUrl) {
      alert("Upload hero image gagal, event tidak disimpan.");
      setIsChanged(true);
      return;
    }

    const req = {
      name: editEvent.name,
      description: editEvent.description,
      location: editEvent.location,
      start_date: editEvent.start_date,
      end_date: editEvent.end_date,
      capacity: editEvent.capacity,
      status: editEvent.status,
      image_venue: removeVenueImage ? null : imageUrl,
      hero_image: removeHeroImage ? null : heroImageUrl,
    };

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${editEvent.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(req),
      }
    );

    if (!res.ok) {
      console.error("Failed to update event:", res.status, res.statusText);
      setIsChanged(true);
      return;
    }

    alert("Event updated successfully!");
    fetchEvent(id as string);
    setFile(null);
    setHeroFile(null);
    setRemoveVenueImage(false);
    setRemoveHeroImage(false);
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
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
                src={(() => {
                  const templateUrl = templates.find(
                    (t) => t.id === previewTemplate
                  )?.url;

                  if (!templateUrl) return "http://localhost:3000";
                  const eventId = event?.id ?? "";
                  const merchantId = user?.id;

                  return `${templateUrl}?event_id=${eventId}&merchant_id=${merchantId}&edit=true`;
                })()}
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
                className="text-gray-800 dark:text-white/90"
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
      <div
        ref={containerRef}
        style={{ maxHeight: isScrollable ? maxHeight : undefined }}
        className={`${isScrollable ? "overflow-y-auto" : ""}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-800 dark:text-white/90 p-2">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`template-card cursor-pointer transition-all duration-200 hover:shadow-lg bg-white dark:bg-white/[0.03] ${
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

      <div className="p-6 rounded-lg mt-5 grid gap-4 border border-primary/20 dark:border-gray-800 bg-primary/5 bg-white dark:bg-white/[0.03]">
        <h2 className="text-lg font-bold mb-4 col-span-12 text-gray-800 dark:text-white/90">
          Edit Event
        </h2>

        {/* Name & Location */}
        <input
          type="text"
          placeholder="Event Name"
          className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6 bg-input"
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
          className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6 bg-input"
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
          className="w-full border rounded-lg p-2 mb-2 col-span-12 h-32 resize-y bg-input"
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
          className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6 bg-input"
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
          className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6 bg-input"
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
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-2">
            <input
              type="file"
              ref={venueInputRef}
              accept="image/*"
              className="w-full border rounded-lg p-2 mb-2 bg-input"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                if (f) {
                  setEditEvent((prev) =>
                    prev
                      ? { ...prev, image_venue: URL.createObjectURL(f) }
                      : null
                  );
                  setRemoveVenueImage(false); // reset flag hapus
                }
              }}
            />
          </div>
          <div className="col-span-12 lg:col-span-6 flex items-center">
            {editEvent?.image_venue ? (
              <div className="relative">
                <Image
                  src={
                    editEvent.image_venue.startsWith("blob:")
                      ? editEvent.image_venue
                      : `/api/upload?file=${editEvent.image_venue}`
                  }
                  alt="Venue Preview"
                  width={100}
                  height={100}
                  className="w-auto h-40 object-cover rounded-lg border bg-input"
                />
                <Button
                  variant="destructive"
                  className="absolute top-1 right-1 bg-black text-white"
                  size="sm"
                  onClick={() => {
                    setEditEvent((prev) =>
                      prev ? { ...prev, image_venue: null } : null
                    );
                    setFile(null);
                    setRemoveVenueImage(true);
                    if (venueInputRef.current) venueInputRef.current.value = "";
                  }}
                >
                  Delete
                </Button>
              </div>
            ) : (
              <div className="w-full h-40 flex items-center justify-center border rounded-lg bg-input">
                No Venue Image
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
              className="w-full border rounded-lg p-2 mb-2 bg-input"
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
              <div className="relative">
                <Image
                  src={
                    editEvent.hero_image.startsWith("blob:")
                      ? editEvent.hero_image
                      : `/api/upload?file=${editEvent.hero_image}`
                  }
                  alt="Hero Preview"
                  width={100}
                  height={100}
                  className="w-auto h-40 object-cover rounded-lg border bg-input"
                />

                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-1 right-1 bg-black text-white"
                  onClick={() => {
                    setHeroFile(null);
                    setRemoveHeroImage(true);
                    setEditEvent((prev) =>
                      prev ? { ...prev, hero_image: null } : null
                    );
                  }}
                >
                  Delete
                </Button>
              </div>
            ) : (
              <div className="w-full h-40 flex items-center justify-center border rounded-lg bg-input">
                No Hero Image
              </div>
            )}
          </div>
        </div>

        {/* Capacity & Status */}
        <input
          type="number"
          placeholder="Capacity"
          className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6 bg-input"
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
          className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6 bg-input"
          value={editEvent?.status ? "true" : "false"}
          onChange={(e) =>
            setEditEvent((prev) =>
              prev ? { ...prev, status: e.target.value === "true" } : null
            )
          }
        >
          <option value="true" className="!text-gray-800">
            Active
          </option>
          <option value="false" className="!text-gray-800">
            Inactive
          </option>
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
