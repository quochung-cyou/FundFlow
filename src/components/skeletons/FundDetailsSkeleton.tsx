import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Skeleton loader for the Fund Details page
 * Shows a realistic page layout with animated loading placeholders
 */
export function FundDetailsSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl py-4 sm:py-6 px-4 sm:px-6">
      {/* Fund Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
        <div className="flex items-start gap-4">
          <Skeleton className="w-16 h-16 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
            <div className="mt-2">
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:self-start">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
      
      {/* Main Content Skeleton */}
      <div className="space-y-6">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="mb-4 w-full sm:w-auto">
            <TabsTrigger value="summary" className="flex-1 sm:flex-auto">Tổng quan</TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1 sm:flex-auto">Giao dịch</TabsTrigger>
          </TabsList>
          
          {/* Summary Tab Skeleton */}
          <TabsContent value="summary" className="animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="hover-scale">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      <Skeleton className="h-4 w-24" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-28" />
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle><Skeleton className="h-6 w-40" /></CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <div className="w-full h-full flex items-center justify-center">
                    <Skeleton className="w-full h-[250px] rounded-md" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-6 w-6" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Transactions Tab Skeleton */}
          <TabsContent value="transactions" className="animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Skeleton className="h-10 w-full sm:w-60" />
                <Skeleton className="h-10 w-full sm:w-48" />
              </div>
              <Skeleton className="h-10 w-full sm:w-32" />
            </div>
            
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-card rounded-lg border p-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Skeleton className="h-6 w-28" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
