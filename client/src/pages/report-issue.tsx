import { Button } from '@/components/ui/button';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Bug, AlertTriangle, Link, Plus, MessageSquare } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { InsertIssue } from '@shared/schema';

export default function ReportIssue() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    type: '',
    category: '',
    title: '',
    description: '',
    userEmail: '',
    priority: 'medium',
  });

  const submitIssue = useMutation({
    mutationFn: async (data: InsertIssue) => {
      return await apiRequest('POST', '/api/report-issue', data);
    },
    onSuccess: () => {
      toast({
        title: 'Issue submitted',
        description: "Thank you for your report. We'll review it and take appropriate action.",
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/report-issues'] });
    },
    onError: (error) => {
      console.error('[report-issue] submit error:', error);
      toast({
        title: 'Submission failed',
        description: 'Unable to submit issue. Please try again.',
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
      userEmail: '',
      priority: 'medium',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[report-issue] submit clicked', formData);
    if (!formData.type || !formData.title || !formData.description) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    submitIssue.mutate(formData);
  };

  const issueTypes = [
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
    content_request: ['Missing Movie', 'Missing Series'],
    other: ['Interface Suggestion', 'Feature Request', 'General Feedback', 'Accessibility'],
  };

  return (
    <>
      <Header />

      <div className="horror-bg">
        <div className="text-center mx-auto px-6 py-8 sm:py-12 animate-fade-in">
          <div className="mb-2">
            <h1 className="text-4xl sm:text-5xl font-bold text-white text-center">
              Report <span className="blood-red">Issue</span>
            </h1>
          </div>
          <p className="text-base sm:text-xl text-gray-300 max-w-3xl mx-auto">
            Help us improve Scream Stream by reporting technical issues, data errors, or suggesting
            improvements.
          </p>
        </div>

        <div className="flex justify-center">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Issue Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">Issue Type *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {issueTypes.map((type) => {
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
                  <SelectContent className="horror-bg border-gray-700 text-white">
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
                <SelectContent className="horror-bg border-gray-700 text-white">
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

            {/* Submit Button */}
            <div className="flex gap-3 pb-6">
              <Button
                type="submit"
                disabled={submitIssue.isPending}
                className="bg-red-900 hover:bg-red-800 flex-1"
              >
                {submitIssue.isPending ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </>
  );
}
