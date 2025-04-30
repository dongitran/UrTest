import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { ProjectApi } from "@/lib/api";
import { toast } from "sonner";

const { Fragment, memo, useEffect } = require("react");

const ProjectFields = memo(({ project }) => {
  const { register, getValues, reset } = useForm({});

  const handleUpdateProject = async () => {
    try {
      const data = getValues();
      console.log("data :>> ", data);
      await ProjectApi().patch(project.id, data);
      toast.success("Cập nhập dữ liệu thành công");
    } catch (error) {
      toast.error("Có lỗi khi cập nhập dữ liệu");
    }
  };

  useEffect(() => {
    if (project) {
      reset({ title: project.title, description: project.description });
    }
  }, [project, reset]);

  return (
    <Fragment>
      <Card className="">
        <CardHeader>
          <CardTitle>
            <div className="flex gap-3 items-center">
              <span>Thông tin Project</span>
              <div className="ml-auto"></div>
              <Button className="rounded-sm cursor-pointer" onClick={handleUpdateProject} size="sm">
                Cập nhập dữ liệu
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            <Input {...register("title")} placeholder="Tên của Project" className="rounded-sm" />
            <Textarea {...register("description")} placeholder="Mô tả cho Project" />
          </div>
        </CardContent>
      </Card>
    </Fragment>
  );
});
export default ProjectFields;
