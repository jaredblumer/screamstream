import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Bug, AlertTriangle, Link, Plus, MessageSquare } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { InsertFeedback } from '@shared/schema';

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
  contentId?: number;
  initialType?: string;
  initialTitle?: string;
}

export default function FeedbackForm({
  isOpen,
  onClose,
  contentId,
  initialType = '',
  initialTitle = '',
}: FeedbackFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    type: initialType,
    category: '',
    title: initialTitle,
    description: '',
    contentId: contentId || null,
    userEmail: '',
    priority: 'medium',
  });

  const submitFeedback = useMutation({
    mutationFn: async (data: InsertFeedback) => {
      return await apiRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Feedback submitted',
        description: "Thank you for your report. We'll review it and take appropriate action.",
      });
      onClose();
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
    },
    onError: (error) => {
      toast({
        title: 'Submission failed',
        description: 'Unable to submit feedback. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      type: '',
      category: '',
      title: '',
      description: '',
      contentId: null,
      userEmail: '',
      priority: 'medium',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.title || !formData.description) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    submitFeedback.mutate(formData);
  };

  const feedbackTypes = [
    {
      value: 'technical',
      label: 'Technical Issue',
      icon: Bug,
      description: 'Bugs, errors, or site functionality problems',
    },
    {
      value: 'data_error',
      label: 'Incorrect Data',
      icon: AlertTriangle,
      description: 'Wrong movie info, ratings, or platform availability',
    },
    {
      value: 'broken_link',
      label: 'Broken Link',
      icon: Link,
      description: 'Dead links, missing images, or inaccessible content',
    },
    {
      value: 'content_request',
      label: 'Content Request',
      icon: Plus,
      description: 'Request missing movies or series to be added',
    },
    {
      value: 'other',
      label: 'Other',
      icon: MessageSquare,
      description: 'General feedback or suggestions',
    },
  ];

  const categoryOptions: Record<string, string[]> = {
    technical: [
      'Login Issues',
      'Page Loading',
      'Search Problems',
      'Filter Errors',
      'Mobile Issues',
    ],
    data_error: [
      'Wrong Year',
      'Incorrect Rating',
      'Missing Platform',
      'Wrong Subgenre',
      'Description Error',
    ],
    broken_link: ['Poster Image', 'Streaming Link', 'External Link', 'Internal Navigation'],
    content_request: ['Missing Movie', 'Missing Series', 'New Release', 'Classic Horror'],
    other: ['Interface Suggestion', 'Feature Request', 'General Feedback', 'Accessibility'],
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="horror-bg border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Report an Issue</DialogTitle>
          <DialogDescription className="text-gray-400">
            Help us improve Scream Stream by reporting technical issues, data errors, or suggesting
            improvements.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Issue Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white">Issue Type *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {feedbackTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        type: type.value,
                        category: '', // Reset category when type changes
                      }))
                    }
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      formData.type === type.value
                        ? 'border-red-500 bg-red-900/20'
                        : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800/70'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-white">{type.label}</div>
                        <div className="text-sm text-gray-400 mt-1">{type.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Selection */}
          {formData.type && categoryOptions[formData.type] && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Category</label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="horror-bg border-gray-700 text-white">
                  <SelectValue placeholder="Select a specific category" />
                </SelectTrigger>
                <SelectContent className="horror-bg border-gray-700">
                  {categoryOptions[formData.type].map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Brief description of the issue"
              className="horror-bg border-gray-700 text-white"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Description *</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Provide detailed information about the issue. Include steps to reproduce if it's a technical problem."
              className="horror-bg border-gray-700 text-white min-h-[120px]"
              required
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Priority</label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
            >
              <SelectTrigger className="horror-bg border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="horror-bg border-gray-700">
                <SelectItem value="low">Low - Minor issue</SelectItem>
                <SelectItem value="medium">Medium - Affects functionality</SelectItem>
                <SelectItem value="high">High - Major issue</SelectItem>
                <SelectItem value="critical">Critical - Site unusable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Optional Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Email (Optional)</label>
            <Input
              type="email"
              value={formData.userEmail}
              onChange={(e) => setFormData((prev) => ({ ...prev, userEmail: e.target.value }))}
              placeholder="Enter your email if you'd like a response"
              className="horror-bg border-gray-700 text-white"
            />
            <p className="text-xs text-gray-400">
              We'll only use this to follow up on your report if needed.
            </p>
          </div>

          {/* Content Reference */}
          {contentId && (
            <Alert className="border-red-600/50 bg-red-900/20">
              <AlertDescription className="text-red-200">
                This report will be linked to the specific content you were viewing.
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={submitFeedback.isPending}
              className="bg-red-900 hover:bg-red-800 flex-1"
            >
              {submitFeedback.isPending ? 'Submitting...' : 'Submit Report'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
