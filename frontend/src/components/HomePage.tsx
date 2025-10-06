import React from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MembershipLevels } from './MembershipLevels';

interface HomePageProps {
  onNavigateToMy: () => void;
}

export function HomePage({ onNavigateToMy }: HomePageProps) {
  return (
    <>
      {/* Luxury Watch Hero Image */}
      <div className="px-4 py-6">
        <ImageWithFallback 
          src="https://images.unsplash.com/photo-1730757679771-b53e798846cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB3YXRjaCUyMGVsZWdhbnQlMjB0aW1lcGllY2V8ZW58MXx8fHwxNzU5NTU2ODg4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Luxury Watch"
          className="w-full h-48 object-cover rounded-lg shadow-lg"
        />
      </div>
      
      {/* Membership Levels Section */}
      <MembershipLevels onNavigateToMy={onNavigateToMy} />
    </>
  );
}