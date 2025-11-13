import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Shield } from "lucide-react";

const Roles = () => {
  // TODO: Fetch from API
  const roles = [
    { 
      id: "1", 
      name: "System Admin", 
      description: "Full system access and control",
      userCount: 2 
    },
    { 
      id: "2", 
      name: "Admin", 
      description: "Administrative access to most features",
      userCount: 5 
    },
    { 
      id: "3", 
      name: "Manager", 
      description: "Department management access",
      userCount: 12 
    },
    { 
      id: "4", 
      name: "User", 
      description: "Standard user access",
      userCount: 234 
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Roles & Permissions</h2>
            <p className="text-muted-foreground mt-2">
              Define and manage user roles and their permissions
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>System Roles</CardTitle>
            <CardDescription>Configure role-based access control</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="font-medium">{role.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {role.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{role.userCount} users</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Edit Permissions
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Roles;
