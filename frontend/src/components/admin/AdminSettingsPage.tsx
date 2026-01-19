import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:5000';

export function AdminSettingsPage() {
  const { t } = useTranslation('adminSettings');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profile, setProfile] = useState({ fullName: '', email: '', phoneNumber: '', avatar: '' });
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
  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('errors.imageSizeTooLarge'));
      return;
    }

    try {
      setProfileSaving(true);
      const res = await api.adminUploadAvatar(file);
      if (res.success) {
        // Add timestamp to bust cache and prepend API_BASE
        const avatarWithCache = `${res.data.avatarUrl}?t=${Date.now()}`;
        setProfile(prev => ({ ...prev, avatar: avatarWithCache }));
        toast.success(t('notifications.avatarUpdated'));

        // Update local storage/context if needed
        const adminDataStr = localStorage.getItem('adminData');
        if (adminDataStr) {
          const adminData = JSON.parse(adminDataStr);
          adminData.avatar = res.data.avatarUrl;
          localStorage.setItem('adminData', JSON.stringify(adminData));

          // Trigger event for AdminLayout to update
          window.dispatchEvent(new CustomEvent('adminDataUpdated', { detail: adminData }));
        }
      }
    } catch (error: any) {
      toast.error(error?.message || t('errors.uploadFailed'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setProfileSaving(true);
      const res = await api.adminUpdateProfile({
        fullName: profile.fullName,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
      });
      if (res.success) {
        toast.success(t('notifications.settingsSaved'));

        // Update local storage/context
        const adminDataStr = localStorage.getItem('adminData');
        if (adminDataStr) {
          const adminData = JSON.parse(adminDataStr);
          adminData.fullName = profile.fullName;
          adminData.email = profile.email;
          adminData.phoneNumber = profile.phoneNumber;
          localStorage.setItem('adminData', JSON.stringify(adminData));

          // Trigger event for AdminLayout to update
          window.dispatchEvent(new CustomEvent('adminDataUpdated', { detail: adminData }));
        }
      }
    } catch (e: any) {
      toast.error(e?.message || t('errors.saveFailed'));
    } finally {
      setProfileSaving(false);
    }
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
            phoneNumber: res.data.phoneNumber || '',
            avatar: res.data.avatar || ''
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
    const errors: { [key: string]: string } = {};

    if (!currentPassword) {
      errors.currentPassword = t('errors.currentPasswordRequired');
    }

    if (!newPassword) {
      errors.newPassword = t('errors.newPasswordRequired');
    } else if (newPassword.length < 6) {
      errors.newPassword = t('errors.passwordTooShort');
    }

    if (!confirmPassword) {
      errors.confirmPassword = t('errors.confirmPasswordRequired');
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = t('errors.passwordsDoNotMatch');
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors.newPassword = t('errors.passwordSame');
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) {
      toast.error(t('errors.fixErrors'));
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await api.adminChangePassword(currentPassword, newPassword);

      if (response.success) {
        toast.success(t('notifications.passwordChanged'));
        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordErrors({});
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.message || t('errors.passwordChangeFailed'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl text-gray-900 mb-1">{t('title')}</h1>
        <p className="text-gray-600">{t('subtitle')}</p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger
            value="profile"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
          >
            <User className="w-4 h-4 mr-2" />
            {t('tabs.profile')}
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
          >
            <Lock className="w-4 h-4 mr-2" />
            {t('tabs.security')}
          </TabsTrigger>

        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-gray-900 mb-1">{t('profile.title')}</h3>
              <p className="text-sm text-gray-600">{t('profile.subtitle')}</p>
            </div>

            <Separator />

            {/* Avatar */}
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <Avatar className="w-20 h-20 border">
                <AvatarImage src={profile.avatar ? `${API_BASE}${profile.avatar}` : ""} />
                <AvatarFallback className="bg-blue-600 text-white text-2xl">
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : "AD"}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAvatarClick}
                  disabled={profileSaving}
                >
                  {profileSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {t('profile.changeAvatar')}
                </Button>
                <p className="text-xs text-gray-500 mt-2">{t('profile.avatarHint')}</p>
              </div>
            </div>

            <Separator />

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>{t('profile.fullName')}</Label>
                <Input
                  value={profile.fullName}
                  onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                  disabled={profileLoading || profileSaving}
                />
              </div>
              <div>
                <Label>{t('profile.email')}</Label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                  disabled={profileLoading || profileSaving}
                />
              </div>
              <div>
                <Label>{t('profile.phoneNumber')}</Label>
                <Input
                  value={profile.phoneNumber}
                  onChange={(e) => setProfile((p) => ({ ...p, phoneNumber: e.target.value }))}
                  disabled={profileLoading || profileSaving}
                />
              </div>
              <div>
                <Label>{t('profile.role')}</Label>
                <Input defaultValue={t('profile.roleValue')} disabled />
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 transition-all" disabled={profileLoading || profileSaving}>
                {profileSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('profile.saving')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {profileLoading ? t('profile.loading') : t('profile.saveChanges')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-gray-900 mb-1">{t('security.title')}</h3>
              <p className="text-sm text-gray-600">{t('security.subtitle')}</p>
            </div>

            <Separator />

            {/* Change Password */}
            <div className="space-y-4">
              <h4 className="text-gray-900">{t('security.changePassword')}</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>{t('security.currentPassword')}</Label>
                  <Input
                    type="password"
                    placeholder={t('security.currentPasswordPlaceholder')}
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
                  <Label>{t('security.newPassword')}</Label>
                  <Input
                    type="password"
                    placeholder={t('security.newPasswordPlaceholder')}
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
                            className={`h-1 w-full rounded ${newPassword.length >= level * 2
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
                          ? t('security.passwordStrength.tooShort')
                          : newPassword.length < 8
                            ? t('security.passwordStrength.weak')
                            : t('security.passwordStrength.strong')}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <Label>{t('security.confirmPassword')}</Label>
                  <Input
                    type="password"
                    placeholder={t('security.confirmPasswordPlaceholder')}
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
                    {t('security.updating')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('security.updateSecurity')}
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
