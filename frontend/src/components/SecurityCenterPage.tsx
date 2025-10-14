import React, { useState } from "react";
import { ArrowLeft, Lock, Eye, EyeOff, Check, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import api from "../services/api";

interface SecurityCenterPageProps {
  onBack: () => void;
}

export function SecurityCenterPage({ onBack }: SecurityCenterPageProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      alert("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    try {
      const res = await api.changePassword({ currentPassword, newPassword });
      if (res?.success) {
        alert("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to change password');
    }
  };

  const passwordStrength = () => {
    if (!newPassword) return 0;
    let strength = 0;
    if (newPassword.length >= 6) strength++;
    if (newPassword.length >= 10) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength++;
    return Math.min(strength, 4);
  };

  const strengthColor = () => {
    const strength = passwordStrength();
    if (strength <= 1) return "from-red-500 to-red-600";
    if (strength === 2) return "from-yellow-500 to-orange-500";
    if (strength === 3) return "from-blue-500 to-blue-600";
    return "from-green-500 to-emerald-500";
  };

  const strengthText = () => {
    const strength = passwordStrength();
    if (strength <= 1) return "Weak";
    if (strength === 2) return "Fair";
    if (strength === 3) return "Good";
    return "Strong";
  };

  const strengthTextColor = () => {
    const strength = passwordStrength();
    if (strength <= 1) return "text-red-600";
    if (strength === 2) return "text-yellow-600";
    if (strength === 3) return "text-blue-600";
    return "text-green-600";
  };

  const passwordsMatch = confirmPassword && newPassword === confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white px-6 py-6 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            <h1 className="text-xl">Security Center</h1>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-md mx-auto">
        {/* Security Tips Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-5 mb-6 border border-blue-100 shadow-md"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500 rounded-2xl shadow-lg">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-800 mb-2">Keep your account secure</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Use a strong password with letters, numbers and symbols</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Don't share your password with anyone</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Change your password regularly</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Change Password Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100"
        >
          <h2 className="text-gray-800 mb-6 flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Lock className="w-4 h-4 text-white" />
            </div>
            Change Password
          </h2>

          <div className="space-y-5">
            {/* Current Password */}
            <div>
              <label className="block text-xs text-gray-600 mb-2">Current Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-11 pr-11 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs text-gray-600 mb-2">New Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-11 pr-11 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Password Strength */}
              <AnimatePresence>
                {newPassword && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3"
                  >
                    <div className="flex gap-1.5 mb-2">
                      {[1, 2, 3, 4].map((level) => (
                        <motion.div
                          key={level}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: passwordStrength() >= level ? 1 : 0.3 }}
                          transition={{ duration: 0.3, delay: level * 0.05 }}
                          className={`h-1.5 flex-1 rounded-full transition-all origin-left ${
                            passwordStrength() >= level 
                              ? `bg-gradient-to-r ${strengthColor()}` 
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-600">
                        Password strength: <span className={`${strengthTextColor()}`}>{strengthText()}</span>
                      </p>
                      {passwordStrength() >= 3 && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs text-gray-600 mb-2">Confirm New Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className={`w-full pl-11 pr-11 py-3.5 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:bg-white transition-all ${
                    confirmPassword && (passwordsMatch ? 'border-green-500' : 'border-red-500')
                  } ${!confirmPassword && 'border-gray-200 focus:border-blue-500'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                
                {/* Match indicator */}
                <AnimatePresence>
                  {confirmPassword && (
                    <motion.div
                      initial={{ scale: 0, x: 10 }}
                      animate={{ scale: 1, x: 0 }}
                      exit={{ scale: 0, x: 10 }}
                      className="absolute right-12 top-1/2 -translate-y-1/2"
                    >
                      {passwordsMatch ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Match message */}
              <AnimatePresence>
                {confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={`text-xs mt-2 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleChangePassword}
            className="w-full mt-6 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 text-white py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-5 h-5" />
            <span>Change Password</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
