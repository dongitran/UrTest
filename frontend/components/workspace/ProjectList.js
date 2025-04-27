import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Eye, MoreVertical, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatTimeAgo } from "@/utils/projectUtils";

export default function ProjectList({ projects, onCreateClick }) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(Math.ceil(projects.length / 5), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Project List</CardTitle>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search projects..." className="pl-8" />
            </div>
            <Button
              className="gap-1 items-center"
              onClick={onCreateClick}
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-6 bg-muted/50 p-3 text-sm font-medium">
            <div className="col-span-2">PROJECT NAME</div>
            <div>STATUS</div>
            <div>PROGRESS</div>
            <div>SUCCESS RATE</div>
            <div>LAST RUN</div>
          </div>
          <div className="divide-y">
            {projects.length > 0 ? (
              projects.map((project) => (
                <div key={project.id} className="grid grid-cols-6 items-center p-3">
                  <div className="col-span-2 flex items-center">
                    <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-blue-700"
                      >
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-xs text-muted-foreground">{project.testCases} test cases</div>
                    </div>
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className={`px-2 py-0.5 ${project.status === 'Stable' ? 'bg-green-100 text-green-800 border-green-200' :
                        project.status === 'Needs Attention' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          project.status === 'Critical Error' ? 'bg-red-100 text-red-800 border-red-200' :
                            project.status === 'In Development' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'}`}
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${project.progress >= 80 ? 'bg-green-500' :
                            project.progress >= 60 ? 'bg-yellow-500' :
                              project.progress >= 40 ? 'bg-blue-500' : 'bg-red-500'}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${project.successRate >= 80 ? 'text-green-600' :
                        project.successRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {project.successRate}%
                      </span>
                      <div className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: project.successRate >= 80 ? '#22c55e' :
                            project.successRate >= 60 ? '#eab308' : '#ef4444'
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {formatTimeAgo(project.lastUpdated)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-muted-foreground">No projects found. Create a new project to get started.</div>
            )}
          </div>
          <div className="flex items-center justify-between p-3">
            <div className="text-sm text-muted-foreground">
              Showing {currentPage} to {Math.min(totalPages, 5)} of {totalPages} pages
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}