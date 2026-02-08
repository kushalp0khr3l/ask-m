interface LogoutModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  userName?: string;
  userEmail?: string;
}

export function LogoutModal({ onConfirm, onCancel, userName, userEmail }: LogoutModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-[#1E1F20] rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-[#2D2E30]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {/* Title */}
          <h2 className="text-white text-2xl text-center mb-4">
            Are you sure you want to log out?
          </h2>

          {/* Subtitle with username and email */}
          <p className="text-[#A0A0A0] text-center mb-8">
            Log out of Ask-M as <span className="text-white">{userName}</span>?
          </p>

          {/* Buttons */}
          <div className="space-y-3">
            {/* Log out button - Primary white */}
            <button
              onClick={onConfirm}
              className="w-full bg-white hover:bg-gray-100 text-black font-medium py-3.5 px-6 rounded-full transition-colors"
            >
              Log out
            </button>

            {/* Cancel button - Secondary dark */}
            <button
              onClick={onCancel}
              className="w-full bg-transparent hover:bg-[#2D2E30] text-white font-medium py-3.5 px-6 rounded-full border border-[#3D3E40] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}