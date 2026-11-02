import React from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full text-center space-y-4 p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold text-[#101828]">404 — Page Not Found</h1>
          <p className="text-xs text-[#667085] leading-relaxed">
            The meeting room or dashboard view you requested could not be located.
          </p>
        </div>
        <div className="pt-2">
          <Link to="/app">
            <Button variant="primary" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
              Return to Workspace
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
