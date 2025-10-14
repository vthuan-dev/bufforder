import React, { useState } from "react";
import { Save, User, Lock, Bell, Globe, CreditCard, Database, Loader2 } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { toast } from "sonner";
import api from "../../services/api";

export function AdminSettingsPage() {
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState({ fullName: '', email: '', phoneNumber: '' });
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [depositAlerts, setDepositAlerts] = useState(true);
  const [withdrawalAlerts, setWithdrawalAlerts] = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{[key: string]: string}>({});

  const handleSave = () => {
    (async () => {
      try {
        const res = await api.adminUpdateProfile({
          fullName: profile.fullName,
          email: profile.email,
          phoneNumber: profile.phoneNumber,
        });
        if (res.success) {
          toast.success("Settings saved successfully!");
        }
      } catch (e: any) {
        toast.error(e?.message || 'Failed to save settings');
      }
    })();
  };

  // Load profile on mount
  React.useEffect(() => {
    (async () => {
      try {
        setProfileLoading(true);
        const res = await api.adminGetProfile();
        if (res.success) {
          setProfile({
            fullName: res.data.fullName || '',
            email: res.data.email || '',
            phoneNumber: res.data.phoneNumber || ''
          });
        }
      } catch (e) {
        console.error('Load profile error:', e);
      } finally {
        setProfileLoading(false);
      }
    })();
  }, []);

  const validatePassword = () => {
    const errors: {[key: string]: string} = {};
    
    if (!currentPassword) {
      errors.currentPassword = "Current password is required";
    }
    
    if (!newPassword) {
      errors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters long";
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors.newPassword = "New password must be different from current password";
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) {
      toast.error("Please fix the errors below");
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await api.adminChangePassword(currentPassword, newPassword);
      
      if (response.success) {
        toast.success("Password changed successfully!");
        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordErrors({});
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl text-gray-900 mb-1">Settings</h1>
        <p className="text-gray-600">Manage your admin account and preferences</p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger
            value="profile"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
          >
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
          >
            <Lock className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-gray-900 mb-1">Profile Information</h3>
              <p className="text-sm text-gray-600">Update your admin profile details</p>
            </div>

            <Separator />

            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-blue-600 text-white text-2xl">AD</AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm">Change Avatar</Button>
                <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. Max size of 2MB</p>
              </div>
            </div>

            <Separator />

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={profile.fullName}
                  onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                  disabled={profileLoading}
                />
              </div>
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                  disabled={profileLoading}
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={profile.phoneNumber}
                  onChange={(e) => setProfile((p) => ({ ...p, phoneNumber: e.target.value }))}
                  disabled={profileLoading}
                />
              </div>
              <div>
                <Label>Role</Label>
                <Input defaultValue="Super Administrator" disabled />
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={profileLoading}>
                <Save className="w-4 h-4 mr-2" />
                {profileLoading ? 'Loading...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-gray-900 mb-1">Security Settings</h3>
              <p className="text-sm text-gray-600">Manage your password and security preferences</p>
            </div>

            <Separator />

            {/* Change Password */}
            <div className="space-y-4">
              <h4 className="text-gray-900">Change Password</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Current Password</Label>
                  <Input 
                    type="password" 
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (passwordErrors.currentPassword) {
                        setPasswordErrors(prev => ({ ...prev, currentPassword: "" }));
                      }
                    }}
                    disabled={isChangingPassword}
                    className={passwordErrors.currentPassword ? "border-red-500" : ""}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-sm text-red-500 mt-1">{passwordErrors.currentPassword}</p>
                  )}
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input 
                    type="password" 
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordErrors.newPassword) {
                        setPasswordErrors(prev => ({ ...prev, newPassword: "" }));
                      }
                    }}
                    disabled={isChangingPassword}
                    className={passwordErrors.newPassword ? "border-red-500" : ""}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-red-500 mt-1">{passwordErrors.newPassword}</p>
                  )}
                  {newPassword && !passwordErrors.newPassword && (
                    <div className="mt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1 w-full rounded ${
                              newPassword.length >= level * 2
                                ? newPassword.length >= 8
                                  ? "bg-green-500"
                                  : "bg-yellow-500"
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {newPassword.length < 6
                          ? "Too short"
                          : newPassword.length < 8
                          ? "Weak"
                          : "Strong"}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <Input 
                    type="password" 
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordErrors.confirmPassword) {
                        setPasswordErrors(prev => ({ ...prev, confirmPassword: "" }));
                      }
                    }}
                    disabled={isChangingPassword}
                    className={passwordErrors.confirmPassword ? "border-red-500" : ""}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">{passwordErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Two-Factor Authentication */}
            {/* <div className="space-y-4">
              <div>
                <h4 className="text-gray-900 mb-1">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">2FA is enabled</p>
                    <p className="text-xs text-gray-600">Your account is protected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Disable</Button>
              </div>
            </div> */}

            <Separator />

            <div className="flex justify-end">
              <Button 
                onClick={handleChangePassword} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Security
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        
      </Tabs>
    </div>
  );
}
