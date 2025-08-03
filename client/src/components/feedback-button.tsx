import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import FeedbackForm from './feedback-form';

interface FeedbackButtonProps {
  contentId?: number;
  initialType?: string;
  initialTitle?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export default function FeedbackButton({
  contentId,
  initialType = '',
  initialTitle = '',
  variant = 'ghost',
  size = 'sm',
  className = '',
}: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={`${className}`}
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        Report Issue
      </Button>

      <FeedbackForm
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        contentId={contentId}
        initialType={initialType}
        initialTitle={initialTitle}
      />
    </>
  );
}
