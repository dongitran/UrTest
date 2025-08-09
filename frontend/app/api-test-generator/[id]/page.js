"use client";

import { useState, useEffect } from "react";
import { Check, Play, FileText, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

export default function ApiTestResults() {
  const params = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log("ApiTestResults rendered with params:", params);

  const steps = [
    { id: 1, title: "Setup", status: "completed" },
    { id: 2, title: "Primary Tests Generating...", status: "current" },
    { id: 3, title: "Enriching with Edge-Cases...", status: "pending" },
    { id: 4, title: "", status: "pending", isPlay: true },
  ];

  const processingSteps = [
    { id: 1, title: "Preparing Tests", completed: true },
    { id: 2, title: "Analyzing API Definition", completed: true },
    { id: 3, title: "Parsing provided API spec", completed: false },
    { id: 4, title: "Analysing from your API examples", completed: false },
    {
      id: 5,
      title: "Generating 100+ test cases across operations",
      completed: false,
    },
    { id: 6, title: "Evaluating Edge Case Coverage", completed: false },
    {
      id: 7,
      title: "Scanning for null and empty payload handling",
      completed: false,
    },
  ];

  const testSuites = [
    { name: "Create_Get_Update_Delete_Owner", tests: 6, status: "ACCEPTED" },
    { name: "Get_Owner_NotFound", tests: 1, status: "ACCEPTED" },
    { name: "Create_Owner_Missing_FirstName", tests: 1, status: "ACCEPTED" },
    { name: "Create_Owner_Invalid_Telephone", tests: 1, status: "ACCEPTED" },
    {
      name: "List_Owners_And_Filter_By_LastName",
      tests: 3,
      status: "ACCEPTED",
    },
    { name: "Create_Get_Update_Delete_PetType", tests: 6, status: "ACCEPTED" },
    { name: "Get_PetType_NotFound", tests: 1, status: "ACCEPTED" },
    { name: "Create_PetType_Missing_Name", tests: 1, status: "ACCEPTED" },
    { name: "List_All_PetTypes", tests: 1, status: "REJECTED" },
    {
      name: "Create_Get_Update_Delete_Specialty",
      tests: 6,
      status: "ACCEPTED",
    },
  ];

  useEffect(() => {
    console.log("useEffect started");
    setIsLoading(true);

    // Start progression after component mounts
    const timer1 = setTimeout(() => {
      console.log("Setting step 2");
      setCurrentStep(2);
    }, 1000);

    const timer2 = setTimeout(() => {
      console.log("Setting step 3");
      setCurrentStep(3);
    }, 3000);

    const timer3 = setTimeout(() => {
      console.log("Setting step 4 and showing results");
      setCurrentStep(4);
      setShowResults(true);
      setIsLoading(false);
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // Loading state first
  if (isLoading && !showResults) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        {/* Progress Header */}
        <div className="bg-card border-b border-border px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-center max-w-4xl mx-auto">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        step.status === "completed"
                          ? "bg-blue-600"
                          : step.status === "current"
                          ? "bg-blue-500 border-2 border-blue-300"
                          : "bg-gray-400"
                      }`}
                    >
                      {step.isPlay ? (
                        <Play className="w-4 h-4 text-white" />
                      ) : step.status === "current" ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                    {step.title && (
                      <span
                        className={`text-sm font-medium ${
                          step.status === "completed" ||
                          step.status === "current"
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.title}
                      </span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-0.5 mx-4 ${
                        steps[index + 1].status === "completed" ||
                        (step.status === "completed" &&
                          steps[index + 1].status === "current")
                          ? "bg-blue-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 gap-8">
              {/* Left Side */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <h2 className="text-xl font-semibold text-foreground">
                    Test Suites
                  </h2>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-sm font-bold">0</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Loading placeholder boxes */}
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-12 bg-muted rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>

              {/* Right Side - Processing Steps */}
              <div>
                <div className="space-y-4">
                  {processingSteps.map((step) => (
                    <div key={step.id} className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-6 h-6 rounded-full ${
                          step.completed ? "bg-green-600" : "bg-gray-300"
                        }`}
                      >
                        {step.completed ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : (
                          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          step.completed
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results state
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Progress Header - Completed */}
      <div className="bg-card border-b border-border px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-center max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  Setup
                </span>
              </div>
              <div className="w-16 h-0.5 bg-blue-500 mx-4"></div>
            </div>

            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  Primary Tests Generating...
                </span>
              </div>
              <div className="w-16 h-0.5 bg-gray-300 mx-4"></div>
            </div>

            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-400">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Enriching with Edge-Cases...
                </span>
              </div>
              <div className="w-16 h-0.5 bg-gray-300 mx-4"></div>
            </div>

            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-400">
              <Play className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Results */}
      <div className="flex-1 p-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-8 h-full">
            {/* Left Side - Test Suites */}
            <div className="border border-border rounded-lg bg-card">
              <div className="flex items-center gap-2 p-4 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground">
                  Test Suites
                </h2>
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-300">
                    13
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3 overflow-y-auto max-h-[600px]">
                {testSuites.map((suite, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedTest === index
                        ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedTest(index)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {suite.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {suite.tests}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          suite.status === "ACCEPTED"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {suite.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Test Details */}
            <div className="border border-border rounded-lg bg-card">
              {selectedTest !== null ? (
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">
                        {testSuites[selectedTest].name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {testSuites[selectedTest].tests}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      A full CRUD lifecycle test for a pet owner.
                    </p>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-6">
                      {/* Create Owner Test */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 bg-green-600 rounded-sm flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <h4 className="font-medium text-foreground">
                            Create Owner
                          </h4>
                        </div>

                        <div className="space-y-3 ml-7">
                          <div className="text-sm">
                            <span className="font-medium text-foreground">
                              Assertions
                            </span>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-600 rounded-sm flex items-center justify-center">
                                  <Check className="w-2 h-2 text-white" />
                                </div>
                                <span className="text-muted-foreground">
                                  Type: STATUS CODE
                                </span>
                              </div>
                              <div className="ml-6 text-foreground">
                                Expected: 201
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-600 rounded-sm flex items-center justify-center">
                                  <Check className="w-2 h-2 text-white" />
                                </div>
                                <span className="text-muted-foreground">
                                  Type: JSON CONTAINS
                                </span>
                              </div>
                              <div className="ml-6 text-foreground">
                                Key: $.firstName
                              </div>
                              <div className="ml-6 text-foreground">
                                Expected: John
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-600 rounded-sm flex items-center justify-center">
                                  <Check className="w-2 h-2 text-white" />
                                </div>
                                <span className="text-muted-foreground">
                                  Type: JSON CONTAINS
                                </span>
                              </div>
                              <div className="ml-6 text-foreground">
                                Key: $.lastName
                              </div>
                              <div className="ml-6 text-foreground">
                                Expected: DoeCRUD
                              </div>
                            </div>
                          </div>

                          <div className="text-sm">
                            <span className="font-medium text-foreground">
                              Request
                            </span>
                            <div className="mt-2 bg-gray-900 rounded-lg p-3 font-mono text-sm text-gray-100">
                              <div className="text-purple-400">
                                POST{" "}
                                <span className="text-gray-300">/owners</span>
                              </div>
                              <div className="text-purple-400">
                                Accept-Encoding:{" "}
                                <span className="text-gray-300">gzip</span>
                              </div>
                              <div className="text-purple-400">
                                Content-Length:{" "}
                                <span className="text-gray-300">123</span>
                              </div>
                              <div className="text-purple-400">
                                Content-Type:{" "}
                                <span className="text-gray-300">
                                  application/json
                                </span>
                              </div>
                              <div className="text-purple-400">
                                Host:{" "}
                                <span className="text-gray-300">
                                  petclinic-hosted.keploy.io
                                </span>
                              </div>
                              <div className="text-purple-400">
                                User-Agent:{" "}
                                <span className="text-gray-300">
                                  Go-http-client/1.1
                                </span>
                              </div>
                              <div className="mt-2">
                                <div className="text-orange-400">
                                  "firstName":{" "}
                                  <span className="text-green-400">"John"</span>
                                  ,
                                </div>
                                <div className="text-orange-400">
                                  "lastName":{" "}
                                  <span className="text-green-400">
                                    "DoeCRUD"
                                  </span>
                                  ,
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Select a test suite to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
