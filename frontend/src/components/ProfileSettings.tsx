import { X, User, Mail, Phone, Calendar, MapPin, GraduationCap, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface ProfileSettingsProps {
  onClose: () => void;
  user?: any;
}

export function ProfileSettings({ onClose, user }: ProfileSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    avatarUrl: user?.user_metadata?.avatar_url || '',
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    dateOfBirth: '',
    address: '',
    studentId: '',
    department: 'Computer Science',
    semester: '1st Semester',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else if (data) {
          setFormData({
            avatarUrl: data.avatar_url || user?.user_metadata?.avatar_url || '',
            fullName: data.full_name || user?.user_metadata?.full_name || '',
            email: data.email || user?.email || '',
            phone: data.phone || '',
            dateOfBirth: data.date_of_birth || '',
            address: data.address || '',
            studentId: data.student_id || '',
            department: data.department || 'Computer Science',
            semester: data.semester || '1st Semester',
          });
        }
      } finally {
        setFetching(false);
      }
    }

    fetchProfile();
  }, [user]);

  const handleChange = (field: string, value: string) => {
    // If it's the studentId field, only allow numbers and hyphens
    if (field === 'studentId') {
      const filteredValue = value.replace(/[^0-9-]/g, '');
      setFormData(prev => ({ ...prev, [field]: filteredValue }));
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`; // Use Date.now() for unique filenames
      const filePath = fileName;

      console.log("DEBUG: Attempting to upload avatar to:", filePath);

      // Upload the file to 'avatars' bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('DEBUG: Upload error details:', uploadError);
        throw uploadError;
      }

      console.log("DEBUG: Upload successful:", uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log("DEBUG: Generated public URL:", publicUrl);

      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
      toast.success('Photo uploaded! Click Save to keep it.');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      let errorMessage = 'Failed to upload image.';
      if (error.message?.includes('bucket')) {
        errorMessage = 'Storage bucket "avatars" not found. Please create it in Supabase.';
      } else if (error.status === 403 || error.message?.includes('policy')) {
        errorMessage = 'Permission denied. Please check your Supabase Storage RLS policies.';
      }
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      console.error('DEBUG: No user ID found during save');
      return;
    }

    setLoading(true);
    console.log("DEBUG: Starting profile update for user:", user.id);
    console.log("DEBUG: Data to save:", formData);

    try {
      // Handle empty date to avoid Supabase errors (date type needs null or valid date)
      const dateToSave = formData.dateOfBirth === '' ? null : formData.dateOfBirth;

      console.log("DEBUG: Sending upsert request to Supabase profiles table...");

      const { data, error, status } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: formData.avatarUrl,
          full_name: formData.fullName,
          email: user.email, // Ensure email is kept in sync
          phone: formData.phone,
          date_of_birth: dateToSave,
          address: formData.address,
          student_id: formData.studentId,
          department: formData.department,
          semester: formData.semester,
          updated_at: new Date().toISOString(),
        })
        .select();

      console.log("DEBUG: Supabase response status:", status);

      if (error) {
        console.error('DEBUG: Supabase save error:', error);
        toast.error(`Error ${error.code}: ${error.message}`);
        throw error;
      }

      console.log("DEBUG: Saved Data Result:", data);

      // 4. ALSO update Supabase Auth Metadata so the frontend 'user' object stays in sync
      console.log("DEBUG: Syncing Supabase Auth metadata...");
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          avatar_url: formData.avatarUrl,
          full_name: formData.fullName
        }
      });

      if (authError) {
        console.error('DEBUG: Auth metadata sync failed:', authError);
        // We don't throw here to avoid blocking a successful profile save
      } else {
        console.log("DEBUG: Auth metadata synced successfully");
      }

      toast.success('Profile saved successfully!');
      onClose();
    } catch (error: any) {
      console.error('DEBUG: Save failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E1F20] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-[#2D2E30] relative">
        {fetching && (
          <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2D2E30]">
          <h2 className="text-2xl text-white">Profile Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2D2E30] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#A0A0A0]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-[#3D3E40] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden relative group">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-white" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-[#3D3E40] hover:bg-[#4D4E50] rounded-lg transition-colors text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Change Photo'}
              </button>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-white text-lg">Personal Information</h3>

              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-[#A0A0A0] text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className="w-full bg-[#2D2E30] text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-[#4D4E50] transition-all"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[#A0A0A0] text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full bg-[#2D2E30] text-[#A0A0A0] px-4 py-3 rounded-lg outline-none opacity-60 cursor-not-allowed"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-[#A0A0A0] text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full bg-[#2D2E30] text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-[#4D4E50] transition-all"
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="text-[#A0A0A0] text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  className="w-full bg-[#2D2E30] text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-[#4D4E50] transition-all"
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-[#A0A0A0] text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full bg-[#2D2E30] text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-[#4D4E50] transition-all"
                />
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4 pt-4 border-t border-[#2D2E30]">
              <h3 className="text-white text-lg">Academic Information</h3>

              {/* Student ID */}
              <div className="space-y-2">
                <label className="text-[#A0A0A0] text-sm flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Student ID
                </label>
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => handleChange('studentId', e.target.value)}
                  className="w-full bg-[#2D2E30] text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-[#4D4E50] transition-all"
                />
              </div>

              {/* Department */}
              <div className="space-y-2">
                <label className="text-[#A0A0A0] text-sm">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  className="w-full bg-[#2D2E30] text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-[#4D4E50] transition-all"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                </select>
              </div>

              {/* Semester */}
              <div className="space-y-2">
                <label className="text-[#A0A0A0] text-sm">Current Semester</label>
                <select
                  value={formData.semester}
                  onChange={(e) => handleChange('semester', e.target.value)}
                  className="w-full bg-[#2D2E30] text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-[#4D4E50] transition-all"
                >
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="3rd Semester">3rd Semester</option>
                  <option value="4th Semester">4th Semester</option>
                  <option value="5th Semester">5th Semester</option>
                  <option value="6th Semester">6th Semester</option>
                  <option value="7th Semester">7th Semester</option>
                  <option value="8th Semester">8th Semester</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#2D2E30]">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 bg-[#2D2E30] hover:bg-[#3D3E40] rounded-lg transition-colors text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-3 bg-[#3D3E40] hover:bg-[#4D4E50] rounded-lg transition-colors text-white flex items-center justify-center gap-2 min-w-[140px] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
