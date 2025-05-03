import MonacoEditor from "@/components/MonacoEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TestResourceApi } from "@/lib/api";
import { isEmpty } from "lodash";
import { Copy, LoaderCircle } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const TestResourceModal = ({
  refetch,
  projectId,
  testResource,
  openModal,
  setOpenModal,
  dialogChild,
}) => {
  const [scriptContent, setScriptContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register, getValues, setValue } = useForm();

  const handleSaveTestSuite = async () => {
    try {
      setIsLoading(true);
      if (!projectId) {
        toast.warning("Please provide a ProjectId value");
        return;
      }
      if (!scriptContent || !scriptContent.trim()) {
        toast.warning("Please enter content to create a Test Resource");
        return;
      }
      const data = getValues();
      if (testResource) {
        await TestResourceApi().patch(testResource.id, {
          ...data,
          content: scriptContent,
          projectId,
        });
        toast.success("Test Resource information updated successfully");
        setOpenModal(false);
      } else {
        await TestResourceApi().create({
          ...data,
          content: scriptContent,
          projectId,
        });
        toast.success("Test Resource created successfully");
        setOpenModal(false);
      }
      if (refetch) refetch();

      setValue("title", "");
      setValue("description", "");
      setScriptContent("");
    } catch (error) {
      const message = "Error creating Test Resource";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (openModal === false) {
    } else if (!isEmpty(testResource) && openModal === true) {
      setValue("title", testResource.title);
      setValue("description", testResource.description);
      setScriptContent(testResource.content);
    }
  }, [openModal, testResource]);

  return (
    <Fragment>
      <Dialog open={openModal}>
        <DialogTrigger asChild>{dialogChild()}</DialogTrigger>
        <DialogContent className="min-w-[700px]">
          <DialogHeader>
            <DialogTitle>Test Resource</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <Input
              {...register("title")}
              placeholder="Enter a name for Test Resource"
              className="rounded-sm"
            />
            <Textarea
              {...register("description")}
              className="rounded-sm"
              placeholder="Describe the content of Test Resource"
            />
            <div className="flex gap-3 items-center">
              <Input
                value={
                  testResource?.fileName
                    ? `${testResource?.fileName}.robot`
                    : null
                }
                placeholder="Test Resource filename will be automatically generated"
                disabled
                className="rounded-sm"
              />
              <Button size="sm" disabled={!testResource?.fileName}>
                <Copy />
              </Button>
            </div>
            <div
              className="rounded-sm"
              style={{
                height: `calc(85vh - 320px)`,
              }}
            >
              <MonacoEditor
                language="robotframework"
                value={scriptContent}
                onChange={setScriptContent}
              />
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2 items-center">
              <Button
                onClick={() => {
                  if (setOpenModal) setOpenModal(false);
                }}
                disabled={isLoading}
              >
                {isLoading && <LoaderCircle className="animate-spin" />}
                Cancel
              </Button>
              <div className="ml-auto"></div>
              <Button disabled={isLoading}>
                {isLoading && <LoaderCircle className="animate-spin" />}
                Reset
              </Button>
              <Button
                disabled={isLoading}
                onClick={handleSaveTestSuite}
                className="bg-blue-700 hover:bg-blue-800 text-white"
              >
                {isLoading && <LoaderCircle className="animate-spin" />}
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
};
export default TestResourceModal;
