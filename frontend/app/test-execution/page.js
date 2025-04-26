"use client";

import { useState } from "react";
import {
  Card, CardHeader, CardTitle, CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Play, StopCircle, Loader2,
  ChevronLeft, ChevronRight, Search
} from "lucide-react";

const seedTests = [
  { id: 1, name: "Login – valid credential", project: "E-Commerce", status: "Idle" },
  { id: 2, name: "Add to cart", project: "E-Commerce", status: "Idle" },
  { id: 3, name: "Payment happy-path", project: "Payment", status: "Idle" },
  { id: 4, name: "Search with filters", project: "Mobile App", status: "Idle" },
];

export default function TestExecutionPage() {
  const [tests, setTests] = useState(seedTests);
  const [runningIds, setRunningIds] = useState([]);
  const [page, setPage] = useState(1);

  const perPage = 8;
  const pages = Math.ceil(tests.length / perPage);

  const setStatus = (ids, status) =>
    setTests(tests.map(t => ids.includes(t.id) ? { ...t, status } : t));

  const runSelected = () => {
    const toRun = tests.filter(t => t.selected && t.status === "Idle").map(t => t.id);
    if (!toRun.length) return;
    setRunningIds([...runningIds, ...toRun]);
    setStatus(toRun, "Running");

    /* mock execution result */
    setTimeout(() => {
      setRunningIds(runningIds =>
        runningIds.filter(id => !toRun.includes(id))
      );
      setTests(ts => ts.map(t =>
        toRun.includes(t.id)
          ? {
            ...t,
            status: Math.random() > 0.2 ? "Passed" : "Failed",
            selected: false,
          }
          : t
      ));
    }, 2500);
  };

  const badgeCls = (s) => ({
    Idle: "bg-muted text-foreground",
    Running: "bg-blue-100 text-blue-800 border-blue-200",
    Passed: "bg-green-100 text-green-800 border-green-200",
    Failed: "bg-red-100 text-red-800 border-red-200",
  }[s]);

  const slice = tests.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Test Execution</h1>
        <Button
          className="gap-1 bg-blue-600 hover:bg-blue-700"
          disabled={!tests.some(t => t.selected)}
          onClick={runSelected}
        >
          <Play className="h-4 w-4" /> Run selected
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Available Tests</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-8" />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-medium">
              <div className="col-span-5">TEST CASE</div>
              <div className="col-span-2">PROJECT</div>
              <div className="col-span-2">STATUS</div>
              <div className="col-span-1 text-center">SEL</div>
              <div className="col-span-2 text-right">ACTIONS</div>
            </div>

            <div className="divide-y">
              {slice.map(t => (
                <div key={t.id} className="grid grid-cols-12 items-center p-3">
                  <div className="col-span-5 font-medium">{t.name}</div>
                  <div className="col-span-2 text-sm text-muted-foreground">{t.project}</div>

                  <div className="col-span-2">
                    <Badge variant="outline" className={`px-2 py-0.5 ${badgeCls(t.status)}`}>
                      {t.status === "Running" && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      {t.status}
                    </Badge>
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      disabled={t.status === "Running"}
                      checked={!!t.selected}
                      onChange={() =>
                        setTests(ts => ts.map(x =>
                          x.id === t.id ? { ...x, selected: !x.selected } : x
                        ))
                      }
                    />
                  </div>

                  <div className="col-span-2 flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={t.status === "Running"}
                      onClick={() => {
                        setTests(ts => ts.map(x =>
                          x.id === t.id ? { ...x, selected: true } : x
                        ));
                        runSelected();
                      }}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <StopCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-3">
              <span className="text-sm text-muted-foreground">
                Showing {slice.length} of {tests.length}
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {[...Array(pages)].map((_, i) => (
                  <Button
                    key={i}
                    variant={page === i + 1 ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === pages}
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
