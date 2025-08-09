"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Rocket, Check, Settings as SettingsIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";

export default function ApiTestGenerator() {
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState("");
  const [activeTab, setActiveTab] = useState("test-inputs");
  const [privateMode, setPrivateMode] = useState(false);
  const [testsThreshold, setTestsThreshold] = useState(1);
  const [webhookUrl, setWebhookUrl] = useState(
    "https://your-server.com/webhook-endpoint"
  );
  const [rateLimit, setRateLimit] = useState("Enter rate limit (e.g., 10)");
  const [authType, setAuthType] = useState("no-auth");
  const [ignoreEndpoints, setIgnoreEndpoints] = useState(
    "GET /health,\nOPTIONS *,\n/api/pettypes"
  );

  const [curlCommands, setCurlCommands] = useState("");

  const [swaggerSchema, setSwaggerSchema] = useState("");

  // Validation logic
  const isBaseUrlValid = baseUrl.trim().length > 0;
  const isCurlValid = curlCommands.trim().length > 0;
  const canGenerate = isBaseUrlValid && isCurlValid;

  const handleGenerateTests = () => {
    if (!canGenerate) return;

    // Generate random ID
    const randomId = Math.random().toString(36).substring(2, 15);

    // Redirect to results page
    router.push(`/api-test-generator/${randomId}`);
  };

  // Component for Step 1 - Base URL (shared across all tabs)
  const BaseUrlStep = () => (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
          1
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Base Test Endpoint (URL)
        </h2>
      </div>
      <p className="text-muted-foreground mb-4">
        Enter the URL or endpoint to test NOT homepage/website of your
        application.
      </p>
      <div>
        <Input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          className="w-full text-sm bg-background border-input text-foreground"
          placeholder="Enter API base URL"
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Progress Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-8">
            {/* Step 1 - API Base URL */}
            <div className="flex items-center space-x-3">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full ${
                  isBaseUrlValid ? "bg-green-600" : "bg-gray-400"
                }`}
              >
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground">
                API Base URL
              </span>
              <div
                className={`w-20 h-0.5 ${
                  isBaseUrlValid ? "bg-green-600" : "bg-gray-300"
                }`}
              ></div>
            </div>

            {/* Step 2 - Sample cURLs */}
            <div className="flex items-center space-x-3">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full ${
                  canGenerate ? "bg-green-600" : "bg-gray-400"
                }`}
              >
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground">
                Sample cURLs
              </span>
              <div
                className={`w-20 h-0.5 ${
                  canGenerate ? "bg-orange-400" : "bg-gray-300"
                }`}
              ></div>
            </div>

            {/* Step 3 - Swagger */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-6 h-6 bg-orange-500 rounded-full border-2 border-orange-500">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-sm font-medium text-foreground">
                Swagger
              </span>
            </div>
          </div>

          <Button
            className={`px-6 py-2 font-medium ${
              canGenerate
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-gray-400 text-gray-600 cursor-not-allowed"
            }`}
            disabled={!canGenerate}
            onClick={handleGenerateTests}
          >
            <Rocket className="w-4 h-4 mr-2" />
            Generate API Tests
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-6 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          {/* Title and Tabs */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Rocket className="h-8 w-8 text-orange-500" />
              Generate API Test Scenarios at
              <span className="text-orange-500">warp speed</span>
            </h1>

            <div className="bg-muted/30 border border-border rounded-lg p-1 inline-flex">
              <button
                onClick={() => setActiveTab("test-inputs")}
                className={`text-sm px-4 py-2 rounded-md transition-all ${
                  activeTab === "test-inputs"
                    ? "bg-background text-foreground shadow-sm border-0"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Test Inputs
              </button>
              <button
                onClick={() => setActiveTab("configuration")}
                className={`text-sm px-4 py-2 rounded-md transition-all ${
                  activeTab === "configuration"
                    ? "bg-background text-foreground shadow-sm border-0"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Configuration
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`text-sm px-4 py-2 rounded-md transition-all ${
                  activeTab === "settings"
                    ? "bg-background text-foreground shadow-sm border-0"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Settings
              </button>
            </div>
          </div>

          {/* Test Inputs Tab Content */}
          <TabsContent value="test-inputs" className="flex-1 overflow-y-auto">
            <BaseUrlStep />

            {/* Steps 2 and 3 in 2 columns */}
            <div className="grid grid-cols-2 gap-6">
              {/* Step 2 - Left Column */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Add cURL Snippet / Postman Collection
                    </h2>
                  </div>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 text-sm border-border hover:bg-muted"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Collection
                  </Button>
                </div>
                <p className="text-muted-foreground mb-4">
                  Paste 3-5 working cURL commands. This improves test accuracy.
                </p>

                <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
                  <Textarea
                    value={curlCommands}
                    onChange={(e) => setCurlCommands(e.target.value)}
                    className="w-full h-64 font-mono text-sm border-0 rounded-none resize-none focus:outline-none focus:ring-0 focus-visible:ring-0 p-4 bg-transparent text-foreground placeholder:text-muted-foreground"
                    placeholder="Paste your cURL commands here..."
                  />
                </div>
              </div>

              {/* Step 3 - Right Column */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Swagger / OpenAPI Schema
                  </h2>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    Optional
                  </span>
                </div>
                <p className="text-muted-foreground mb-4">
                  Paste your openAPI schema code snippet to generate tests
                  (YAML, JSON)
                </p>

                <div className="border border-border rounded-lg relative overflow-hidden bg-card shadow-sm">
                  <Textarea
                    value={swaggerSchema}
                    onChange={(e) => setSwaggerSchema(e.target.value)}
                    className="w-full h-64 font-mono text-sm border-0 rounded-none resize-none focus:outline-none focus:ring-0 focus-visible:ring-0 p-4 bg-transparent text-foreground placeholder:text-muted-foreground"
                    placeholder="Paste your OpenAPI/Swagger schema here..."
                  />
                  {/* Check mark in bottom right */}
                  {swaggerSchema.trim().length > 0 && (
                    <div className="absolute bottom-4 right-4">
                      <div className="w-6 h-6 bg-green-600 rounded-sm flex items-center justify-center shadow-sm">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Configuration Tab Content */}
          <TabsContent value="configuration" className="flex-1 overflow-y-auto">
            <BaseUrlStep />

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  Add Authentication Headers
                </h3>
                <p className="text-muted-foreground mb-6">
                  Configure authentication settings for your API tests
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Auth Type
                    </label>
                    <Select value={authType} onValueChange={setAuthType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="No Auth" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-auth">No Auth</SelectItem>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                        <SelectItem value="api-key">API Key</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  Ignore Endpoints
                </h3>
                <p className="text-muted-foreground mb-6">
                  Skip any endpoints you don't want to generate tests for. Enter
                  comma-separated values:
                </p>
                <Textarea
                  value={ignoreEndpoints}
                  onChange={(e) => setIgnoreEndpoints(e.target.value)}
                  className="w-full h-48 text-sm"
                  placeholder="GET /health, OPTIONS *, /api/pettypes"
                />
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab Content */}
          <TabsContent value="settings" className="flex-1 overflow-y-auto">
            <BaseUrlStep />

            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  <h3 className="text-xl font-semibold text-foreground">
                    Test Settings
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Private Mode
                  </span>
                  <Switch
                    checked={privateMode}
                    onCheckedChange={setPrivateMode}
                  />
                </div>
              </div>
              <p className="text-muted-foreground mb-8">
                Configure your test generation preferences
              </p>

              <div className="space-y-8">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-4">
                    Number of Tests Threshold
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="500"
                    value={testsThreshold}
                    onChange={(e) =>
                      setTestsThreshold(parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    style={{
                      background: `linear-gradient(to right, #f97316 0%, #f97316 ${
                        ((testsThreshold - 1) / (500 - 1)) * 100
                      }%, #e5e7eb ${
                        ((testsThreshold - 1) / (500 - 1)) * 100
                      }%, #e5e7eb 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>1</span>
                    <span>100</span>
                    <span>200</span>
                    <span>300</span>
                    <span>400</span>
                    <span>500</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Webhook URL
                  </label>
                  <Input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full text-sm"
                    placeholder="https://your-server.com/webhook-endpoint"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Rate Limit (requests/second)
                  </label>
                  <Input
                    value={rateLimit}
                    onChange={(e) => setRateLimit(e.target.value)}
                    className="w-full text-sm"
                    placeholder="Enter rate limit (e.g., 10)"
                  />
                </div>

                <Button className="w-fit bg-blue-600 hover:bg-blue-700 text-white px-8">
                  Save Settings
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
