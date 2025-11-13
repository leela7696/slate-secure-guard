import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  department: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // TODO: Fetch user data from API
  const userData = {
    name: "John Doe",
    email: "john@example.com",
    role: "User",
    phone: "",
    department: "",
    createdAt: "2025-01-15",
  };

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userData.name,
      phone: userData.phone,
      department: userData.department,
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setLoading(true);
    try {
      // TODO: API call to update profile
      console.log("Update profile:", data);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Profile</h2>
          <p className="text-muted-foreground mt-2">
            Manage your account information
          </p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your profile details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  disabled={loading}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={userData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department (Optional)</Label>
                <Input
                  id="department"
                  {...register("department")}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={userData.role} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Contact an administrator to change your role
                </p>
              </div>

              <div className="space-y-2">
                <Label>Member Since</Label>
                <Input value={userData.createdAt} disabled className="bg-muted" />
              </div>

              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
