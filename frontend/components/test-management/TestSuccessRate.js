import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TestResourceModal from "@/components/test-management/TestResourceModal";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TestResourceApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Edit, Trash2 } from "lucide-react";

export default function TestSuccessRate({ project = {} }) {
  const [openModal, setOpenModal] = useState(false);
  const { data, refetch } = useQuery({
    enabled: project.id ? true : false,
    queryKey: ["test-resource"],
    queryFn: () => {
      return TestResourceApi().list({ projectId: project.id });
    },
  });
  console.log("data :>> ", data);
  return (
    <Card>
      <CardHeader className="">
        <CardTitle className="flex gap-3 items-center">
          <span className="text-xl font-semibold">Test Resource</span>
          <div className="ml-auto"></div>
          <TestResourceModal
            dialogChild={<Button className="">Create Test Resource</Button>}
            openModal={openModal}
            setOpenModal={setOpenModal}
            projectId={project.id}
            refetch={refetch}
          />
        </CardTitle>
        <CardDescription>
          Là các file chứa nội dung như các config, function chung để các Testsuite trong cùng Project có thể sử dụng
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {data?.listTestResource.map((item) => {
            return (
              <div className="flex gap-3 items-center">
                <div>
                  <p className="text-lg font-semibold">{item.title}</p>
                  <div className="max-w-80 text-xs text-muted-foreground truncate">{item.description}</div>
                </div>
                <div className="ml-auto"></div>
                <div>
                  <Button className="h-8 w-8" variant="ghost">
                    <Edit className="size-4" />
                  </Button>
                  <Button variant="ghost" className="h-8 w-8 text-red-700 hover:text-red-800">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-1 mt-3 justify-end">
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ChevronLeft className="size-4" />
          </Button>
          {[1, 2, 3, 4, 5].map((page) => (
            <Button key={page} variant={1 === page ? "default" : "outline"} size="icon" className="h-7 w-7">
              {page}
            </Button>
          ))}
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
