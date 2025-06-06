"use client";

import { changelogConfig } from "@/lib/config/changelog-config";
import { Changelog } from "@/components/changelog/changelog";
import { HeroSection } from "@/components/home/hero-section";
import { UserActionCards } from "@/components/home/user-action-cards";
import { ExistingUserModal } from "@/components/home/existing-user-modal";
import { useUserActions } from "@/hooks/use-user-actions";

export default function Home() {
  const {
    isCreatingUser,
    showExistingUserModal,
    userId,
    isCheckingUser,
    setUserId,
    handleCreateNewUser,
    handleShowExistingUserModal,
    handleCloseModal,
    handleExistingUserSubmit,
  } = useUserActions();

  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center pt-16">
      <div className="container relative flex flex-col items-center justify-center gap-12 px-4 py-16">
        <HeroSection />

        <UserActionCards
          isCreatingUser={isCreatingUser}
          onCreateNewUser={handleCreateNewUser}
          onShowExistingUserModal={handleShowExistingUserModal}
        />

        <Changelog
          includePrerelease={changelogConfig.display.includePrerelease}
        />
      </div>

      <ExistingUserModal
        isOpen={showExistingUserModal}
        userId={userId}
        isCheckingUser={isCheckingUser}
        onClose={handleCloseModal}
        onSubmit={handleExistingUserSubmit}
        onUserIdChange={setUserId}
      />
    </main>
  );
}
