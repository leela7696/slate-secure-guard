import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Filter } from "lucide-react";
import { useState } from "react";

const AuditLogs = () => {
  const [search, setSearch] = useState("");

  // TODO: Fetch from API
  const logs = [
    { 
      id: "1", 
      timestamp: "2025-01-15 14:30:22", 
      user: "john@example.com", 
      action: "USER_LOGIN", 
      module: "Auth",
      success: true 
    },
    { 
      id: "2", 
      timestamp: "2025-01-15 14:28:15", 
      user: "admin@example.com", 
      action: "USER_UPDATED", 
      module: "Users",
      success: true 
    },
    { 
      id: "3", 
      timestamp: "2025-01-15 14:25:03", 
      user: "jane@example.com", 
      action: "OTP_VERIFIED", 
      module: "Auth",
      success: true 
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Audit Logs</h2>
            <p className="text-muted-foreground mt-2">
              Monitor all system activities and events
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>Complete audit trail of system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.module}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.success ? "default" : "destructive"}>
                          {log.success ? "Success" : "Failed"}
                        </Badge>
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

export default AuditLogs;
