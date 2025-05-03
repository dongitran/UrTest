import { Fragment, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircle, Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";

const ManageStaffModal = ({ open, setOpen, project }) => {
  const [assignedStaff, setAssignedStaff] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionStaffId, setActionStaffId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("assigned");

  useEffect(() => {
    if (open && project) {
      fetchAssignedStaff();
      fetchAvailableStaff();
    }
  }, [open, project]);

  const fetchAssignedStaff = async () => {
    if (!project) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("keycloak_token")
        ? JSON.parse(localStorage.getItem("keycloak_token")).access_token
        : "";

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/project/${project.id}/assignments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const assignmentsList = response.data.assignments || [];
      setAssignedStaff(assignmentsList);
    } catch (error) {
      console.error("Error fetching assigned staff:", error);
      toast.error("Failed to load assigned staff");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStaff = async () => {
    if (!project) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("keycloak_token")
        ? JSON.parse(localStorage.getItem("keycloak_token")).access_token
        : "";

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/project/${project.id}/available-staff`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const availableStaffList = response.data.availableStaff || [];
      setAvailableStaff(availableStaffList);
    } catch (error) {
      console.error("Error fetching available staff:", error);
      toast.error("Failed to load available staff");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (userEmail) => {
    if (!project) return;

    try {
      setActionStaffId(userEmail);
      setLoadingAction(true);

      const token = localStorage.getItem("keycloak_token")
        ? JSON.parse(localStorage.getItem("keycloak_token")).access_token
        : "";

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/project/${project.id}/assignments`,
        { userEmail },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
        }
      );

      toast.success("Staff added successfully");

      fetchAssignedStaff();
      fetchAvailableStaff();
    } catch (error) {
      console.error("Error adding staff:", error);
      toast.error("Failed to add staff");
    } finally {
      setLoadingAction(false);
      setActionStaffId(null);
    }
  };

  const handleRemoveStaff = async (userEmail) => {
    if (!project) return;

    try {
      setActionStaffId(userEmail);
      setLoadingAction(true);

      const token = localStorage.getItem("keycloak_token")
        ? JSON.parse(localStorage.getItem("keycloak_token")).access_token
        : "";

      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/project/${project.id}/assignments/${userEmail}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
        }
      );

      toast.success("Staff removed successfully");

      fetchAssignedStaff();
      fetchAvailableStaff();
    } catch (error) {
      console.error("Error removing staff:", error);
      toast.error("Failed to remove staff");
    } finally {
      setLoadingAction(false);
      setActionStaffId(null);
    }
  };

  const filteredAssignedStaff = assignedStaff
    .filter(
      (staff) =>
        staff.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map((item) => ({ ...item, email: item.userEmail }));

  const filteredAvailableStaff = availableStaff.filter(
    (staff) =>
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  console.log(selectedTab, "selectedTab");
  console.log(filteredAssignedStaff, "filteredAssignedStaff");

  return (
    <Fragment>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Project Staff</DialogTitle>
            <DialogDescription>
              {project?.title
                ? `Manage staff for project "${project.title}"`
                : "Manage project staff members"}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <Tabs
                defaultValue="assigned"
                className="w-full"
                onValueChange={setSelectedTab}
                value={selectedTab}
              >
                <TabsList className="mb-4">
                  <TabsTrigger value="assigned">Assigned Staff</TabsTrigger>
                  <TabsTrigger value="available">Available Staff</TabsTrigger>
                </TabsList>

                <div className="flex items-center justify-between mb-4">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search staff..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <TabsContent value="assigned">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAssignedStaff.length > 0 ? (
                            filteredAssignedStaff.map((staff) => (
                              <TableRow key={staff.email}>
                                <TableCell>{staff.email}</TableCell>
                                <TableCell>{staff.name || "-"}</TableCell>
                                <TableCell>{staff.role || "STAFF"}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleRemoveStaff(staff.email)
                                    }
                                    disabled={
                                      loadingAction &&
                                      actionStaffId === staff.email
                                    }
                                  >
                                    {loadingAction &&
                                    actionStaffId === staff.email ? (
                                      <LoaderCircle className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    )}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="h-24 text-center"
                              >
                                {searchTerm
                                  ? "No matching staff members found"
                                  : "No staff members assigned to this project"}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="available">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAvailableStaff.length > 0 ? (
                            filteredAvailableStaff.map((staff) => (
                              <TableRow key={staff.email}>
                                <TableCell>{staff.email}</TableCell>
                                <TableCell>{staff.name || "-"}</TableCell>
                                <TableCell>{staff.role || "STAFF"}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleAddStaff(staff.email)}
                                    disabled={
                                      loadingAction &&
                                      actionStaffId === staff.email
                                    }
                                  >
                                    {loadingAction &&
                                    actionStaffId === staff.email ? (
                                      <LoaderCircle className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <UserPlus className="h-4 w-4 text-green-500" />
                                    )}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="h-24 text-center"
                              >
                                {searchTerm
                                  ? "No matching staff members found"
                                  : "No available staff members to assign"}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
};

export default ManageStaffModal;
