"use client";

import { useEffect, useState } from "react";
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

const templates = [
  {
    id: 1,
    name: "Modern Business",
    description:
      "Clean and professional template perfect for business websites",
    category: "Business",
    preview:
      "/placeholder.svg?height=200&width=300&text=Modern+Business+Template",
    features: [
      "Responsive Design",
      "Contact Forms",
      "Service Sections",
      "Team Pages",
    ],
    colors: ["#2563eb", "#f8fafc", "#1e293b"],
  },
  {
    id: 2,
    name: "Creative Portfolio",
    description: "Stunning portfolio template for designers and creatives",
    category: "Portfolio",
    preview:
      "/placeholder.svg?height=200&width=300&text=Creative+Portfolio+Template",
    features: [
      "Image Galleries",
      "Project Showcase",
      "About Section",
      "Contact Form",
    ],
    colors: ["#7c3aed", "#fbbf24", "#111827"],
  },
  {
    id: 3,
    name: "E-commerce Store",
    description: "Complete online store template with product catalogs",
    category: "E-commerce",
    preview:
      "/placeholder.svg?height=200&width=300&text=E-commerce+Store+Template",
    features: [
      "Product Grid",
      "Shopping Cart",
      "Checkout Pages",
      "User Accounts",
    ],
    colors: ["#059669", "#f3f4f6", "#374151"],
  },
];

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<number | null>(1);
  const [isApplying, setIsApplying] = useState(false);

  // preview modal state
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEvent(id as string);
    }
  }, [id]);

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

    if (data.template) {
      setActiveTemplate(data.template);
    }
  };

  const handleSelectTemplate = (templateId: number) => {
    setSelectedTemplate(templateId);
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || !event) return;

    setIsApplying(true);

    // update event di supabase
    const { error } = await supabase
      .from("events")
      .update({
        template: selectedTemplate, // simpan id template ke kolom template
      })
      .eq("id", event.id);

    if (error) {
      console.error("Failed to apply template:", error.message);
      setIsApplying(false);
      alert("Failed to apply template");
      return;
    }

    // update local state
    setActiveTemplate(selectedTemplate);
    setIsApplying(false);

    // update event state juga biar sinkron
    setEvent({ ...event, template: selectedTemplate });

    alert("Template applied successfully!");
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

  if (!event) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground mb-2 text-gray-800 dark:text-white/90">
          Website Templates
        </h2>
        <p className="text-muted-foreground text-gray-800 dark:text-white/90">
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
                Preview: {templates.find((t) => t.id === previewTemplate)?.name}
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
                src="http://localhost:3000"
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
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
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
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    {template.name}
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
                <img
                  src={template.preview || "/placeholder.svg"}
                  alt={`${template.name} preview`}
                  className="w-full h-full object-cover"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">
                  Color Palette
                </label>
                <div className="flex gap-1">
                  {template.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-6 h-6 rounded-full border border-border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

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
        <Card className="border-primary/20 bg-primary/5 mt-6">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">
                  Apply "
                  {templates.find((t) => t.id === selectedTemplate)?.name}"
                  Template
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This will replace your current website design with the
                  selected template.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
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
    </div>
  );
}
